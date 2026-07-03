"use client";

import { useState } from "react";
import Link from "next/link";
import LaunchCard from "@/components/launches/LaunchCard";
import LaunchFilters from "@/components/launches/LaunchFilters";
import Spinner from "@/components/ui/Spinner";
import { PlusIcon, SparklesIcon } from "@/components/ui/Icons";
import { useLaunches } from "@/lib/hooks/useLaunches";
import EmptyState from "@/components/ui/EmptyState";

export default function LaunchesPage() {
  const [q, setQ] = useState("");
  const [launchPhase, setLaunchPhase] = useState("beta");
  const [stack, setStack] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const launches = useLaunches({
    q: q || undefined,
    launch_phase: launchPhase,
    stack: stack || undefined,
    sort,
    page,
  });

  const hasMore = launches.launches.length >= 20;

  return (
    <div className="flex flex-col">
      {/* Clean header */}
      <div className="sticky top-0 z-10 border-b border-zinc-800/60 bg-zinc-950/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Launches</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Discover products in beta and live
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/launches/me"
              className="rounded-xl border border-zinc-700/80 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800/50"
            >
              My launches
            </Link>
            <Link
              href="/launches/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-zinc-100"
            >
              <PlusIcon className="h-4 w-4" />
              Launch
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <LaunchFilters
        q={q}
        onQChange={setQ}
        launchPhase={launchPhase}
        onLaunchPhaseChange={setLaunchPhase}
        stack={stack}
        onStackChange={setStack}
        sort={sort}
        onSortChange={setSort}
      />

      {/* Launches grid */}
      <div className="p-4 sm:p-6">
        {launches.loading ? (
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : launches.error ? (
          <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{launches.error}</p>
        ) : launches.launches.length === 0 ? (
          <EmptyState
            icon={<SparklesIcon className="h-8 w-8" />}
            title="No launches found"
            description="Adjust your filters, or put your product in front of the community today."
            tone="feed"
            size="lg"
            action={
              <Link
                href="/launches/new"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
              >
                <PlusIcon className="h-4 w-4" />
                Launch your product
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {launches.launches.map((launch) => (
                <LaunchCard key={launch.id} launch={launch} />
              ))}
            </div>

            {(page > 1 || hasMore) && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-xs text-zinc-500">Page {page}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasMore}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
