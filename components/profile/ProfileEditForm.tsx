"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { User, UserProfileSkill, UserFeaturedProject, ProjectSpace } from "@/lib/types";
import { useUpdateProfile, useUpdateSkills, useUpdateFeaturedProjects, useUploadAvatar, useUploadBanner } from "@/lib/hooks/useProfile";
import { useAuth } from "@/lib/hooks/useAuth";
import * as spacesApi from "@/lib/services/spacesApi";
import { syncMyGithubProfile, syncMyLeetcodeProfile } from "@/lib/services/profilesApi";
import {
  CheckIcon,
  XIcon,
  PlusIcon,
  GitHubIcon,
  LinkedInIcon,
  GlobeIcon,
  MapPinIcon,
  LinkIcon,
  CodeBracketIcon,
  SparklesIcon,
  RocketIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CameraIcon,
  BriefcaseIcon,
  EyeIcon,
} from "@/components/ui/Icons";
import Spinner from "@/components/ui/Spinner";
import Avatar from "@/components/ui/Avatar";
import { getInitials } from "@/lib/utils";
import AvatarCropModal from "./AvatarCropModal";
import {
  githubUrlFromUsername,
  githubUsernameFromInput,
  isValidGithubUsername,
} from "@/lib/githubProfile";
import { isValidLeetcodeUsername, normalizeLeetcodeUsername } from "@/lib/leetcodeProfile";

interface ProfileEditFormProps {
  profile: User;
  initialSkills: UserProfileSkill[];
  initialFeatured: UserFeaturedProject[];
  onSaved?: (updated: User) => void;
}

const INPUT_CLASS =
  "w-full pl-3 pr-10 py-2.5 rounded-xl bg-surface-hover/60 border border-border-strong/80 text-text-primary text-sm placeholder:text-text-disabled focus:outline-none focus:border-border-strong focus:bg-surface-hover transition-all";

const INPUT_ICON_CLASS =
  "w-full pl-9 pr-10 py-2.5 rounded-xl bg-surface-hover/60 border border-border-strong/80 text-text-primary text-sm placeholder:text-text-disabled focus:outline-none focus:border-border-strong focus:bg-surface-hover transition-all";

const TEXTAREA_CLASS =
  "w-full px-3 py-2.5 rounded-xl bg-surface-hover/60 border border-border-strong/80 text-text-primary text-sm placeholder:text-text-disabled focus:outline-none focus:border-border-strong focus:bg-surface-hover transition-all resize-none";

