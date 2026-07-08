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
        icon={<ArrowsRightLeftIcon className="h-10 w-10 text-text-disabled" />}
        title="No forks yet"
        description="This repository hasn't been forked by anyone yet."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="border-b border-border-default pb-4">
        <h2 className="text-xl font-semibold text-text-primary">Forks</h2>
        <p className="text-sm text-text-muted">
          Showing {fork_count} {fork_count === 1 ? 'fork' : 'forks'} of {repo.owner?.username}/{repo.name}
        </p>
      </div>

      <div className="divide-y divide-border-default/50 rounded-xl border border-border-default bg-app">
        {forks.map((fork) => (
          <div key={fork.id} className="flex items-center justify-between gap-4 p-4 hover:bg-surface/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                {fork.forker?.username?.charAt(0).toUpperCase() || "A"}
              </div>
              <div>
                <Link
                  href={fork.repo ? `/repos/${fork.repo.id}` : "#"}
                  className={`font-semibold ${fork.repo ? 'text-blue-500 hover:underline' : 'text-text-disabled line-through'}`}
                  title={!fork.repo ? "This fork has been deleted" : undefined}
                >
                  {fork.forker?.username}/{fork.repo?.name || "deleted-repo"}
                </Link>
                <div className="text-xs text-text-disabled">
                  Forked {formatRelativeTime(fork.created_at)}
                </div>
              </div>
            </div>
            {fork.repo && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/repos/${repo.id}/pulls/new?head_repo_id=${encodeURIComponent(fork.repo.id)}`}
                  className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
                >
                  Open PR from this fork
                </Link>
                <Link
                  href={`/repos/${fork.repo.id}`}
                  className="rounded-md border border-border-strong bg-surface-hover px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-active"
                >
                  Go to fork
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
