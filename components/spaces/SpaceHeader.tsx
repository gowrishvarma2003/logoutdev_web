"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "@/components/ui/Icons";
import CollaborationHealthBadge from "./CollaborationHealthBadge";
import { useHealth } from "@/lib/hooks/useSpaces";
import { useRepos } from "@/lib/hooks/useRepos";

interface SpaceHeaderProps {
  space: ProjectSpace;
  isMember: boolean;
  isOwner: boolean;
  memberRole: MemberRole | null;
}

/**
 * Full-width header displayed on all space sub-pages.
 * Includes project info, health badge, and tab navigation.
 */
export default function SpaceHeader({ space, isMember, isOwner, memberRole }: SpaceHeaderProps) {
  const pathname = usePathname();
  const { health } = useHealth(space.id);
  const { repos } = useRepos(space.id);

  const base = `/spaces/${space.id}`;
  const canManageRepos = isOwner || memberRole === "maintainer";
  const canSeeRepos = canManageRepos || repos.length > 0;
  const tabs = [
    { href: base, label: "Overview", icon: <DocumentTextIcon className="w-4 h-4" /> },
    { href: `${base}/discussions`, label: "Discussions", icon: <ChatBubbleIcon className="w-4 h-4" /> },
    { href: `${base}/updates`, label: "Updates", icon: <ClockIcon className="w-4 h-4" /> },
    { href: `${base}/contributors`, label: "Contributors", icon: <UsersIcon className="w-4 h-4" /> },
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

  return (
    <div className="border-b border-zinc-800">
      {/* Back link + project hero */}
      <div className="px-4 pt-4 pb-5">
        <Link
          href="/spaces"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          All Spaces
        </Link>

        {/* Project info row */}
        <div className="flex items-start gap-4">
          {/* Project avatar */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-sky-500/20 border border-zinc-700 flex items-center justify-center text-lg font-bold text-white shrink-0">
            {space.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white truncate">
                {space.name}
              </h1>
              <StatusBadge status={space.status} />
              <VisibilityBadge visibility={space.visibility} />
            </div>
            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
              {space.summary}
            </p>

            {/* Health badge (compact) */}
            {health && (
              <div className="mt-2">
                <CollaborationHealthBadge health={health} compact />
              </div>
            )}
          </div>

          {/* Join button for non-members */}
          {!isMember && (
            <Link
              href={`${base}/join`}
              className="shrink-0 px-4 py-2 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 transition-colors"
            >
              Request to Join
            </Link>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <nav className="flex px-4 gap-1 overflow-x-auto" role="tablist">
        {tabs.map((tab) => {
          const isActive =
            tab.href === base
              ? pathname === base
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-white text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
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