function CharBadge({ current, max }: { current: number; max: number }) {
  const near = current > max * 0.8;
  return (
    <span
      className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tabular-nums pointer-events-none ${
        near ? "text-amber-400" : "text-text-disabled"
      }`}
    >
      {current}/{max}
    </span>
  );
}

export default function ProfileEditForm({
  profile,
  initialSkills,
  initialFeatured,
  onSaved,
}: ProfileEditFormProps) {
  const { user: currentUser, refreshUser } = useAuth();
  const [name, setName] = useState(profile.name ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url ?? "");
  const [githubUsername, setGithubUsername] = useState(
    () => githubUsernameFromInput(profile.github_url)
  );
  const [leetcodeUsername, setLeetcodeUsername] = useState(profile.leetcode_username ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? "");
  const [pronouns, setPronouns] = useState(profile.pronouns ?? "");
  const [githubFieldError, setGithubFieldError] = useState<string | null>(null);
  const [githubSyncError, setGithubSyncError] = useState<string | null>(null);
  const [githubSyncing, setGithubSyncing] = useState(false);
  const [leetcodeFieldError, setLeetcodeFieldError] = useState<string | null>(null);
  const [leetcodeSyncError, setLeetcodeSyncError] = useState<string | null>(null);
  const [leetcodeSyncing, setLeetcodeSyncing] = useState(false);

  const [skills, setSkills] = useState<string[]>(
    initialSkills.map((s) => s.skill)
  );
  const [skillInput, setSkillInput] = useState("");

  const [featuredIds, setFeaturedIds] = useState<string[]>(
    initialFeatured.map((f) => f.space.id)
  );
  const [mySpaces, setMySpaces] = useState<ProjectSpace[]>([]);
  const [spacesLoading, setSpacesLoading] = useState(true);

  const { update, loading: profileLoading, error: profileError, success: profileSuccess } = useUpdateProfile();
  const { updateSkills, loading: skillsLoading, error: skillsError } = useUpdateSkills();
  const { updateFeatured, loading: featuredLoading, error: featuredError } = useUpdateFeaturedProjects();
  const { upload: uploadAvatar, remove: removeAvatar, loading: avatarLoading, error: avatarError } = useUploadAvatar();
  const { upload: uploadBanner, remove: removeBanner, loading: bannerLoading, error: bannerError } = useUploadBanner();

  const loading = profileLoading || skillsLoading || featuredLoading || githubSyncing || leetcodeSyncing;
  const anyError = profileError || skillsError || featuredError || avatarError || bannerError || githubSyncError || leetcodeSyncError;

  useEffect(() => {
    spacesApi
      .listSpaces({ page: 1 })
      .then((res) => {
        setMySpaces(res.spaces ?? []);
      })
      .catch(() => setMySpaces([]))
      .finally(() => setSpacesLoading(false));
  }, []);

  const addSkill = useCallback(() => {
    const t = skillInput.trim();
    if (!t || skills.includes(t) || skills.length >= 10) return;
    setSkills((prev) => [...prev, t]);
    setSkillInput("");
  }, [skillInput, skills]);

  const removeSkill = useCallback((skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }, []);

  const toggleFeatured = useCallback((spaceId: string) => {
    setFeaturedIds((prev) => {
      if (prev.includes(spaceId)) return prev.filter((id) => id !== spaceId);
      if (prev.length >= 3) return prev;
      return [...prev, spaceId];
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedGithubUser = githubUsernameFromInput(githubUsername);
    if (normalizedGithubUser && !isValidGithubUsername(normalizedGithubUser)) {
      setGithubFieldError("Enter a valid GitHub username (letters, numbers, hyphens).");
      return;
    }
    setGithubFieldError(null);

    const normalizedLeetcodeUser = normalizeLeetcodeUsername(leetcodeUsername);
    if (!isValidLeetcodeUsername(normalizedLeetcodeUser)) {
      setLeetcodeFieldError("Enter a valid LeetCode username (letters, numbers, underscores, hyphens).");
      return;
    }
    setLeetcodeFieldError(null);

    const github_url = githubUrlFromUsername(normalizedGithubUser);

    const [updatedProfile] = await Promise.all([
      update({ name, username, headline, bio, location, website_url: websiteUrl, github_url, leetcode_username: normalizedLeetcodeUser, linkedin_url: linkedinUrl, pronouns }),
      updateSkills(skills),
      updateFeatured(featuredIds),
    ]);

    if (updatedProfile && normalizedGithubUser) {
      setGithubSyncing(true);
      setGithubSyncError(null);
      try {
        await syncMyGithubProfile();
      } catch (error: unknown) {
        setGithubSyncError(error instanceof Error ? error.message : "Profile saved, but GitHub data could not be refreshed.");
      } finally {
        setGithubSyncing(false);
      }
    }

    if (updatedProfile && normalizedLeetcodeUser) {
      setLeetcodeSyncing(true);
      setLeetcodeSyncError(null);
      try {
        await syncMyLeetcodeProfile();
      } catch (error: unknown) {
        setLeetcodeSyncError(error instanceof Error ? error.message : "Profile saved, but LeetCode data could not be refreshed.");
      } finally {
        setLeetcodeSyncing(false);
      }
    }

    if (updatedProfile && onSaved) {
      onSaved(updatedProfile);
    }
  };

  const handleAvatarFile = async (file: File) => {
    const updated = await uploadAvatar(file);
    if (updated && currentUser) refreshUser(updated);
  };

  const handleAvatarRemove = async () => {
    const updated = await removeAvatar();
    if (updated && currentUser) refreshUser(updated);
  };

  const handleBannerFile = async (file: File) => {
    const updated = await uploadBanner(file);
    if (updated && currentUser) refreshUser(updated);
  };

  const handleBannerRemove = async () => {
    const updated = await removeBanner();
    if (updated && currentUser) refreshUser(updated);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Avatar & Banner ── */}
      <ProfileImageUploader
        profile={profile}
        avatarLoading={avatarLoading}
        bannerLoading={bannerLoading}
        onAvatarFile={handleAvatarFile}
        onAvatarRemove={handleAvatarRemove}
        onBannerFile={handleBannerFile}
        onBannerRemove={handleBannerRemove}
      />

      {/* ── Profile Basics ── */}
      <div className="rounded-2xl border border-border-default bg-surface/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-border-default/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Profile Basics</h2>
              <p className="text-xs text-text-disabled">Your public identity on the platform</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-5 space-y-5">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Display Name</label>
            <div className="relative">
              <input
                className={INPUT_CLASS}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={255}
              />
              <CharBadge current={name.length} max={255} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled text-sm pointer-events-none font-medium">
                @
              </span>
              <input
                className="w-full pl-7 pr-10 py-2.5 rounded-xl bg-surface-hover/60 border border-border-strong/80 text-text-primary text-sm placeholder:text-text-disabled focus:outline-none focus:border-border-strong focus:bg-surface-hover transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="your_username"
                maxLength={50}
                pattern="[a-z0-9_]+"
              />
              <CharBadge current={username.length} max={50} />
            </div>
            <p className="text-[11px] text-text-disabled mt-1.5">
              3–50 lowercase letters, numbers, underscores. URL: /profile/<span className="text-text-muted">{username || "..."}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Headline</label>
            <div className="relative">
              <input
                className={INPUT_CLASS}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Full-stack engineer · building in public"
                maxLength={140}
              />
              <CharBadge current={headline.length} max={140} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Bio</label>
            <div className="relative">
              <textarea
                className={TEXTAREA_CLASS}
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What do you work on? What excites you technically?"
                maxLength={2000}
              />
              <span className="absolute right-3 bottom-3 text-[10px] tabular-nums text-text-disabled pointer-events-none">
                {bio.length}/2000
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Location</label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled w-4 h-4 pointer-events-none" />
              <input
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-hover/60 border border-border-strong/80 text-text-primary text-sm placeholder:text-text-disabled focus:outline-none focus:border-border-strong focus:bg-surface-hover transition-all"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="San Francisco, CA"
                maxLength={120}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Pronouns</label>
            <input
              className={INPUT_CLASS}
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              placeholder="e.g. she/her, they/them"
              maxLength={40}
            />
            <p className="text-[11px] text-text-disabled mt-1.5">Shown on your profile. Optional.</p>
          </div>

          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <BriefcaseIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Opportunity preferences</p>
                <p className="text-xs text-text-disabled mt-0.5">Manage company visibility, resume, experience, and hiring privacy.</p>
              </div>
            </div>
            <Link href="/settings/opportunities" className="rounded-lg border border-border-default bg-surface-hover px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary">
              Open
            </Link>
          </div>
        </div>
      </div>

      {/* ── Links ── */}
      <div className="mt-5 rounded-2xl border border-border-default bg-surface/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-border-default/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <LinkIcon className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Links</h2>
              <p className="text-xs text-text-disabled">Connect your external presence</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-5 space-y-5">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Website</label>
            <div className="relative">
              <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled w-4 h-4 pointer-events-none" />
              <input
                className={INPUT_ICON_CLASS}
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yoursite.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">GitHub username</label>
            <div className="flex items-center rounded-xl bg-surface-hover/60 border border-border-strong/80 focus-within:border-border-strong focus-within:bg-surface-hover transition-all">
              <span className="flex items-center gap-2 pl-3 text-text-disabled text-sm select-none shrink-0">
                <GitHubIcon className="w-4 h-4" />
                github.com/
              </span>
              <input
                className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 text-text-primary text-sm placeholder:text-text-disabled focus:outline-none"
                type="text"
                inputMode="text"
                autoComplete="username"
                spellCheck={false}
                value={githubUsername}
                onChange={(e) => {
                  setGithubUsername(e.target.value.replace(/\s/g, ""));
                  if (githubFieldError) setGithubFieldError(null);
                }}
                placeholder="yourusername"
                maxLength={39}
                aria-invalid={Boolean(githubFieldError)}
                aria-describedby="github-username-hint"
              />
            </div>
            <p id="github-username-hint" className="text-[11px] text-text-disabled mt-1.5">
              Your public GitHub handle — repository count and contribution calendar refresh when you save.
            </p>
            {githubFieldError ? (
              <p className="text-[11px] text-rose-400 mt-1" role="alert">{githubFieldError}</p>
            ) : null}
            {githubSyncError ? (
              <p className="text-[11px] text-amber-300 mt-1" role="alert">{githubSyncError}</p>
            ) : null}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">LeetCode username</label>
            <div className="flex items-center rounded-xl bg-surface-hover/60 border border-border-strong/80 focus-within:border-border-strong focus-within:bg-surface-hover transition-all">
              <span className="flex items-center gap-2 pl-3 text-text-disabled text-sm select-none shrink-0">
                <CodeBracketIcon className="w-4 h-4 text-amber-400" />
                leetcode.com/u/
              </span>
              <input
                className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 text-text-primary text-sm placeholder:text-text-disabled focus:outline-none"
                type="text"
                autoComplete="username"
                spellCheck={false}
                value={leetcodeUsername}
                onChange={(e) => {
                  setLeetcodeUsername(e.target.value.replace(/\s/g, ""));
                  if (leetcodeFieldError) setLeetcodeFieldError(null);
                }}
                placeholder="yourusername"
                maxLength={50}
                aria-invalid={Boolean(leetcodeFieldError)}
                aria-describedby="leetcode-username-hint"
              />
            </div>
            <p id="leetcode-username-hint" className="text-[11px] text-text-disabled mt-1.5">
              Your public LeetCode handle — solved problems and contest profile refresh when you save.
            </p>
            {leetcodeFieldError ? <p className="text-[11px] text-rose-400 mt-1" role="alert">{leetcodeFieldError}</p> : null}
            {leetcodeSyncError ? <p className="text-[11px] text-amber-300 mt-1" role="alert">{leetcodeSyncError}</p> : null}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">LinkedIn</label>
            <div className="relative">
              <LinkedInIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled w-4 h-4 pointer-events-none" />
              <input
                className={INPUT_ICON_CLASS}
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourusername"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tech Stack ── */}
      <div className="mt-5 rounded-2xl border border-border-default bg-surface/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-border-default/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <CodeBracketIcon className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Tech Stack</h2>
              <p className="text-xs text-text-disabled">Add up to 10 skills that represent your expertise</p>
            </div>
            <span className="ml-auto text-xs tabular-nums text-text-disabled">
              {skills.length}/10
            </span>
          </div>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="flex gap-2">
            <input
              className={`${INPUT_CLASS} flex-1`}
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="e.g. TypeScript, Python, React"
              maxLength={60}
              disabled={skills.length >= 10}
            />
            <button
              type="button"
              onClick={addSkill}
              disabled={!skillInput.trim() || skills.length >= 10}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-surface-hover border border-border-strong text-text-secondary hover:bg-surface-active hover:text-text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Add skill"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>

          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-2 pl-3.5 pr-2.5 py-2 rounded-full bg-surface-hover border border-border-strong/80 text-sm text-text-secondary hover:border-border-strong transition-colors group"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-text-disabled hover:text-rose-400 hover:bg-rose-400/10 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${skill}`}
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-disabled italic py-2">
              No skills added yet. Add technologies, languages, and tools you work with.
            </p>
          )}

          {skills.length >= 10 && (
            <p className="text-xs text-amber-400 font-medium">Maximum 10 skills reached.</p>
          )}
        </div>
      </div>

      {/* ── Featured Projects ── */}
      <div className="mt-5 rounded-2xl border border-border-default bg-surface/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-border-default/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Featured Projects</h2>
              <p className="text-xs text-text-disabled">Pin up to 3 projects to your profile</p>
            </div>
            <span className="ml-auto text-xs tabular-nums text-text-disabled">
              {featuredIds.length}/3
            </span>
          </div>
        </div>
        <div className="px-5 py-5">
          {spacesLoading ? (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          ) : mySpaces.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-default px-4 py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-3">
                <RocketIcon className="w-5 h-5 text-text-disabled" />
              </div>
              <p className="text-sm text-text-disabled">
                No spaces yet.{" "}
                <span className="text-text-muted">Create or join a space first.</span>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {mySpaces.slice(0, 20).map((space) => {
                const selected = featuredIds.includes(space.id);
                const disabled = !selected && featuredIds.length >= 3;
                return (
                  <button
                    key={space.id}
                    type="button"
                    onClick={() => toggleFeatured(space.id)}
                    disabled={disabled}
                    className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all ${
                      selected
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : disabled
                        ? "border-border-default/50 bg-surface/20 opacity-40 cursor-not-allowed"
                        : "border-border-default bg-surface/30 hover:border-border-strong hover:bg-surface/60"
                    }`}
                    aria-pressed={selected}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-border-strong/60 flex items-center justify-center text-sm font-bold text-text-primary shrink-0">
                      {space.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{space.name}</p>
                      <p className="text-xs text-text-disabled truncate mt-0.5">{space.summary || "No summary"}</p>
                    </div>
                    {selected ? (
                      <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                      </span>
                    ) : (
                      <span className="shrink-0 w-6 h-6 rounded-full border border-border-strong flex items-center justify-center">
                        <PlusIcon className="w-3 h-3 text-text-disabled" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Feedback ── */}
      {anyError && (
        <div className="mt-5 rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 flex items-center gap-2.5">
          <XCircleIcon className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="text-sm text-rose-300">{anyError}</p>
        </div>
      )}
      {profileSuccess && !loading && !anyError && (
        <div className="mt-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex items-center gap-2.5">
          <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300">Profile saved successfully!</p>
        </div>
      )}

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {loading ? (
          <>
            <Spinner size="sm" />
            Saving…
          </>
        ) : (
          <>
            <CheckIcon className="w-4 h-4" />
            Save Profile
          </>
        )}
      </button>
    </form>
  );
}

interface ProfileImageUploaderProps {
  profile: User;
  avatarLoading: boolean;
  bannerLoading: boolean;
  onAvatarFile: (file: File) => Promise<unknown>;
  onAvatarRemove: () => Promise<unknown>;
  onBannerFile: (file: File) => Promise<unknown>;
  onBannerRemove: () => Promise<unknown>;
}

function ProfileImageUploader({
  profile,
  avatarLoading,
  bannerLoading,
  onAvatarFile,
  onAvatarRemove,
  onBannerFile,
  onBannerRemove,
}: ProfileImageUploaderProps) {
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);

  const handleAvatar = (file: File) => {
    setAvatarError(null);
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Avatar must be 5MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBanner = async (file: File) => {
    setBannerError(null);
    if (!file.type.startsWith("image/")) {
      setBannerError("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setBannerError("Banner must be 8MB or smaller.");
      return;
    }
    try {
      await onBannerFile(file);
    } catch {
      setBannerError("Upload failed.");
    }
  };

  const triggerAvatar = () => {
    const el = document.getElementById("profile-avatar-input") as HTMLInputElement | null;
    el?.click();
  };
  const triggerBanner = () => {
    const el = document.getElementById("profile-banner-input") as HTMLInputElement | null;
    el?.click();
  };

  return (
    <div className="rounded-2xl border border-border-default bg-surface/40 overflow-hidden">
      <div className="px-5 py-4 border-b border-border-default/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <CameraIcon className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Profile Images</h2>
            <p className="text-xs text-text-disabled">Your avatar and banner appear at the top of your profile</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => setShowLightbox(true)}
            className="group relative cursor-pointer rounded-full overflow-hidden shrink-0"
          >
            <Avatar user={profile} size="xl" className="ring-2 ring-border-default" />
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
              <EyeIcon className="w-5 h-5 text-text-primary/90" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={triggerAvatar}
                disabled={avatarLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-strong text-sm font-medium text-text-secondary hover:border-zinc-500 hover:text-text-primary transition-colors disabled:opacity-60 cursor-pointer"
              >
                {avatarLoading ? <Spinner size="sm" /> : <CameraIcon className="w-3.5 h-3.5" />}
                {profile.avatar_url ? "Change" : "Upload"} avatar
              </button>
              {profile.avatar_url ? (
                <button
                  type="button"
                  onClick={onAvatarRemove}
                  disabled={avatarLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-default text-sm font-medium text-text-muted hover:text-rose-300 hover:border-rose-500/40 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <XIcon className="w-3.5 h-3.5" />
                  Remove
                </button>
              ) : null}
            </div>
            <p className="text-[11px] text-text-disabled mt-2">PNG, JPG, or WebP. Max 5MB.</p>
            {avatarError ? <p className="text-[11px] text-rose-400 mt-1">{avatarError}</p> : null}
            <input
              id="profile-avatar-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatar(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {/* Banner */}
        <div>
          <div className="relative w-full h-24 sm:h-28 rounded-xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-border-default">
            {profile.banner_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.banner_url}
                alt="Banner preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(600px 160px at 15% -20%, rgba(56,189,248,0.18), transparent 60%), radial-gradient(500px 160px at 95% 140%, rgba(139,92,246,0.18), transparent 65%)",
                }}
              />
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={triggerBanner}
              disabled={bannerLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-strong text-sm font-medium text-text-secondary hover:border-zinc-500 hover:text-text-primary transition-colors disabled:opacity-60 cursor-pointer"
            >
              {bannerLoading ? <Spinner size="sm" /> : <CameraIcon className="w-3.5 h-3.5" />}
              {profile.banner_url ? "Change" : "Upload"} banner
            </button>
            {profile.banner_url ? (
              <button
                type="button"
                onClick={onBannerRemove}
                disabled={bannerLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-default text-sm font-medium text-text-muted hover:text-rose-300 hover:border-rose-500/40 transition-colors disabled:opacity-60 cursor-pointer"
              >
                <XIcon className="w-3.5 h-3.5" />
                Remove
              </button>
            ) : null}
          </div>
          <p className="text-[11px] text-text-disabled mt-2">Recommended 1500×500. PNG, JPG, or WebP. Max 8MB.</p>
          {bannerError ? <p className="text-[11px] text-rose-400 mt-1">{bannerError}</p> : null}
          <input
            id="profile-banner-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleBanner(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-app/95 backdrop-blur-md animate-fade-in animate-duration-200"
          onClick={() => setShowLightbox(false)}
        >
          <div className="absolute top-4 right-4">
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              className="p-2 rounded-full bg-surface border border-border-default text-text-muted hover:text-text-primary hover:border-border-strong transition-colors cursor-pointer"
              aria-label="Close photo view"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div
            className="relative max-w-md w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-border-default shadow-2xl bg-surface flex items-center justify-center relative">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-5xl font-bold text-text-disabled select-none">
                  {getInitials(profile.name)}
                </div>
              )}
            </div>
            <p className="mt-4 text-base font-bold text-text-primary leading-tight">{profile.name}</p>
            {profile.username && <p className="text-xs text-text-disabled mt-1">@{profile.username}</p>}
          </div>
        </div>
      )}

      {/* Avatar Crop Modal */}
      {cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={async (croppedFile) => {
            setCropSrc(null);
            try {
              await onAvatarFile(croppedFile);
            } catch {
              setAvatarError("Upload failed.");
            }
          }}
        />
      )}
    </div>
  );
}
