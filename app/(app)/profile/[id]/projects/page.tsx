"use client";

/**
 * Profile projects page — /profile/:id/projects
 * Lists all owned + contributed project spaces.
 */

import { use, useState } from "react";
import Link from "next/link";
import { useProfileProjects } from "@/lib/hooks/useProfile";
import { StatusBadge, VisibilityBadge } from "@/components/spaces/SpaceBadges";
import { ProfileListSkeleton } from "@/components/profile/ProfileSkeleton";
import { UsersIcon, ChevronRightIcon, RocketIcon } from "@/components/ui/Icons";
import EmptyState from "@/components/ui/EmptyState";

interface ProfileProjectsPageProps {
  params: Promise<{ id: string }>;
}

export default function ProfileProjectsPage({ params }: ProfileProjectsPageProps) {
  const { id: username } = use(params);
  const [page, setPage] = useState(1);

  const { projects, total, loading, error } = useProfileProjects(username, page);

  if (loading) {
    return <ProfileListSkeleton rows={5} />;
  }

  if (error) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-rose-400 text-sm">{error}</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          icon={<RocketIcon className="h-7 w-7" />}
          title="Start a project today"
          description="Create a space to collect teammates, repos, updates, and proof of work in one place."
          tone="project"
          action={
            <Link href="/spaces/create" className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100">
              Create project
            </Link>
          }
        />
      </div>
    );
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="py-4">
      {projects.map((space) => (
        <Link
          key={space.id}
          href={`/spaces/${space.id}`}
          className="group flex items-start gap-4 px-5 py-4 border-b border-zinc-800 hover:bg-zinc-900/40 transition-colors"
        >
          {/* Project initial */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-sky-500/20 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white shrink-0 mt-0.5">
            {space.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors truncate">
                {space.name}
              </h3>
              <StatusBadge status={space.status} />
              <VisibilityBadge visibility={space.visibility} />
            </div>
            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
              {space.summary}
            </p>
            {space.members && space.members.length > 0 && (
              <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1">
                <UsersIcon className="w-3 h-3" />
                {space.members.length} contributor{space.members.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <ChevronRightIcon className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors mt-1 shrink-0" />
        </Link>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 px-5 py-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
