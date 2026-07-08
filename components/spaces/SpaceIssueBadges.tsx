"use client";

import type { SpaceIssuePriority, SpaceIssueStatus } from "@/lib/types";

const STATUS_STYLES: Record<SpaceIssueStatus, { bg: string; text: string; dot: string; label: string }> = {
  open: { bg: "bg-rose-500/10", text: "text-rose-300", dot: "bg-rose-400", label: "Open" },
  triaged: { bg: "bg-amber-500/10", text: "text-amber-300", dot: "bg-amber-400", label: "Triaged" },
  "in-progress": { bg: "bg-sky-500/10", text: "text-sky-300", dot: "bg-sky-400", label: "In Progress" },
  resolved: { bg: "bg-emerald-500/10", text: "text-emerald-300", dot: "bg-emerald-400", label: "Resolved" },
  closed: { bg: "bg-surface-hover", text: "text-text-muted", dot: "bg-zinc-500", label: "Closed" },
};

const PRIORITY_STYLES: Record<SpaceIssuePriority, { bg: string; text: string; label: string }> = {
  low: { bg: "bg-surface-hover", text: "text-text-secondary", label: "Low" },
  medium: { bg: "bg-sky-500/10", text: "text-sky-300", label: "Medium" },
  high: { bg: "bg-amber-500/10", text: "text-amber-300", label: "High" },
  critical: { bg: "bg-rose-500/10", text: "text-rose-300", label: "Critical" },
};

export function IssueStatusBadge({ status }: { status: SpaceIssueStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${style.bg} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

export function IssuePriorityBadge({ priority }: { priority: SpaceIssuePriority }) {
  const style = PRIORITY_STYLES[priority];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}
