"use client";

import { useRepoContext } from "../../../layout";
import { usePullRequestCommits } from "@/lib/hooks/useRepos";
import Spinner from "@/components/ui/Spinner";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";

export default function PRCommitsPage({
  params,
}: {
  params: { repoId: string; number: string }; // number as string from URL
}) {
  const { repo } = useRepoContext();
  const { commits, loading, error } = usePullRequestCommits(repo.id, params.number);

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
      <div className="py-12 text-center text-zinc-500">
        No commits found for this pull request.
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/50">
        <ul className="divide-y divide-zinc-800">
          {commits.map((commit) => (
            <li key={commit.oid} className="p-4 hover:bg-zinc-800/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Link
                    href={`/repos/${repo.id}/commits/${commit.oid}`}
                    className="font-semibold text-white hover:text-blue-500"
                  >
                    {commit.message.split("\n")[0]}
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                    <span className="font-medium text-zinc-300">{commit.author_name}</span>
                    <span>committed</span>
                    <span>{formatRelativeTime(commit.authored_at)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(commit.oid)}
                    className="flex h-8 w-8 items-center justify-center rounded bg-zinc-800 text-zinc-400 hover:text-white"
                    title="Copy full SHA"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/repos/${repo.id}/commits/${commit.oid}`}
                    className="flex h-8 items-center justify-center rounded border border-zinc-700 bg-zinc-800 px-3 font-mono text-xs text-blue-400 hover:bg-zinc-700"
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
