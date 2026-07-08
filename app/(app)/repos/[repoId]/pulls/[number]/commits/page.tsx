"use client";

import { use } from "react";
import { useRepoContext } from "../../../layout";
import { usePullRequestCommits } from "@/lib/hooks/useRepos";
import Spinner from "@/components/ui/Spinner";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";

export default function PRCommitsPage({
  params,
}: {
  params: Promise<{ repoId: string; number: string }>;
}) {
  const { number } = use(params);
  const { repo } = useRepoContext();
  const { commits, loading, error } = usePullRequestCommits(repo.id, number);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
        Failed to load commits: {error}
      </div>
    );
  }

  if (!commits || commits.length === 0) {
    return (
      <div className="py-12 text-center text-text-disabled">
        No commits found for this pull request.
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="overflow-hidden rounded-md border border-border-default bg-surface/50">
        <ul className="divide-y divide-border-default">
          {commits.map((commit) => (
            <li key={commit.oid} className="p-4 hover:bg-surface-hover/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Link
                    href={`/repos/${repo.id}/commits/${commit.oid}`}
                    className="font-semibold text-text-primary hover:text-blue-500"
                  >
                    {commit.message.split("\n")[0]}
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-xs text-text-disabled">
                    <span className="font-medium text-text-secondary">{commit.author_name}</span>
                    <span>committed</span>
                    <span>{formatRelativeTime(commit.authored_at)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(commit.oid)}
                    className="flex h-8 w-8 items-center justify-center rounded bg-surface-hover text-text-muted hover:text-text-primary"
                    title="Copy full SHA"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/repos/${repo.id}/commits/${commit.oid}`}
                    className="flex h-8 items-center justify-center rounded border border-border-strong bg-surface-hover px-3 font-mono text-xs text-blue-400 hover:bg-surface-active"
                  >
                    {commit.short_oid}
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
