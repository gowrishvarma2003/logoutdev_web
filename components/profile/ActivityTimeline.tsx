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
  SparklesIcon,
  BoltIcon,
} from "@/components/ui/Icons";
import LinkedEntityCard from "@/components/connected/LinkedEntityCard";
import EmptyState from "@/components/ui/EmptyState";

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
  launch: {
    icon: <SparklesIcon className="w-4 h-4" />,
    label: "Published a launch",
    color: "bg-amber-500/15 text-amber-300",
    border: "border-amber-500/20",
  },
  launch_review: {
    icon: <SparklesIcon className="w-4 h-4" />,
    label: "Received launch feedback",
    color: "bg-sky-500/15 text-sky-300",
    border: "border-sky-500/20",
  },
  freelance_project: {
    icon: <BoltIcon className="w-4 h-4" />,
    label: "Freelance milestone",
    color: "bg-fuchsia-500/15 text-fuchsia-300",
    border: "border-fuchsia-500/20",
  },
  freelance_win: {
    icon: <BoltIcon className="w-4 h-4" />,
    label: "Won freelance work",
    color: "bg-emerald-500/15 text-emerald-300",
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
      ? item.linked_entity?.href || "#"
      : entry.type === "discussion" && item.space
      ? `/spaces/${item.space.id}`
      : item.href
      ? item.href
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
          {item.stats ? <p className="mt-1 text-xs text-zinc-500">{item.stats}</p> : null}
        </Link>
        {item.linked_entity ? (
          <div className="mt-3">
            <LinkedEntityCard entity={item.linked_entity} compact />
          </div>
        ) : null}
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
      <EmptyState
        icon={<RocketIcon className="h-6 w-6" />}
        title="Quiet timeline"
        description="Posts, launches, discussions, and repo updates will appear here as the profile gets moving."
        tone="project"
        size="sm"
      />
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
