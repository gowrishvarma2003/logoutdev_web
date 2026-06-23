"use client";

import { useRepoContext } from "../layout";
import { useRepoInsights } from "@/lib/hooks/useRepos";
import Spinner from "@/components/ui/Spinner";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import { ChartBarIcon } from "@heroicons/react/24/outline";

export default function RepoInsightsPage() {
  const { repo } = useRepoContext();
  const { insights, loading, error, refetch } = useRepoInsights(repo.id);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !insights) {
    return (
      <EmptyState
        icon={<ChartBarIcon className="h-10 w-10 text-zinc-500" />}
        title="Insights unavailable"
        description={error || "We couldn't load repository insights right now."}
        action={
          <button
            onClick={refetch}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition-colors"
          >
            Try again
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Stars", value: insights.summary.stars },
          { label: "Watchers", value: insights.summary.watchers },
          { label: "Forks", value: insights.summary.forks },
          { label: "Open PRs", value: insights.summary.open_pull_requests },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-semibold text-white">Top Contributors</h2>
          <div className="mt-4 space-y-3">
            {insights.contributors.length === 0 ? (
              <p className="text-sm text-zinc-500">No commit activity yet.</p>
            ) : (
              insights.contributors.map((contributor) => (
                <div key={`${contributor.author_email}-${contributor.author_name}`} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{contributor.author_name}</p>
                    <p className="truncate text-xs text-zinc-500">{contributor.author_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-200">{contributor.commit_count} commits</p>
                    <p className="text-xs text-zinc-500">{new Date(contributor.latest_commit_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-semibold text-white">Recent Maintainers</h2>
          <div className="mt-4 space-y-3">
            {insights.maintainers.length === 0 ? (
              <p className="text-sm text-zinc-500">No maintainers detected yet.</p>
            ) : (
              insights.maintainers.map((member) => (
                <div key={member.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3">
                  <p className="text-sm font-medium text-white">{member.user?.name || member.user_id}</p>
                  <p className="text-xs text-zinc-500">@{member.user?.username || member.user?.email || member.user_id}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-emerald-300">{member.effective_role}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="text-lg font-semibold text-white">Commit Activity</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {insights.commit_activity.length === 0 ? (
            <p className="text-sm text-zinc-500">No commit activity captured yet.</p>
          ) : (
            insights.commit_activity.map((day) => (
              <div key={day.date} className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3">
                <p className="text-xs text-zinc-500">{day.date}</p>
                <p className="mt-2 text-lg font-semibold text-white">{day.count}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
