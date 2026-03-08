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
  QuestionMarkCircleIcon,
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
    { href: `${base}/issues`, label: "Issues", icon: <QuestionMarkCircleIcon className="w-4 h-4" /> },
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
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{space.summary}</p>

            {health && (
              <div className="mt-2">
                <CollaborationHealthBadge health={health} compact />
              </div>
            )}
          </div>

          {!isMember && (
            <Link
              href={`${base}/join`}
              className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
            >
              Request to Join
            </Link>
          )}
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
