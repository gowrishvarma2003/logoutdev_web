"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { IssuePriorityBadge, IssueStatusBadge } from "@/components/spaces/SpaceIssueBadges";
import type { SpaceIssue } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import RichText from "@/components/ui/RichText";

export default function SpaceIssueCard({
  issue,
  spaceId,
  compact = false,
}: {
  issue: SpaceIssue;
  spaceId: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/spaces/${spaceId}/work/${issue.id}`}
      className="block border-b border-border-default/60 px-4 py-4 transition-colors hover:bg-surface/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <IssueStatusBadge status={issue.status} />
            <IssuePriorityBadge priority={issue.priority} />
            <span className="rounded-full bg-surface-hover px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-text-secondary">
              {issue.type}
            </span>
            {issue.good_first_task ? (
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                Good first task
              </span>
            ) : null}
            {issue.help_wanted ? (
              <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-400">
                Help wanted
              </span>
            ) : null}
          </div>

          <h3 className="truncate text-sm font-semibold text-text-primary">{issue.title}</h3>
          {!compact && (
            <RichText text={issue.body} className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-text-muted" />
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-disabled">
            <span>Reported {formatRelativeTime(issue.created_at)}</span>
            <span>By {issue.author?.name ?? "Unknown"}</span>
            <span>{issue.assignee ? `Assigned to ${issue.assignee.name}` : "Unassigned"}</span>
            {issue.repo ? <span>Repo: {issue.repo.name}</span> : null}
            {issue.needed_skill ? <span>Needs {issue.needed_skill}</span> : null}
          </div>
        </div>

        <div className="shrink-0">
          <Avatar user={issue.assignee ?? issue.author} size="sm" />
        </div>
      </div>
    </Link>
  );
}
