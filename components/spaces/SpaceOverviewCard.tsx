"use client";

import Link from "next/link";
import type { ProjectSpace } from "@/lib/types";
import { StatusBadge, VisibilityBadge } from "./SpaceBadges";
import { UsersIcon, ChevronRightIcon, BoltIcon, FolderIcon, CodeBracketIcon, RocketIcon, GitHubIcon } from "@/components/ui/Icons";
import Avatar from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils";

type ChipTone = "skill" | "role" | "stack" | "neutral";

const CHIP_STYLES: Record<ChipTone, string> = {
  skill: "border-sky-500/20 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 transition-colors",
  role: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors",
  stack: "border-border-default bg-surface text-text-secondary hover:bg-surface-hover transition-colors",
  neutral: "border-border-default bg-app text-text-disabled",
};

function SignalChip({
  label,
  prefix,
  tone,
}: {
  label: string;
  prefix?: string;
  tone: ChipTone;
}) {
  const title = prefix ? `${prefix}: ${label}` : label;

  return (
    <span
      title={title}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium leading-none sm:max-w-[180px] ${CHIP_STYLES[tone]}`}
    >
      {prefix ? <span className="shrink-0 text-text-disabled">{prefix}</span> : null}
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

function OverflowChip({ count }: { count: number }) {
  return <SignalChip label={`+${count} more`} tone="neutral" />;
}

const STATUS_GRADIENTS = {
  idea: "from-violet-500/15 via-violet-900/5 to-purple-500/5 text-violet-300 border-violet-500/25",
  building: "from-amber-500/15 via-amber-900/5 to-orange-500/5 text-amber-300 border-amber-500/25",
  shipping: "from-emerald-500/15 via-emerald-900/5 to-teal-500/5 text-emerald-300 border-emerald-500/25",
  paused: "from-zinc-500/10 to-zinc-900/5 text-text-muted border-border-strong",
  archived: "from-zinc-800/10 to-zinc-950/5 text-text-disabled border-border-default",
};

export default function SpaceOverviewCard({ space }: { space: ProjectSpace }) {
  const memberCount = space.members?.length ?? space.memberCount ?? 0;
  const followerCount = space.follower_count ?? 0;
  const repoCount = space.attached_repos?.length ?? space.repos?.length ?? 0;
  const ownerName = space.owner?.name || space.owner?.username;
  const initial = space.name.trim().charAt(0).toUpperCase() || "S";
  const focus = space.current_focus?.trim();
  const skills = (space.needed_skills ?? []).filter(Boolean);
  const roles = (space.open_roles ?? []).filter(Boolean);
  const stack = space.stack ?? [];
  const visibleSkills = skills.slice(0, 3);
  const visibleRoles = roles.slice(0, 2);
  const visibleStack = stack.slice(0, 3);

  const relativeTime = space.updated_at
    ? formatRelativeTime(space.updated_at)
    : space.created_at
    ? formatRelativeTime(space.created_at)
    : null;

  const gradientClass = STATUS_GRADIENTS[space.status] || STATUS_GRADIENTS.idea;

  const getRepoName = (url?: string) => {
    if (!url) return null;
    try {
      const cleanUrl = url.replace("git@github.com:", "https://github.com/").replace(/\.git$/, "");
      const urlObj = new URL(cleanUrl);
      const parts = urlObj.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        return parts.slice(-2).join("/");
      }
      return parts[0] || url;
    } catch {
      const parts = url.split("/").filter(Boolean);
      if (parts.length >= 2) {
        return parts.slice(-2).join("/");
      }
      return url;
    }
  };
  const repoName = getRepoName(space.primary_repo_url);

  return (
    <Link
      href={`/spaces/${space.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-border-default bg-gradient-to-b from-zinc-900/50 to-zinc-950/70 p-5 transition-all duration-300 hover:border-border-strong/60 hover:bg-surface/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.6)] hover:shadow-sky-500/[0.01]"
    >
      {/* Top light glow bar */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-sky-500/10 via-violet-500/10 to-emerald-500/10 opacity-30 transition-opacity group-hover:opacity-100" />

      <div className="grid min-w-0 gap-5 sm:grid-cols-[minmax(0,1fr)_250px] sm:items-stretch">
        {/* Left main info */}
        <div className="flex min-w-0 flex-col justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-start gap-4">
              {/* Status-color-coded Initial Badge */}
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br text-base font-bold shadow-sm ${gradientClass}`}>
                {initial}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="line-clamp-1 break-words text-lg font-bold text-text-primary transition-colors group-hover:text-sky-300 tracking-tight">
                      {space.name}
                    </h3>
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      <StatusBadge status={space.status} />
                      <VisibilityBadge visibility={space.visibility} />
                      {space.working_in_public ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/15">
                          Build in public
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Owner Row & Relative Time */}
                  <div className="flex items-center gap-2">
                    {space.owner && (
                      <Avatar
                        user={space.owner}
                        size="xs"
                        className="ring-1 ring-border-default"
                      />
                    )}
                    <p className="truncate text-xs text-text-muted">
                      by <span className="font-medium text-text-secondary group-hover:text-text-secondary transition-colors">{ownerName}</span>
                    </p>
                    {relativeTime && (
                      <>
                        <span className="text-zinc-700 text-xs">•</span>
                        <span className="text-xs text-text-disabled">
                          updated {relativeTime}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-3.5 line-clamp-2 break-words text-sm leading-relaxed text-text-muted font-light">
              {space.summary}
            </p>

            {/* Integration Pills (Launch & Repo link) */}
            {(repoName || space.linked_launch) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {repoName && (
                  <div className="flex items-center gap-1.5 rounded-full bg-app/60 px-2.5 py-0.5 text-[11px] text-text-secondary border border-border-default/80 transition-colors hover:border-border-strong">
                    <GitHubIcon className="h-3.5 w-3.5 text-text-muted" />
                    <span className="font-mono text-[10px] text-text-muted">{repoName}</span>
                  </div>
                )}
                {space.linked_launch && (
                  <div className="flex items-center gap-1.5 rounded-full bg-violet-500/5 px-2.5 py-0.5 text-[11px] text-violet-400 border border-violet-500/10 transition-colors hover:border-violet-500/20">
                    <RocketIcon className="h-3.5 w-3.5 text-violet-400/80" />
                    <span>Launch: {space.linked_launch.name}</span>
                    <span className="text-violet-500/30">•</span>
                    <span className="font-medium text-violet-300">{space.linked_launch.upvote_count} upvotes</span>
                  </div>
                )}
              </div>
            )}

            {focus ? (
              <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-border-subtle bg-app/30 px-3.5 py-2.5">
                <span className="mt-0.5 shrink-0 rounded bg-sky-500/10 px-1 py-0.5 text-[8px] font-semibold tracking-wider text-sky-400 uppercase border border-sky-500/15">
                  Focus
                </span>
                <p className="line-clamp-2 break-words text-[12.5px] leading-relaxed text-text-secondary">
                  {focus}
                </p>
              </div>
            ) : null}
          </div>

          {(skills.length > 0 || roles.length > 0) ? (
            <div className="mt-4 flex min-w-0 flex-wrap gap-1.5">
              {visibleSkills.map((skill) => (
                <SignalChip key={`skill:${skill}`} label={skill} tone="skill" />
              ))}
              {skills.length > visibleSkills.length ? (
                <OverflowChip count={skills.length - visibleSkills.length} />
              ) : null}
              {visibleRoles.map((role) => (
                <SignalChip key={`role:${role}`} label={role} prefix="Role" tone="role" />
              ))}
              {roles.length > visibleRoles.length ? (
                <OverflowChip count={roles.length - visibleRoles.length} />
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Right side info panel */}
        <div className="flex min-w-0 flex-col justify-between gap-4 rounded-xl border border-border-default/40 bg-app/20 p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
          {/* Header Stats Grid */}
          <div className="grid grid-cols-3 divide-x divide-border-default/40 text-center bg-app/30 py-1.5 rounded-lg border border-border-subtle/60">
            <div className="flex flex-col items-center justify-center px-1">
              <span className="text-sm font-bold text-text-primary">{memberCount}</span>
              <span className="text-[9px] uppercase tracking-wider text-text-disabled mt-0.5">members</span>
            </div>
            <div className="flex flex-col items-center justify-center px-1">
              <span className="text-sm font-bold text-text-primary">{followerCount}</span>
              <span className="text-[9px] uppercase tracking-wider text-text-disabled mt-0.5">follows</span>
            </div>
            <div className="flex flex-col items-center justify-center px-1">
              <span className="text-sm font-bold text-text-primary">{repoCount}</span>
              <span className="text-[9px] uppercase tracking-wider text-text-disabled mt-0.5">repos</span>
            </div>
          </div>

          {/* Tech Stack List */}
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-disabled">
              <CodeBracketIcon className="h-3.5 w-3.5 text-text-disabled" />
              Stack
            </div>
            {visibleStack.length > 0 ? (
              <div className="flex min-w-0 flex-wrap gap-1.5">
                {visibleStack.map((item) => (
                  <SignalChip key={item.id} label={item.technology} tone="stack" />
                ))}
                {stack.length > visibleStack.length ? (
                  <OverflowChip count={stack.length - visibleStack.length} />
                ) : null}
              </div>
            ) : (
              <p className="text-xs italic text-text-disabled">Stack not listed</p>
            )}
          </div>

          {/* Members list & Open link */}
          <div className="flex min-w-0 items-center justify-between gap-3 border-t border-border-default/60 pt-3">
            {space.members && space.members.length > 0 ? (
              <div className="flex min-w-0 -space-x-2 overflow-hidden py-0.5">
                {space.members.slice(0, 4).map((member) => (
                  <Avatar
                    key={member.id}
                    user={member.user}
                    size="xs"
                    className="ring-2 ring-app transition-transform group-hover:scale-105"
                  />
                ))}
                {space.members.length > 4 ? (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-zinc-950 bg-surface text-[9px] font-semibold text-text-muted transition-transform group-hover:scale-105">
                    +{space.members.length - 4}
                  </div>
                ) : null}
              </div>
            ) : (
              <span className="text-xs italic text-text-disabled">No members yet</span>
            )}
            <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-sky-400 transition-colors group-hover:text-sky-300">
              Open
              <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
