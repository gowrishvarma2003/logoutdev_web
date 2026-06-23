"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { MemberRole, ProjectSpace } from "@/lib/types";
import { StatusBadge, VisibilityBadge } from "./SpaceBadges";
import {
  ArrowLeftIcon,
  ChatBubbleIcon,
  ClockIcon,
  UsersIcon,
  CogIcon,
  DocumentTextIcon,
  FolderIcon,
  QuestionMarkCircleIcon,
} from "@/components/ui/Icons";
import CollaborationHealthBadge from "./CollaborationHealthBadge";
import { useHealth } from "@/lib/hooks/useSpaces";
import { useAuth } from "@/lib/hooks/useAuth";
import * as api from "@/lib/services/spacesApi";
import * as cache from "@/lib/services/requestCache";

interface SpaceHeaderProps {
  space: ProjectSpace;
  isMember: boolean;
  isOwner: boolean;
  memberRole: MemberRole | null;
}

export default function SpaceHeader({ space, isMember, isOwner, memberRole }: SpaceHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { health } = useHealth(space.id);
  const [isFollowing, setIsFollowing] = useState(Boolean(space.is_following));
  const [followerCount, setFollowerCount] = useState(space.follower_count ?? 0);
  const [followLoading, setFollowLoading] = useState(false);

  const base = `/spaces/${space.id}`;
  const canManageRepos = isOwner || memberRole === "maintainer";
  const attachedRepos = space.attached_repos ?? [];
  const canSeeRepos = canManageRepos || attachedRepos.length > 0;
  const tabs = [
    { href: base, label: "Overview", icon: <DocumentTextIcon className="w-4 h-4" /> },
    { href: `${base}/work`, label: "Work", icon: <QuestionMarkCircleIcon className="w-4 h-4" /> },
    { href: `${base}/discussions`, label: "Discussions", icon: <ChatBubbleIcon className="w-4 h-4" /> },
    { href: `${base}/updates`, label: "Updates", icon: <ClockIcon className="w-4 h-4" /> },
    { href: `${base}/people`, label: "People", icon: <UsersIcon className="w-4 h-4" /> },
  ];

  if (canSeeRepos) {
    tabs.push({
      href: `${base}/repos`,
      label: "Repos",
      icon: <FolderIcon className="w-4 h-4" />,
    });
  }

  if (isOwner) {
    tabs.push({
      href: `${base}/manage`,
      label: "Manage",
      icon: <CogIcon className="w-4 h-4" />,
    });
  }

  useEffect(() => {
    setIsFollowing(Boolean(space.is_following));
    setFollowerCount(space.follower_count ?? 0);
  }, [space.follower_count, space.is_following]);

  async function handleFollowToggle() {
    if (!user || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.unfollowSpace(space.id);
        setIsFollowing(false);
        setFollowerCount((count) => Math.max(0, count - 1));
      } else {
        await api.followSpace(space.id);
        setIsFollowing(true);
        setFollowerCount((count) => count + 1);
      }
      // Bust cached overview (follower_count) + followers list so other tabs
      // (Overview, People) reflect the change on next visit.
      cache.invalidateSpace(space.id, "followers");
      cache.invalidateSpace(space.id, "overview");
    } finally {
      setFollowLoading(false);
    }
  }

  return (
    <div className={`sticky ${user ? "top-0" : "top-16"} z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm`}>
      <div className="px-4 pb-5 pt-4">
        <Link
          href="/spaces"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          All Spaces
        </Link>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-gradient-to-br from-violet-500/20 to-sky-500/20 text-lg font-bold text-white">
            {space.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-xl font-bold text-white">{space.name}</h1>
              <StatusBadge status={space.status} />
              <VisibilityBadge visibility={space.visibility} />
              {space.working_in_public ? (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  Working in public
                </span>
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{space.summary}</p>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <span>{followerCount} follower{followerCount === 1 ? "" : "s"}</span>
              {(space.open_roles?.length ?? 0) > 0 ? (
                <span>{space.open_roles?.length} open role{space.open_roles?.length === 1 ? "" : "s"}</span>
              ) : null}
              {(space.needed_skills?.length ?? 0) > 0 ? (
                <span>{space.needed_skills?.length} skill signal{space.needed_skills?.length === 1 ? "" : "s"}</span>
              ) : null}
            </div>

            {health && (
              <div className="mt-2">
                <CollaborationHealthBadge health={health} compact />
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2">
            {!isMember ? (
              <Link
                href={`${base}/join`}
                className="rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
              >
                Start contributing
              </Link>
            ) : null}
            {user && !isOwner ? (
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-60"
              >
                {followLoading ? "Saving..." : isFollowing ? "Following" : "Follow"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-4" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-white text-white"
                  : "border-transparent text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
