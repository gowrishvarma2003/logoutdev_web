"use client";

import Link from "next/link";
import { useRepoContext } from "../layout";
import { useRepoForks } from "@/lib/hooks/useRepos";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { formatRelativeTime } from "@/lib/utils";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";

export default function RepoForksPage() {
  const { repo } = useRepoContext();
  const { forks, fork_count, loading, error } = useRepoForks(repo.id);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <p className="px-4 py-10 text-center text-sm text-rose-400">{error}</p>;
  }

  if (forks.length === 0) {
    return (
      <EmptyState
        icon={<ArrowsRightLeftIcon className="h-10 w-10 text-zinc-500" />}
        title="No forks yet"
        description="This repository hasn't been forked by anyone yet."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-semibold text-white">Forks</h2>
        <p className="text-sm text-zinc-400">
          Showing {fork_count} {fork_count === 1 ? 'fork' : 'forks'} of {repo.owner?.username}/{repo.name}
        </p>
      </div>

      <div className="divide-y divide-zinc-800/50 rounded-xl border border-zinc-800 bg-zinc-950">
        {forks.map((fork) => (
          <div key={fork.id} className="flex items-center justify-between gap-4 p-4 hover:bg-zinc-900/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                {fork.forker?.username?.charAt(0).toUpperCase() || "A"}
              </div>
              <div>
                <Link
                  href={fork.repo ? `/repos/${fork.repo.id}` : "#"}
                  className={`font-semibold ${fork.repo ? 'text-blue-500 hover:underline' : 'text-zinc-500 line-through'}`}
                  title={!fork.repo ? "This fork has been deleted" : undefined}
                >
                  {fork.forker?.username}/{fork.repo?.name || "deleted-repo"}
                </Link>
                <div className="text-xs text-zinc-500">
                  Forked {formatRelativeTime(fork.created_at)}
                </div>
              </div>
            </div>
            {fork.repo && (
              <Link
                href={`/repos/${fork.repo.id}`}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-700"
              >
                Go to fork
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
