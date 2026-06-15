"use client";

/**
 * Profile layout — wraps all /profile/[id]/* pages.
 * Fetches the profile once, renders the header + stats + tab nav.
 * Individual sub-pages render as {children}.
 */

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/lib/hooks/useProfile";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import Spinner from "@/components/ui/Spinner";
import { ArrowLeftIcon } from "@/components/ui/Icons";

interface ProfileLayoutProps {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

interface TabProps {
  href: string;
  label: string;
  active: boolean;
}

function Tab({ href, label, active }: TabProps) {
  return (
    <Link
      href={href}
      className={`relative px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? "text-white"
          : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {label}
      {/* Active underline */}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
      )}
    </Link>
  );
}

export default function ProfileLayout({ params, children }: ProfileLayoutProps) {
  const { id: username } = use(params);
  const pathname = usePathname();

  const { profile, is_me, is_following, stats, loading, error } = useProfile(username);
  const [followOverride, setFollowOverride] = useState<{
    profileId: string;
    following: boolean;
    followerCount: number;
  } | null>(null);

  const base = `/profile/${username}`;

  const activeFollowOverride = followOverride?.profileId === profile?.id ? followOverride : null;
  const displayFollowing = activeFollowOverride?.following ?? is_following;
  const displayStats = useMemo(
    () => (
      stats && activeFollowOverride
        ? { ...stats, followers: activeFollowOverride.followerCount }
        : stats
    ),
    [activeFollowOverride, stats]
  );

  const handleFollowChange = (next: { following: boolean; followerCount: number }) => {
    if (!profile) return;
    setFollowOverride({
      profileId: profile.id,
      following: next.following,
      followerCount: next.followerCount,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl">
          👤
        </div>
        <h1 className="text-xl font-bold text-white">Profile not found</h1>
        <p className="text-zinc-500 text-sm max-w-xs">
          The user <span className="text-zinc-300">@{username}</span> doesn&apos;t exist or their profile isn&apos;t available.
        </p>
        <Link
          href="/feed"
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ── Sticky top bar with back button + name ── */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link
            href="/feed"
            className="p-1.5 -ml-1.5 rounded-full text-zinc-400 hover:bg-zinc-800 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-white leading-tight truncate">
              {profile.name}
            </h1>
            {profile.username && (
              <p className="text-xs text-zinc-500">@{profile.username}</p>
            )}
          </div>
        </div>
      </header>

      {/* ── Profile header (avatar, bio, links) ── */}
      <ProfileHeader
        profile={profile}
        is_me={is_me}
        is_following={displayFollowing}
        followerCount={displayStats?.followers ?? 0}
        onFollowChange={handleFollowChange}
      />

      {/* ── Stats bar ── */}
      {displayStats && <ProfileStats stats={displayStats} username={username} />}

      {/* ── Tab navigation ── */}
      <nav
        className="flex border-b border-zinc-800 overflow-x-auto scrollbar-none"
        aria-label="Profile tabs"
      >
        <Tab href={base} label="Overview" active={pathname === base} />
        <Tab href={`${base}/launches`} label="Launches" active={pathname === `${base}/launches`} />
        <Tab href={`${base}/freelance`} label="Freelance" active={pathname === `${base}/freelance`} />
        <Tab href={`${base}/projects`} label="Projects" active={pathname === `${base}/projects`} />
        <Tab href={`${base}/posts`} label="Posts" active={pathname === `${base}/posts`} />
        <Tab href={`${base}/activity`} label="Activity" active={pathname === `${base}/activity`} />
      </nav>

      {/* ── Tab content ── */}
      <div>{children}</div>
    </div>
  );
}
