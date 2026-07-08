"use client";

import Link from "next/link";
import type { User, ProofOfWorkBand } from "@/lib/types";
import RichText from "@/components/ui/RichText";
import FollowButton from "@/components/profile/FollowButton";
import ProfileBanner from "@/components/profile/ProfileBanner";
import ProfileAvatarOverlay from "@/components/profile/ProfileAvatarOverlay";
import ProfileBandChip from "@/components/profile/ProfileBandChip";
import ShareMenu from "@/components/profile/ShareMenu";
import {
  MapPinIcon,
  GitHubIcon,
  LinkedInIcon,
  GlobeIcon,
  EditIcon,
  CalendarIcon,
  BriefcaseIcon,
} from "@/components/ui/Icons";

interface ProfileHeaderProps {
  profile: User;
  is_me: boolean;
  is_following?: boolean;
  followerCount?: number;
  band?: ProofOfWorkBand | null;
  badge?: string | null;
  score?: number | null;
  openToCollaborate?: boolean;
  onFollowChange?: (next: { following: boolean; followerCount: number }) => void;
  onAvatarUpload?: (file: File) => Promise<unknown>;
  onBannerUpload?: (file: File) => Promise<unknown>;
  onBannerRemove?: () => Promise<unknown>;
}

function ExternalLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className="flex items-center gap-1.5 text-text-muted hover:text-sky-400 transition-colors text-sm group"
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate max-w-[140px] group-hover:underline underline-offset-2">
        {label}
      </span>
    </a>
  );
}

export default function ProfileHeader({
  profile,
  is_me,
  is_following = false,
  followerCount = 0,
  band = null,
  badge = null,
  score = null,
  openToCollaborate = false,
  onFollowChange,
  onAvatarUpload,
  onBannerUpload,
  onBannerRemove,
}: ProfileHeaderProps) {
  const joinDate = profile.created_at;
  const formattedJoin = joinDate
    ? new Date(joinDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const websiteLabel = profile.website_url
    ? safeHostname(profile.website_url)
    : null;
  const githubLabel = profile.github_url
    ? profile.github_url.replace(/https?:\/\/(www\.)?github\.com\//, "@")
    : null;
  const linkedinLabel = profile.linkedin_url ? "LinkedIn" : null;

  const openToWork = Boolean(profile.open_to_work);
  const shareHref = typeof profile.username === "string" && profile.username
    ? `/profile/${profile.username}`
    : `/profile/${profile.id}`;

  return (
    <div className="border-b border-border-default">
      <ProfileBanner
        bannerUrl={profile.banner_url}
        isMe={is_me}
        onUpload={is_me ? onAvatarUpload ? undefined : onBannerUpload : undefined}
        onRemove={is_me ? onBannerRemove : undefined}
      />

      <div className="px-5 pt-1 pb-5">
        {/* ── Avatar + actions row ── */}
        <div className="flex items-end justify-between gap-3">
          <ProfileAvatarOverlay
            user={profile}
            isMe={is_me}
            onUpload={is_me ? onAvatarUpload : undefined}
          />

          <div className="flex items-center gap-2 pb-1">
            <ShareMenu url={shareHref} title={`${profile.name} — LogoutDev`} />
            {is_me ? (
              <Link
                href="/settings/profile"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
              >
                <EditIcon className="w-3.5 h-3.5" />
                Edit profile
              </Link>
            ) : (
              <FollowButton
                userId={profile.id}
                initialFollowing={is_following}
                initialFollowerCount={followerCount}
                isMe={is_me}
                onChange={onFollowChange}
              />
            )}
          </div>
        </div>

        {/* ── Name + handle + band ── */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary leading-tight">
            {profile.name}
          </h1>
          {band || badge ? <ProfileBandChip band={band} badge={badge} score={score ?? undefined} /> : null}
        </div>
        {profile.username ? (
          <p className="text-sm text-text-disabled mt-0.5">@{profile.username}</p>
        ) : null}

        {/* ── Pronouns ── */}
        {profile.pronouns ? (
          <p className="text-xs text-text-disabled mt-1">{profile.pronouns}</p>
        ) : null}

        {/* ── Headline ── */}
        {profile.headline ? (
          <p className="mt-2 text-sm text-text-secondary font-medium leading-snug">
            {profile.headline}
          </p>
        ) : null}

        {/* ── Status chips ── */}
        {(openToWork || openToCollaborate) ? (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {openToWork ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                <BriefcaseIcon className="w-3 h-3" />
                Open to work
              </span>
            ) : null}
            {openToCollaborate ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-300">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                Open to collaborate
              </span>
            ) : null}
          </div>
        ) : null}

        {/* ── Bio (rich) ── */}
        {profile.bio ? (
          <RichText
            text={profile.bio}
            as="p"
            className="mt-3 text-sm text-text-muted leading-relaxed whitespace-pre-line"
          />
        ) : null}

        {/* ── Meta row ── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
          {profile.location ? (
            <span className="flex items-center gap-1 text-sm text-text-disabled">
              <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
              {profile.location}
            </span>
          ) : null}
          {formattedJoin ? (
            <span className="flex items-center gap-1 text-sm text-text-disabled">
              <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
              Joined {formattedJoin}
            </span>
          ) : null}
        </div>

        {/* ── External links ── */}
        {(profile.website_url || profile.github_url || profile.linkedin_url) ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {profile.website_url && websiteLabel ? (
              <ExternalLink href={profile.website_url} icon={<GlobeIcon />} label={websiteLabel} />
            ) : null}
            {profile.github_url && githubLabel ? (
              <ExternalLink href={profile.github_url} icon={<GitHubIcon />} label={githubLabel} />
            ) : null}
            {profile.linkedin_url && linkedinLabel ? (
              <ExternalLink href={profile.linkedin_url} icon={<LinkedInIcon />} label={linkedinLabel} />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
