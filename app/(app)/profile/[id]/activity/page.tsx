"use client";

/**
 * Profile activity page — /profile/:id/activity
 * Unified timeline of posts, discussions started, and project updates,
 * with client-side type filtering.
 */

import { use, useState, useMemo } from "react";
import { useProfileActivity, useProfileHeatmap } from "@/lib/hooks/useProfile";
import ActivityTimeline from "@/components/profile/ActivityTimeline";
import ActivityHeatmap from "@/components/profile/ActivityHeatmap";
import { ProfileListSkeleton } from "@/components/profile/ProfileSkeleton";

interface ProfileActivityPageProps {
  params: Promise<{ id: string }>;
}

type FilterKey = "all" | "post" | "discussion" | "update" | "launch" | "launch_review" | "freelance_project" | "freelance_win";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "post", label: "Posts" },
  { key: "discussion", label: "Discussions" },
  { key: "update", label: "Updates" },
  { key: "launch", label: "Launches" },
  { key: "freelance_win", label: "Wins" },
];

const FREELANCE_TYPES = new Set(["freelance_project", "freelance_win"]);

export default function ProfileActivityPage({ params }: ProfileActivityPageProps) {
  const { id: username } = use(params);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterKey>("all");

  const { activity, total, loading, error } = useProfileActivity(username, page);
  const { heatmap, loading: heatmapLoading } = useProfileHeatmap(username);

  const filtered = useMemo(() => {
    if (filter === "all") return activity;
    if (filter === "freelance_win") return activity.filter((a) => FREELANCE_TYPES.has(a.type));
    return activity.filter((a) => a.type === filter);
  }, [activity, filter]);

  if (error) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-rose-400 text-sm">{error}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="px-5 py-5">
      {/* Activity heatmap */}
      <div className="mb-5">
        <ActivityHeatmap heatmap={heatmap} loading={heatmapLoading} />
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-3 mb-1 border-b border-zinc-900">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <ProfileListSkeleton rows={5} />
      ) : (
        <div className="pt-2">
          <ActivityTimeline activity={filtered} loading={false} />
        </div>
      )}

      {!loading && totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 pt-5 mt-4 border-t border-zinc-800">
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
