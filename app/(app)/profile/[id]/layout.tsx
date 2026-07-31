"use client";

/**
 * Profile layout — wraps all /profile/[id]/* pages.
 * Fetches the profile + signals once, renders the header + stats + tab nav.
 * Individual sub-pages render as {children}.
 */

import { use, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile, useProfileSignals, useUploadAvatar, useUploadBanner } from "@/lib/hooks/useProfile";
import { useAuth } from "@/lib/hooks/useAuth";
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
  count?: number;
}

function Tab({ href, label, active, count }: TabProps) {
  return (
    <Link
      href={href}
      className={`relative px-3.5 sm:px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
        active
          ? "text-text-primary"
          : "text-text-disabled hover:text-text-secondary"
      }`}
    >
      {label}
      {typeof count === "number" && count > 0 ? (
        <span className={`text-[11px] tabular-nums rounded-full px-1.5 py-0.5 ${active ? "bg-surface-hover text-text-secondary" : "bg-surface text-text-disabled"}`}>
          {count}
        </span>
      ) : null}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
      )}
    </Link>
  );
}

export default function ProfileLayout({ params, children }: ProfileLayoutProps) {
  const { id: username } = use(params);
  const pathname = usePathname();

  const { profile, is_me, is_following, stats, loading, error, refetch, open_to_collaborate } = useProfile(username);
  const { signals } = useProfileSignals(username);
  const { upload: uploadAvatar } = useUploadAvatar();
  const { upload: uploadBanner, remove: removeBanner } = useUploadBanner();
  const { user: currentUser, refreshUser } = useAuth();

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

  const handleAvatarUpload = useCallback(async (file: File) => {
    const updated = await uploadAvatar(file);
    if (updated && currentUser) refreshUser({ ...currentUser, ...updated });
    refetch();
  }, [uploadAvatar, refetch, currentUser, refreshUser]);

  const handleBannerUpload = useCallback(async (file: File) => {
    const updated = await uploadBanner(file);
    if (updated && currentUser) refreshUser({ ...currentUser, ...updated });
    refetch();
  }, [uploadBanner, refetch, currentUser, refreshUser]);

  const handleBannerRemove = useCallback(async () => {
    const updated = await removeBanner();
    if (updated && currentUser) refreshUser({ ...currentUser, ...updated });
    refetch();
  }, [removeBanner, refetch, currentUser, refreshUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !profile) {
    const isNotFound =
      !error ||
      /not found|profile not found/i.test(error);

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-border-default flex items-center justify-center text-2xl">
          👤
        </div>
        <h1 className="text-xl font-bold text-text-primary">
          {isNotFound ? "Profile not found" : "Couldn’t load profile"}
        </h1>
        <p className="text-text-disabled text-sm max-w-xs">
          {isNotFound ? (
            <>
              The user <span className="text-text-secondary">@{username}</span> doesn&apos;t exist or their profile isn&apos;t available.
            </>
          ) : (
            <>
              Something went wrong loading <span className="text-text-secondary">@{username}</span>.
              {error ? (
                <>
                  {" "}
                  <span className="text-text-muted">{error}</span>
                </>
              ) : null}
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {!isNotFound ? (
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              Try again
            </button>
          ) : null}
          <Link
            href="/feed"
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Sticky top bar with back button + name ── */}
      <header className="sticky top-0 z-20 bg-app/90 backdrop-blur-md border-b border-border-default">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link
            href="/feed"
            className="p-1.5 -ml-1.5 rounded-full text-text-muted hover:bg-surface-hover transition-colors"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-text-primary leading-tight truncate">
              {profile.name}
            </h1>
            {profile.username ? (
              <p className="text-xs text-text-disabled">@{profile.username}</p>
            ) : null}
          </div>
        </div>
      </header>

      {/* ── Profile header (banner, avatar, bio, links) ── */}
      <ProfileHeader
        profile={profile}
        is_me={is_me}
        is_following={displayFollowing}
        followerCount={displayStats?.followers ?? 0}
        band={signals?.band ?? null}
        badge={signals?.badge ?? null}
        score={signals?.score ?? null}
        openToCollaborate={open_to_collaborate}
        onFollowChange={handleFollowChange}
        onAvatarUpload={is_me ? handleAvatarUpload : undefined}
        onBannerUpload={is_me ? handleBannerUpload : undefined}
        onBannerRemove={is_me ? handleBannerRemove : undefined}
      />

      {/* ── Stats bar ── */}
      {displayStats ? (
        <ProfileStats
          stats={displayStats}
          username={username}
          profileId={profile.id}
          isMe={is_me}
        />
      ) : null}

      {/* ── Tab navigation (sticky under top bar) ── */}
      <nav
        className="sticky top-[52px] z-10 flex border-b border-border-default overflow-x-auto scrollbar-none bg-app/90 backdrop-blur-md"
        aria-label="Profile tabs"
      >
        <Tab href={base} label="Overview" active={pathname === base} />
        <Tab href={`${base}/launches`} label="Launches" active={pathname === `${base}/launches`} count={displayStats?.launches_published_count} />
        <Tab href={`${base}/freelance`} label="Freelance" active={pathname === `${base}/freelance`} count={(displayStats?.freelance_wins_count ?? 0) + (displayStats?.freelance_projects_posted_count ?? 0)} />
        <Tab href={`${base}/projects`} label="Projects" active={pathname === `${base}/projects`} count={(displayStats?.projects_created_count ?? 0) + (displayStats?.projects_contributed_count ?? 0)} />
        <Tab href={`${base}/repos`} label="Repos" active={pathname === `${base}/repos`} count={displayStats?.repos_count} />
        <Tab href={`${base}/posts`} label="Posts" active={pathname === `${base}/posts`} count={displayStats?.posts_count} />
        <Tab href={`${base}/questions`} label="Questions" active={pathname === `${base}/questions`} count={displayStats?.questions_count} />
        <Tab href={`${base}/activity`} label="Activity" active={pathname === `${base}/activity`} />
      </nav>

      {/* ── Tab content ── */}
      <div>{children}</div>
    </div>
  );
}
