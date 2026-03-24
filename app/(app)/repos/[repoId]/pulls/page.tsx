"use client";

import { useState } from "react";
import Link from "next/link";
import { useRepoContext } from "../layout";
import { usePullRequests } from "@/lib/hooks/useRepos";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { formatRelativeTime } from "@/lib/utils";
import { CheckCircleIcon, ExclamationCircleIcon, PlusIcon, QueueListIcon, ArrowsRightLeftIcon } from "@heroicons/react/24/outline";

export default function RepoPullRequestsPage() {
  const { repo } = useRepoContext();
  const [filterState, setFilterState] = useState<"open" | "closed">("open");
  const { pullRequests, loading, error } = usePullRequests(repo.id, filterState);

  return (
    <div className="mx-auto max-w-[1280px] p-4 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex border border-zinc-700 rounded-md overflow-hidden text-sm">
          <button
            onClick={() => setFilterState("open")}
            className={`flex items-center gap-2 px-4 py-2 hover:bg-zinc-800 transition-colors ${
              filterState === "open" ? "bg-zinc-800 text-white font-medium shadow-inner" : "text-zinc-400 bg-zinc-900"
            }`}
          >
            <ExclamationCircleIcon className="h-4 w-4 text-green-500" />
            Open
          </button>
          <button
            onClick={() => setFilterState("closed")}
            className={`flex items-center gap-2 px-4 py-2 hover:bg-zinc-800 transition-colors border-l border-zinc-700 ${
              filterState === "closed" ? "bg-zinc-800 text-white font-medium shadow-inner" : "text-zinc-400 bg-zinc-900"
            }`}
          >
            <CheckCircleIcon className="h-4 w-4 text-purple-500" />
            Closed
          </button>
        </div>
        {repo.can_open_pr ? (
          <Link
            href={`/repos/${repo.id}/pulls/new`}
            className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            New pull request
          </Link>
        ) : null}
      </div>

      {loading && (
        <div className="flex h-32 items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          <p>Failed to load pull requests: {error}</p>
        </div>
      )}

      {!loading && !error && pullRequests.length === 0 ? (
        <div className="mt-8 border border-zinc-800 rounded-lg bg-zinc-900/50 py-16">
          <EmptyState
            icon={<QueueListIcon className="h-10 w-10 text-zinc-500" />}
            title="No pull requests found"
            description={`There are no ${filterState} pull requests in this repository.`}
          />
        </div>
      ) : null}

      {!loading && !error && pullRequests.length > 0 && (
        <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 overflow-hidden text-sm">
          <div className="divide-y divide-zinc-800">
            {pullRequests.map((pr) => (
              <div key={pr.id} className="p-4 hover:bg-zinc-800/50 transition-colors flex gap-3 group">
                <div className="mt-0.5 shrink-0">
                  {pr.status === "open" ? (
                    <ExclamationCircleIcon className="h-5 w-5 text-green-500" />
                  ) : pr.status === "merged" ? (
                    <CheckCircleIcon className="h-5 w-5 text-purple-500" />
                  ) : (
                    <CheckCircleIcon className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/repos/${repo.id}/pulls/${pr.number}`}
                    className="text-base font-semibold text-white hover:text-blue-500 transition-colors truncate"
                  >
                    {pr.title}
                  </Link>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {pr.is_draft ? (
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-amber-300">
                        Draft
                      </span>
                    ) : null}
                    {pr.is_cross_repo ? (
                      <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-sky-300">
                        Fork
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full border px-2 py-0.5 ${
                        pr.mergeable_state === "clean"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                          : pr.mergeable_state === "dirty"
                            ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
                            : "border-zinc-700 bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {pr.mergeable_state || "unknown"}
                    </span>
                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-zinc-300">
                      {pr.review_summary?.approvals_count || 0} approvals
                    </span>
                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-zinc-300">
                      {pr.review_summary?.changes_requested_count || 0} changes requested
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-zinc-500">
                    <span>
                      #{pr.number} opened {formatRelativeTime(pr.created_at)} by{" "}
                      <Link href={`/`} className="hover:text-blue-500 hover:underline">
                        {pr.author?.username}
                      </Link>
                    </span>
                    <span className="hidden sm:inline">&bull;</span>
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                        {pr.base_label || pr.target_branch}
                      </span>
                      <ArrowsRightLeftIcon className="h-3 w-3" />
                      <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                        {pr.head_label || pr.source_branch}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
