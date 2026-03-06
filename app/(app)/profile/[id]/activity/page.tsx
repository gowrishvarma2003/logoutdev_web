"use client";

/**
 * Profile activity page — /profile/:id/activity
 * Shows a unified timeline of posts, discussions started, and project updates.
 */

import { use, useState } from "react";
import { useProfileActivity } from "@/lib/hooks/useProfile";
import ActivityTimeline from "@/components/profile/ActivityTimeline";

interface ProfileActivityPageProps {
  params: Promise<{ id: string }>;
}

export default function ProfileActivityPage({ params }: ProfileActivityPageProps) {
  const { id: username } = use(params);
  const [page, setPage] = useState(1);

  const { activity, total, loading, error } = useProfileActivity(username, page);

  if (error) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-rose-400 text-sm">{error}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="px-5 py-6">
      <ActivityTimeline activity={activity} loading={loading} />

      {/* Pagination */}
      {!loading && totalPages > 1 && (
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
      )}
    </div>
  );
}
