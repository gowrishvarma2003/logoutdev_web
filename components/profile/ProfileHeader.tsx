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
      aria-label={`${label} (opens in new window)`}
      className="flex items-center gap-1.5 text-zinc-400 hover:text-sky-400 transition-colors text-xs sm:text-sm group min-h-[44px] px-2 py-1.5 rounded-lg hover:bg-zinc-800/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
    >
      <span className="shrink-0" aria-hidden="true">{icon}</span>
      <span className="truncate max-w-[120px] sm:max-w-[140px] group-hover:underline underline-offset-2">
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
    <section className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-5" aria-label="Profile information">
      {/* ── Avatar row ── */}
      <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
        <Avatar user={profile} size="lg" className="ring-2 ring-zinc-800 flex-shrink-0" />

        {is_me && (
          <Link
            href="/settings/profile"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-zinc-700 text-xs sm:text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors flex-shrink-0 min-h-[44px] whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            aria-label="Edit your profile"
          >
            <EditIcon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Edit profile</span>
            <span className="sm:hidden">Edit</span>
          </Link>
        )}
      </div>

      {/* ── Name + handle ── */}
      <h1 className="text-lg sm:text-xl font-bold text-white leading-tight break-words">{profile.name}</h1>
      {profile.username && (
        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 truncate" id="profile-username">@{profile.username}</p>
      )}

      {/* ── Headline ── */}
      {profile.headline && (
        <p className="mt-2 text-xs sm:text-sm text-zinc-300 font-medium leading-snug break-words" role="doc-subtitle">
          {profile.headline}
        </p>
      )}

      {/* ── Bio ── */}
      {profile.bio && (
        <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed whitespace-pre-line break-words">
          {profile.bio}
        </p>
      )}

      {/* ── Meta row: location + join date ── */}
      <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1.5 mt-2.5 sm:mt-3">
        {profile.location && (
          <span className="flex items-center gap-1 text-xs sm:text-sm text-zinc-500 min-h-[44px] px-2 py-1.5 -ml-2" aria-label={`Location: ${profile.location}`}>
            <MapPinIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{profile.location}</span>
          </span>
        )}
        {formattedJoin && (
          <span className="flex items-center gap-1 text-xs sm:text-sm text-zinc-500 min-h-[44px] px-2 py-1.5 -ml-2">
            <CalendarIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">Joined {formattedJoin}</span>
          </span>
        )}
      </div>

      {/* ── External links ── */}
      {(profile.website_url || profile.github_url || profile.linkedin_url) && (
        <nav className="flex flex-wrap gap-x-1 gap-y-1.5 mt-2.5 sm:mt-3 -mx-2" aria-label="External links">
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
        </nav>
      )}
    </section>
  );
}
