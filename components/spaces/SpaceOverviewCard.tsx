"use client";

import Link from "next/link";
import type { ProjectSpace } from "@/lib/types";
import { StatusBadge, VisibilityBadge } from "./SpaceBadges";
import { UsersIcon, ChevronRightIcon, BoltIcon, FolderIcon } from "@/components/ui/Icons";
import Avatar from "@/components/ui/Avatar";

/**
 * Compact card for the Discover listing grid.
 * Shows key info at a glance with smooth hover interaction.
 */
export default function SpaceOverviewCard({ space }: { space: ProjectSpace }) {
  const memberCount = space.members?.length ?? space.memberCount ?? 0;

  return (
    <Link
      href={`/spaces/${space.id}`}
      className="group block rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-200"
    >
      {/* Top row: avatar + badges */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Project initial avatar */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-sky-500/20 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {space.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors truncate">
              {space.name}
            </h3>
            {space.owner && (
              <p className="text-xs text-zinc-500 truncate mt-0.5">
                by {space.owner.name}
              </p>
            )}
          </div>
        </div>
        <ChevronRightIcon className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors mt-1 shrink-0" />
      </div>

      {/* Summary */}
      <p className="text-sm text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
        {space.summary}
      </p>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <StatusBadge status={space.status} />
        <VisibilityBadge visibility={space.visibility} />
        {space.working_in_public ? (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
            Build in public
          </span>
        ) : null}
      </div>

      {/* Stack preview (first 3 techs) */}
      {space.stack && space.stack.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {space.stack.slice(0, 4).map((s) => (
            <span
              key={s.id}
              className="px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] text-zinc-400 font-medium"
            >
              {s.technology}
            </span>
          ))}
          {space.stack.length > 4 && (
            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] text-zinc-500">
              +{space.stack.length - 4}
            </span>
          )}
        </div>
      )}

      {(space.open_roles?.length ?? 0) > 0 || (space.needed_skills?.length ?? 0) > 0 ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {(space.open_roles ?? []).slice(0, 2).map((role) => (
            <span key={role} className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300">
              Role: {role}
            </span>
          ))}
          {(space.needed_skills ?? []).slice(0, 2).map((skill) => (
            <span key={skill} className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-400">
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      {/* Footer stats */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <UsersIcon className="w-3.5 h-3.5" />
          {memberCount} member{memberCount !== 1 ? "s" : ""}
        </span>
        {(space.follower_count ?? 0) > 0 ? (
          <span className="flex items-center gap-1">
            <BoltIcon className="w-3.5 h-3.5" />
            {space.follower_count} follow
          </span>
        ) : null}
        {(space.attached_repos?.length ?? 0) > 0 ? (
          <span className="flex items-center gap-1">
            <FolderIcon className="w-3.5 h-3.5" />
            {space.attached_repos?.length} repo
          </span>
        ) : null}
        {/* Member avatars (up to 3) */}
        {space.members && space.members.length > 0 && (
          <div className="flex -space-x-1.5 ml-auto">
            {space.members.slice(0, 3).map((m) => (
              <Avatar
                key={m.id}
                user={m.user}
                size="xs"
                className="ring-2 ring-zinc-900"
              />
            ))}
            {space.members.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[9px] text-zinc-400 font-medium">
                +{space.members.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
