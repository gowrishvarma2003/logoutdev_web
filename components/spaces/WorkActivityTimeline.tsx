"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { ClockIcon, PencilSquareIcon } from "@/components/ui/Icons";
import type { SpaceWorkActivity } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

function isSeriousActivity(entry: SpaceWorkActivity) {
  return !entry.event_type.startsWith("comment");
}

function describeActivity(entry: SpaceWorkActivity) {
  switch (entry.event_type) {
    case "work_created":
      return {
        icon: <ClockIcon className="h-4 w-4" />,
        title: "Created the work item",
        details: entry.payload?.title ?? null,
      };
    case "work_updated":
      return {
        icon: <PencilSquareIcon className="h-4 w-4" />,
        title: entry.payload?.source === "bulk" ? "Bulk updated the work item" : "Updated the work item",
        details: entry.payload?.changes?.map((change) => `${change.label}: ${change.from ?? "None"} -> ${change.to ?? "None"}`).join(" | ") ?? null,
      };
    case "progress_update_added":
      return {
        icon: <ClockIcon className="h-4 w-4" />,
        title: "Linked a progress update",
        details: entry.payload?.title ?? null,
      };
    case "progress_update_updated":
      return {
        icon: <ClockIcon className="h-4 w-4" />,
        title: "Updated a linked progress update",
        details: entry.payload?.title ?? null,
      };
    default:
      return {
        icon: <ClockIcon className="h-4 w-4" />,
        title: entry.event_type.replace(/_/g, " "),
        details: null,
      };
  }
}

export default function WorkActivityTimeline({
  spaceId,
  issueId,
  activity,
  canLoadMore = false,
  loadingMore = false,
  onLoadMore,
}: {
  spaceId: string;
  issueId: string;
  activity: SpaceWorkActivity[];
  canLoadMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const seriousActivity = activity.filter(isSeriousActivity);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/20">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Activity</h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          Timeline of significant work changes and progress updates connected to this work item.
        </p>
      </div>

      <div className="p-4">
        {seriousActivity.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
            No serious updates yet.
          </div>
        ) : (
          <div className="space-y-3">
            {seriousActivity.map((entry) => {
              const summary = describeActivity(entry);
              return (
                <article
                  key={entry.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/40 px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <Avatar user={entry.actor ?? null} size="sm" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-0.5 text-zinc-300">
                          {summary.icon}
                          {summary.title}
                        </span>
                        <span>{entry.actor?.name ?? "System"}</span>
                        <span>·</span>
                        <span>{formatRelativeTime(entry.created_at)}</span>
                      </div>
                      {summary.details ? (
                        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{summary.details}</p>
                      ) : null}
                      {entry.event_type.startsWith("progress_update") ? (
                        <Link
                          href={`/spaces/${spaceId}/updates?workItemId=${issueId}`}
                          className="mt-2 inline-flex text-xs text-sky-400 transition-colors hover:text-sky-300"
                        >
                          View linked updates
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
            {canLoadMore ? (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load more activity"}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
