"use client";

/**
 * Profile layout — wraps all /profile/[id]/* pages.
 * Fetches the profile once, renders the header + stats + tab nav.
 * Individual sub-pages render as {children}.
 */

import { use } from "react";
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
      role="tab"
      aria-selected={active}
      aria-current={active ? "page" : undefined}
      tabIndex={active ? 0 : -1}
      className={`relative px-3 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${
        active
          ? "text-white"
          : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {label}
      {/* Active underline */}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" aria-hidden="true" />
      )}
    </Link>
  );
}

export default function ProfileLayout({ params, children }: ProfileLayoutProps) {
  const { id: username } = use(params);
  const pathname = usePathname();

  const { profile, is_me, stats, loading, error } = useProfile(username);

  const base = `/profile/${username}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 sm:gap-4 px-4 sm:px-6 text-center py-8">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
          👤
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-white break-words">Profile not found</h1>
        <p className="text-zinc-500 text-xs sm:text-sm max-w-xs break-words">
          The user <span className="text-zinc-300">@{username}</span> doesn&apos;t exist or their profile isn&apos;t available.
        </p>
        <Link
          href="/feed"
          className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors mt-2 min-h-[44px] px-3 py-2 rounded-lg hover:bg-zinc-800/50"
        >
          <ArrowLeftIcon className="w-4 h-4 flex-shrink-0" />
          <span>Back to feed</span>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ── Sticky top bar with back button + name ── */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 min-h-[44px]">
          <Link
            href="/feed"
            className="p-1.5 -ml-1.5 rounded-full text-zinc-400 hover:bg-zinc-800 transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-[15px] font-bold text-white leading-tight truncate">
              {profile.name}
            </h1>
            {profile.username && (
              <p className="text-xs text-zinc-500 truncate">@{profile.username}</p>
            )}
          </div>
        </div>
      </header>

      {/* ── Profile header (avatar, bio, links) ── */}
      <ProfileHeader profile={profile} is_me={is_me} />

      {/* ── Stats bar ── */}
      {stats && <ProfileStats stats={stats} username={username} />}

      {/* ── Tab navigation ── */}
      <nav
        className="flex border-b border-zinc-800 overflow-x-auto scrollbar-none"
        role="tablist"
        aria-label="Profile sections"
      >
        <Tab href={base} label="Overview" active={pathname === base} />
        <Tab href={`${base}/launches`} label="Launches" active={pathname === `${base}/launches`} />
        <Tab href={`${base}/freelance`} label="Freelance" active={pathname === `${base}/freelance`} />
        <Tab href={`${base}/projects`} label="Projects" active={pathname === `${base}/projects`} />
        <Tab href={`${base}/portfolio`} label="Portfolio" active={pathname === `${base}/portfolio`} />
        <Tab href={`${base}/posts`} label="Posts" active={pathname === `${base}/posts`} />
        <Tab href={`${base}/achievements`} label="Achievements" active={pathname === `${base}/achievements`} />
        <Tab href={`${base}/activity`} label="Activity" active={pathname === `${base}/activity`} />
      </nav>

      {/* ── Tab content ── */}
      <main role="tabpanel" id={`panel-${pathname.split("/").pop() || "overview"}`}>
        {children}
      </main>
    </div>
  );
}
