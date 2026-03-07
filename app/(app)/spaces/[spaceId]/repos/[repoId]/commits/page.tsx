"use client";

import { use, useState } from "react";
import { useRepo, useRepoCommits } from "@/lib/hooks/useRepos";
import { EmptyState, SectionHeader } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { ClockIcon } from "@/components/ui/Icons";
import { formatRelativeTime } from "@/lib/utils";

export default function RepoCommitsPage({
  params,
}: {
  params: Promise<{ spaceId: string; repoId: string }>;
}) {
  const { spaceId, repoId } = use(params);
  const [page, setPage] = useState(1);
  const { repo, loading: repoLoading } = useRepo(spaceId, repoId);
  const { commits, loading, error } = useRepoCommits(spaceId, repoId, repo?.default_branch, undefined, page);

  if (repoLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title={`Commits${repo ? ` · ${repo.name}` : ""}`} count={commits.length} />

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {!loading && error && (
        <p className="px-4 py-10 text-center text-sm text-rose-400">{error}</p>
      )}

      {!loading && !error && commits.length === 0 && (
        <EmptyState
          icon={<ClockIcon className="w-10 h-10" />}
          title="No commits yet"
          description="Push the first commit to populate repository history."
        />
      )}

      {!loading && !error && commits.length > 0 && (
        <>
          <div className="divide-y divide-zinc-800/50">
            {commits.map((commit) => (
              <article key={commit.oid} className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-sky-400">
                    {commit.short_oid}
                  </span>
                  <h3 className="text-sm font-medium text-white">{commit.message}</h3>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span>{commit.author_name}</span>
                  <span>·</span>
                  <span>{commit.author_email}</span>
                  <span>·</span>
                  <span>{formatRelativeTime(commit.authored_at)}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="flex items-center justify-between px-4 py-4 text-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-zinc-500">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={commits.length < 20}
              className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
