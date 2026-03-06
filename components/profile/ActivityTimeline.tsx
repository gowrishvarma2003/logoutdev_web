"use client";

/**
 * ActivityTimeline — unified feed of posts, discussions, and project updates.
 * Groups items by date and shows distinct icons per activity type.
 */

import Link from "next/link";
import type { ActivityItem } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import {
  ChatIcon,
  DocumentTextIcon,
  RocketIcon,
} from "@/components/ui/Icons";

interface ActivityTimelineProps {
  activity: ActivityItem[];
  loading?: boolean;
}

const TYPE_CONFIG = {
  post: {
    icon: <DocumentTextIcon className="w-4 h-4" />,
    label: "Posted",
    color: "bg-violet-500/15 text-violet-400",
    border: "border-violet-500/20",
  },
  discussion: {
    icon: <ChatIcon className="w-4 h-4" />,
    label: "Started a discussion",
    color: "bg-sky-500/15 text-sky-400",
    border: "border-sky-500/20",
  },
  update: {
    icon: <RocketIcon className="w-4 h-4" />,
    label: "Posted an update",
    color: "bg-emerald-500/15 text-emerald-400",
    border: "border-emerald-500/20",
  },
} as const;

function ActivityCard({ entry }: { entry: ActivityItem }) {
  const config = TYPE_CONFIG[entry.type];
  const { item } = entry;

  const title = item.title ?? (item.content ? item.content.slice(0, 80) : "Untitled");
  const subLabel =
    entry.type !== "post" && item.space ? item.space.name : null;

  const href =
    entry.type === "post"
      ? "#"
      : entry.type === "discussion" && item.space
      ? `/spaces/${item.space.id}`
      : item.space
      ? `/spaces/${item.space.id}`
      : "#";

  return (
    <div className="flex gap-3 group">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${config.color} ${config.border}`}
        >
          {config.icon}
        </div>
        <div className="w-px flex-1 bg-zinc-800 mt-2 min-h-[16px]" />
      </div>

      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">
            {config.label}
          </span>
          <span className="text-[11px] text-zinc-600">
            {formatRelativeTime(entry.created_at)}
          </span>
        </div>

        <Link
          href={href}
          className="group/link"
          aria-label={title}
        >
          <p className="text-sm text-zinc-300 group-hover/link:text-white transition-colors line-clamp-2 leading-relaxed">
            {title}
          </p>
          {subLabel && (
            <p className="text-xs text-zinc-600 mt-0.5">in {subLabel}</p>
          )}
        </Link>
      </div>
    </div>
  );
}

export default function ActivityTimeline({
  activity,
  loading = false,
}: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-zinc-800 rounded w-1/4" />
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-600 text-sm">No activity to show.</p>
      </div>
    );
  }

  return (
    <div>
      {activity.map((entry, idx) => (
        <ActivityCard key={`${entry.type}-${entry.item.id}-${idx}`} entry={entry} />
      ))}
    </div>
  );
}
