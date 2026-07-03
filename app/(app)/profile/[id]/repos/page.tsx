"use client";

/**
 * Profile repos page — /profile/:id/repos
 * Lists owned repos + recent pull request / review activity.
 */

import { use, useState } from "react";
import Link from "next/link";
import { useProfileRepos } from "@/lib/hooks/useProfile";
import { ProfileListSkeleton } from "@/components/profile/ProfileSkeleton";
import { formatRelativeTime } from "@/lib/utils";
import {
  CodeBracketIcon,
  StarIcon,
  GitBranchIcon,
  UsersIcon,
  ChatIcon,
  ChevronRightIcon,
} from "@/components/ui/Icons";
import EmptyState from "@/components/ui/EmptyState";

interface ProfileReposPageProps {
  params: Promise<{ id: string }>;
}

const PR_STATUS_STYLES = {
  open: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  merged: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  closed: "text-zinc-400 bg-zinc-800 border-zinc-700",
} as const;

const REVIEW_STYLES = {
  approved: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  changes_requested: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  commented: "text-sky-300 bg-sky-500/10 border-sky-500/20",
  pending: "text-zinc-400 bg-zinc-800 border-zinc-700",
} as const;

export default function ProfileReposPage({ params }: ProfileReposPageProps) {
  const { id: username } = use(params);
  const [page, setPage] = useState(1);

  const { repos, recent_prs, recent_reviews, total, loading, error } = useProfileRepos(username, page);

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

  if (repos.length === 0 && recent_prs.length === 0 && recent_reviews.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          icon={<CodeBracketIcon className="h-7 w-7" />}
          title="No code activity yet"
          description="Create or connect repositories so commits, pull requests, and reviews can show up here."
          tone="repo"
          action={
            <Link href="/repos" className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100">
              Explore repos
            </Link>
          }
        />
      </div>
    );
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="py-4 space-y-6">
      {/* ── Owned repos ── */}
      {repos.length > 0 ? (
        <section>
          <h2 className="px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2">
            Repositories
          </h2>
          {repos.map((repo) => (
            <Link
              key={repo.id}
              href={repo.href}
              className="group flex items-start gap-3.5 px-5 py-4 border-b border-zinc-800 hover:bg-zinc-900/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/15 to-violet-500/15 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                <CodeBracketIcon className="w-4 h-4 text-sky-300" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors truncate">
                    {repo.name}
                  </h3>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                    repo.visibility === "public"
                      ? "border-sky-500/20 bg-sky-500/10 text-sky-300"
                      : "border-orange-500/20 bg-orange-500/10 text-orange-300"
                  }`}>
                    {repo.visibility}
                  </span>
                </div>
                {repo.description ? (
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {repo.description}
                  </p>
                ) : null}
                <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-600">
                  <span className="flex items-center gap-1">
                    <StarIcon className="w-3 h-3" />
                    {repo.star_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitBranchIcon className="w-3 h-3" />
                    {repo.fork_count}
                  </span>
                  {repo.open_pr_count > 0 ? (
                    <span className="flex items-center gap-1">
                      <UsersIcon className="w-3 h-3" />
                      {repo.open_pr_count} open PR{repo.open_pr_count !== 1 ? "s" : ""}
                    </span>
                  ) : null}
                </div>
              </div>

              <ChevronRightIcon className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors mt-1 shrink-0" />
            </Link>
          ))}
        </section>
      ) : null}

      {/* ── Recent pull requests ── */}
      {recent_prs.length > 0 ? (
        <section className="px-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3">
            Recent pull requests
          </h2>
          <div className="space-y-2">
            {recent_prs.map((pr) => (
              <Link
                key={pr.id}
                href={pr.href}
                className="group flex items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70 transition-colors"
              >
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${PR_STATUS_STYLES[pr.status]}`}>
                  {pr.status}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 group-hover:text-white transition-colors truncate">
                    {pr.title}
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    #{pr.number} in {pr.repo?.name ?? "repo"} · {formatRelativeTime(pr.updated_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Recent reviews ── */}
      {recent_reviews.length > 0 ? (
        <section className="px-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3">
            Recent reviews
          </h2>
          <div className="space-y-2">
            {recent_reviews.map((review) => (
              <Link
                key={review.id}
                href={review.href || "#"}
                className="group flex items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70 transition-colors"
              >
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${REVIEW_STYLES[review.status]}`}>
                  {review.status.replace("_", " ")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 group-hover:text-white transition-colors truncate">
                    {review.pull_request?.title ?? "Pull request"}
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-0.5 flex items-center gap-1">
                    <ChatIcon className="w-3 h-3" />
                    #{review.pull_request?.number ?? "?"} in {review.pull_request?.repo?.name ?? "repo"} · {formatRelativeTime(review.submitted_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Pagination ── */}
      {totalPages > 1 ? (
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
      ) : null}
    </div>
  );
}
