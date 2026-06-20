"use client";

import Link from "next/link";
import type { ProjectSpace } from "@/lib/types";
import { StatusBadge, VisibilityBadge } from "./SpaceBadges";
import { UsersIcon, ChevronRightIcon, BoltIcon, FolderIcon, CodeBracketIcon } from "@/components/ui/Icons";
import Avatar from "@/components/ui/Avatar";

type ChipTone = "skill" | "role" | "stack" | "neutral";

const CHIP_STYLES: Record<ChipTone, string> = {
  skill: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  role: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  stack: "border-zinc-700 bg-zinc-800/80 text-zinc-300",
  neutral: "border-zinc-700 bg-zinc-900 text-zinc-500",
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
      className={`inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium leading-none sm:max-w-[180px] ${CHIP_STYLES[tone]}`}
    >
      {prefix ? <span className="shrink-0 text-zinc-500">{prefix}</span> : null}
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

function OverflowChip({ count }: { count: number }) {
  return <SignalChip label={`+${count} more`} tone="neutral" />;
}

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

  return (
    <Link
      href={`/spaces/${space.id}`}
      className="group block overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/45 p-4 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/80"
    >
      <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(210px,240px)] sm:items-stretch">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-gradient-to-br from-sky-500/15 via-zinc-800 to-emerald-500/10 text-sm font-bold text-white">
              {initial}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <h3 className="line-clamp-1 break-words text-base font-semibold leading-6 text-white transition-colors group-hover:text-sky-300">
                    {space.name}
                  </h3>
                  {ownerName ? (
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      by {ownerName}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap gap-1.5 md:justify-end">
                  <StatusBadge status={space.status} />
                  <VisibilityBadge visibility={space.visibility} />
                  {space.working_in_public ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                      Build in public
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-3 line-clamp-2 break-words text-sm leading-5 text-zinc-400">
            {space.summary}
          </p>

          {focus ? (
            <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/45 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                Current focus
              </p>
              <p className="mt-1 line-clamp-2 break-words text-[13px] leading-5 text-zinc-300">
                {focus}
              </p>
            </div>
          ) : null}

          {(skills.length > 0 || roles.length > 0) ? (
            <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
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

        <div className="flex min-w-0 flex-col justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
          <div className="grid min-w-0 grid-cols-3 gap-2 sm:grid-cols-1">
            <span className="flex min-w-0 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-2 text-xs text-zinc-400">
              <UsersIcon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              <span className="min-w-0 truncate">
                {memberCount} member{memberCount !== 1 ? "s" : ""}
              </span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-2 text-xs text-zinc-400">
              <BoltIcon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              <span className="min-w-0 truncate">
                {followerCount} follow{followerCount !== 1 ? "s" : ""}
              </span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-2 text-xs text-zinc-400">
              <FolderIcon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              <span className="min-w-0 truncate">
                {repoCount} repo{repoCount !== 1 ? "s" : ""}
              </span>
            </span>
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
              <CodeBracketIcon className="h-3.5 w-3.5" />
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
              <p className="text-xs text-zinc-600">Stack not listed</p>
            )}
          </div>

          <div className="flex min-w-0 items-center justify-between gap-3 border-t border-zinc-800 pt-3">
            {space.members && space.members.length > 0 ? (
              <div className="flex min-w-0 -space-x-1.5 overflow-hidden">
                {space.members.slice(0, 3).map((member) => (
                  <Avatar
                    key={member.id}
                    user={member.user}
                    size="xs"
                    className="ring-2 ring-zinc-950"
                  />
                ))}
                {space.members.length > 3 ? (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-zinc-950 bg-zinc-800 text-[9px] font-medium text-zinc-400">
                    +{space.members.length - 3}
                  </div>
                ) : null}
              </div>
            ) : (
              <span className="truncate text-xs text-zinc-600">No members yet</span>
            )}
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-sky-300 transition-colors group-hover:text-sky-200">
              Open
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
