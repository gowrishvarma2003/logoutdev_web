"use client";

/**
 * ProfileEditForm — full profile editing form for /settings/profile.
 * Handles: name, username, headline, bio, location, website/github/linkedin,
 * skills list, and featured project selection.
 */

import { useState, useEffect, useCallback } from "react";
import type { User, UserProfileSkill, UserFeaturedProject, ProjectSpace } from "@/lib/types";
import { useUpdateProfile, useUpdateSkills, useUpdateFeaturedProjects } from "@/lib/hooks/useProfile";
import * as spacesApi from "@/lib/services/spacesApi";
import {
  CheckIcon,
  XIcon,
  PlusIcon,
  GitHubIcon,
  LinkedInIcon,
  GlobeIcon,
} from "@/components/ui/Icons";
import Spinner from "@/components/ui/Spinner";

interface ProfileEditFormProps {
  profile: User;
  initialSkills: UserProfileSkill[];
  initialFeatured: UserFeaturedProject[];
  onSaved?: (updated: User) => void;
}

// ─── Field input ─────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-600 mt-1">{hint}</p>}
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
}

const INPUT_CLASS =
  "w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors";

const TEXTAREA_CLASS =
  "w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors resize-none";

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfileEditForm({
  profile,
  initialSkills,
  initialFeatured,
  onSaved,
}: ProfileEditFormProps) {
  // ── Profile fields state ──
  const [name, setName] = useState(profile.name ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url ?? "");
  const [githubUrl, setGithubUrl] = useState(profile.github_url ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? "");

  // ── Skills state ──
  const [skills, setSkills] = useState<string[]>(
    initialSkills.map((s) => s.skill)
  );
  const [skillInput, setSkillInput] = useState("");

  // ── Featured projects state ──
  const [featuredIds, setFeaturedIds] = useState<string[]>(
    initialFeatured.map((f) => f.space.id)
  );
  const [mySpaces, setMySpaces] = useState<ProjectSpace[]>([]);
  const [spacesLoading, setSpacesLoading] = useState(true);

  // ── Mutation hooks ──
  const { update, loading: profileLoading, error: profileError, success: profileSuccess } = useUpdateProfile();
  const { updateSkills, loading: skillsLoading, error: skillsError } = useUpdateSkills();
  const { updateFeatured, loading: featuredLoading, error: featuredError } = useUpdateFeaturedProjects();

  const loading = profileLoading || skillsLoading || featuredLoading;
  const anyError = profileError || skillsError || featuredError;

  // ── Load user's spaces for featured project selector ──
  useEffect(() => {
    spacesApi
      .listSpaces({ page: 1 })
      .then((res) => {
        setMySpaces(res.spaces ?? []);
      })
      .catch(() => setMySpaces([]))
      .finally(() => setSpacesLoading(false));
  }, []);

  // ── Skill helpers ──
  const addSkill = useCallback(() => {
    const t = skillInput.trim();
    if (!t || skills.includes(t) || skills.length >= 10) return;
    setSkills((prev) => [...prev, t]);
    setSkillInput("");
  }, [skillInput, skills]);

  const removeSkill = useCallback((skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }, []);

  // ── Featured project toggle ──
  const toggleFeatured = useCallback((spaceId: string) => {
    setFeaturedIds((prev) => {
      if (prev.includes(spaceId)) return prev.filter((id) => id !== spaceId);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, spaceId];
    });
  }, []);

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const [updatedProfile] = await Promise.all([
      update({ name, username, headline, bio, location, website_url: websiteUrl, github_url: githubUrl, linkedin_url: linkedinUrl }),
      updateSkills(skills),
      updateFeatured(featuredIds),
    ]);

    if (updatedProfile && onSaved) {
      onSaved(updatedProfile);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Profile Basics ── */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <span className="w-1 h-3.5 rounded-full bg-violet-500 inline-block" />
          Profile Basics
        </h2>
        <div className="space-y-4">
          <Field label="Display Name" hint="Your full name shown on your profile.">
            <input
              className={INPUT_CLASS}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={255}
            />
          </Field>

          <Field
            label="Username"
            hint="3–50 lowercase letters, numbers, and underscores. Used in your profile URL."
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">
                @
              </span>
              <input
                className={`${INPUT_CLASS} pl-7`}
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="your_username"
                maxLength={50}
                pattern="[a-z0-9_]+"
              />
            </div>
          </Field>

          <Field label="Headline" hint="Short tagline shown below your name (max 140 chars).">
            <input
              className={INPUT_CLASS}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Full-stack engineer · building in public"
              maxLength={140}
            />
            <p className="text-[11px] text-zinc-600 mt-1 text-right">
              {headline.length}/140
            </p>
          </Field>

          <Field label="Bio" hint="Tell the world what you build and care about (max 2000 chars).">
            <textarea
              className={TEXTAREA_CLASS}
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What do you work on? What excites you technically?"
              maxLength={2000}
            />
            <p className="text-[11px] text-zinc-600 mt-1 text-right">
              {bio.length}/2000
            </p>
          </Field>

          <Field label="Location" hint="City, country, or timezone (optional).">
            <input
              className={INPUT_CLASS}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, CA"
              maxLength={120}
            />
          </Field>
        </div>
      </section>

      {/* ── Links ── */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <span className="w-1 h-3.5 rounded-full bg-sky-500 inline-block" />
          Links
        </h2>
        <div className="space-y-4">
          <Field label="Website">
            <div className="relative">
              <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
              <input
                className={`${INPUT_CLASS} pl-9`}
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yoursite.com"
              />
            </div>
          </Field>

          <Field label="GitHub">
            <div className="relative">
              <GitHubIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
              <input
                className={`${INPUT_CLASS} pl-9`}
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/yourusername"
              />
            </div>
          </Field>

          <Field label="LinkedIn">
            <div className="relative">
              <LinkedInIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
              <input
                className={`${INPUT_CLASS} pl-9`}
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourusername"
              />
            </div>
          </Field>
        </div>
      </section>

      {/* ── Skills ── */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-200 mb-1 flex items-center gap-2">
          <span className="w-1 h-3.5 rounded-full bg-amber-500 inline-block" />
          Tech Stack
        </h2>
        <p className="text-xs text-zinc-500 mb-4">Add up to 10 skills. Press Enter or click + to add.</p>

        <div className="flex gap-2 mb-3">
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
            placeholder="e.g. TypeScript"
            maxLength={60}
            disabled={skills.length >= 10}
          />
          <button
            type="button"
            onClick={addSkill}
            disabled={!skillInput.trim() || skills.length >= 10}
            className="px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Add skill"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="text-zinc-500 hover:text-rose-400 transition-colors"
                  aria-label={`Remove ${skill}`}
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {skills.length >= 10 && (
          <p className="text-xs text-amber-500 mt-2">Maximum 10 skills reached.</p>
        )}
      </section>

      {/* ── Featured Projects ── */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-200 mb-1 flex items-center gap-2">
          <span className="w-1 h-3.5 rounded-full bg-emerald-500 inline-block" />
          Featured Projects
        </h2>
        <p className="text-xs text-zinc-500 mb-4">Pin up to 3 projects to your profile overview.</p>

        {spacesLoading ? (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : mySpaces.length === 0 ? (
          <p className="text-sm text-zinc-600 italic">
            You haven&apos;t joined or created any spaces yet.
          </p>
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
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selected
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : disabled
                      ? "border-zinc-800 bg-zinc-900/30 opacity-40 cursor-not-allowed"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                  aria-pressed={selected}
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {space.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{space.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{space.summary}</p>
                  </div>
                  {selected && (
                    <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Error / Success ── */}
      {anyError && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3">
          <p className="text-sm text-rose-400">{anyError}</p>
        </div>
      )}
      {profileSuccess && !loading && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex items-center gap-2">
          <CheckIcon className="w-4 h-4 text-emerald-400" />
          <p className="text-sm text-emerald-400">Profile saved successfully!</p>
        </div>
      )}

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
