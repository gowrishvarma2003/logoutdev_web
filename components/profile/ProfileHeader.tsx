"use client";

/**
 * ProfileHeader — top section of any developer profile.
 * Shows avatar, name, @username, headline, bio, location, and external links.
 * Conditionally shows an "Edit Profile" button for the owner.
 */

import Link from "next/link";
import type { User } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";
import {
  MapPinIcon,
  GitHubIcon,
  LinkedInIcon,
  GlobeIcon,
  EditIcon,
  CalendarIcon,
} from "@/components/ui/Icons";

interface ProfileHeaderProps {
  profile: User;
  is_me: boolean;
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
      className="flex items-center gap-1.5 text-zinc-400 hover:text-sky-400 transition-colors text-sm group"
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate max-w-[140px] group-hover:underline underline-offset-2">
        {label}
      </span>
    </a>
  );
}

export default function ProfileHeader({ profile, is_me }: ProfileHeaderProps) {
  const joinDate = profile.created_at || profile.createdAt;

  // Format join date as "Joined Month YYYY"
  const formattedJoin = joinDate
    ? new Date(joinDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  // Derive readable labels for links
  const websiteLabel = profile.website_url
    ? new URL(profile.website_url).hostname.replace("www.", "")
    : null;
  const githubLabel = profile.github_url
    ? profile.github_url.replace("https://github.com/", "@")
    : null;
  const linkedinLabel = profile.linkedin_url ? "LinkedIn" : null;

  return (
    <div className="px-5 pt-6 pb-5">
      {/* ── Avatar row ── */}
      <div className="flex items-start justify-between mb-4">
        <Avatar user={profile} size="lg" className="ring-2 ring-zinc-800" />

        {is_me && (
          <Link
            href="/settings/profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
          >
            <EditIcon className="w-3.5 h-3.5" />
            Edit profile
          </Link>
        )}
      </div>

      {/* ── Name + handle ── */}
      <h1 className="text-xl font-bold text-white leading-tight">{profile.name}</h1>
      {profile.username && (
        <p className="text-sm text-zinc-500 mt-0.5">@{profile.username}</p>
      )}

      {/* ── Headline ── */}
      {profile.headline && (
        <p className="mt-2 text-sm text-zinc-300 font-medium leading-snug">
          {profile.headline}
        </p>
      )}

      {/* ── Bio ── */}
      {profile.bio && (
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
          {profile.bio}
        </p>
      )}

      {/* ── Meta row: location + join date ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
        {profile.location && (
          <span className="flex items-center gap-1 text-sm text-zinc-500">
            <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
            {profile.location}
          </span>
        )}
        {formattedJoin && (
          <span className="flex items-center gap-1 text-sm text-zinc-500">
            <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
            Joined {formattedJoin}
          </span>
        )}
      </div>

      {/* ── External links ── */}
      {(profile.website_url || profile.github_url || profile.linkedin_url) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {profile.website_url && websiteLabel && (
            <ExternalLink
              href={profile.website_url}
              icon={<GlobeIcon />}
              label={websiteLabel}
            />
          )}
          {profile.github_url && githubLabel && (
            <ExternalLink
              href={profile.github_url}
              icon={<GitHubIcon />}
              label={githubLabel}
            />
          )}
          {profile.linkedin_url && linkedinLabel && (
            <ExternalLink
              href={profile.linkedin_url}
              icon={<LinkedInIcon />}
              label={linkedinLabel}
            />
          )}
        </div>
      )}
    </div>
  );
}
