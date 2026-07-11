"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import { IssuePriorityBadge, IssueStatusBadge } from "@/components/spaces/SpaceIssueBadges";
import type { SpaceWorkItem } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import RichText from "@/components/ui/RichText";

function badgeClass(kind: "danger" | "warning" | "info" | "neutral" | "success") {
  if (kind === "danger") return "bg-rose-500/10 text-rose-300";
  if (kind === "warning") return "bg-amber-500/10 text-amber-300";
  if (kind === "success") return "bg-emerald-500/10 text-emerald-300";
  if (kind === "info") return "bg-sky-500/10 text-sky-300";
  return "bg-surface-hover text-text-secondary";
}

export default function WorkItemCard({
  issue,
  spaceId,
  queryString,
  selectable = false,
  selected = false,
  onSelectedChange,
  currentUserId,
  busyAction,
  onClaim,
  onStart,
  onResolve,
  onMarkTriaged,
  onAssignToMe,
  onAddToProductivity,
}: {
  issue: SpaceWorkItem;
  spaceId: string;
  queryString?: string;
  selectable?: boolean;
  selected?: boolean;
  onSelectedChange?: (checked: boolean) => void;
  currentUserId?: string;
  busyAction?: string | null;
  onClaim?: () => void;
  onStart?: () => void;
  onResolve?: () => void;
  onMarkTriaged?: () => void;
  onAssignToMe?: () => void;
  onAddToProductivity?: () => void;
}) {
  const router = useRouter();
  const href = queryString
    ? `/spaces/${spaceId}/work/${issue.id}?${queryString}`
    : `/spaces/${spaceId}/work/${issue.id}`;
  const isBusy = Boolean(busyAction);

  function handleCardClick(e: React.MouseEvent<HTMLElement>) {
    const target = e.target as HTMLElement;
    if (target.closest("button, input, a")) return;
    router.push(href);
  }

  return (
    <article
      onClick={handleCardClick}
      className="cursor-pointer border-b border-border-default/60 px-4 py-4 transition-colors hover:bg-surface-hover/30">
      <div className="flex items-start gap-3">
        {selectable ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => onSelectedChange?.(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border-strong bg-app text-text-primary"
          />
        ) : null}

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
            {issue.blocked_reason ? (
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badgeClass("danger")}`}>
                Blocked
              </span>
            ) : null}
            {issue.due_state === "overdue" ? (
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badgeClass("danger")}`}>
                Overdue
              </span>
            ) : issue.due_state === "due_soon" ? (
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badgeClass("warning")}`}>
                Due soon
              </span>
            ) : null}
            {issue.is_stale ? (
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badgeClass("neutral")}`}>
                Stale
              </span>
            ) : null}
            {issue.readiness === "needs_triage" ? (
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badgeClass("warning")}`}>
                Needs triage
              </span>
            ) : issue.readiness === "ready" ? (
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badgeClass("success")}`}>
                Ready
              </span>
            ) : null}
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Link href={href} className="text-sm font-semibold text-text-primary transition-colors hover:text-sky-300">
                {issue.title}
              </Link>
              <RichText text={issue.body} className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-text-muted" />
            </div>

            <div className="shrink-0">
              <Avatar user={issue.assignee ?? issue.author} size="sm" />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-disabled">
            <span>Opened {formatRelativeTime(issue.created_at)}</span>
            <span>By {issue.author?.name ?? "Unknown"}</span>
            <span>{issue.assignee ? `Assigned to ${issue.assignee.name}` : "Unassigned"}</span>
            {issue.repo ? <span>Repo: {issue.repo.name}</span> : null}
            {issue.milestone ? <span>Milestone: {issue.milestone.title}</span> : null}
            {issue.needed_skill ? <span>Needs {issue.needed_skill}</span> : null}
            {issue.estimate ? <span>Estimate: {issue.estimate}</span> : null}
            {issue.target_date ? <span>Due {new Date(issue.target_date).toLocaleDateString()}</span> : null}
            {issue.close_reason ? <span>Close reason: {issue.close_reason}</span> : null}
          </div>

          {(onAddToProductivity || issue.viewer_state?.can_claim || issue.viewer_state?.can_start || issue.viewer_state?.can_resolve || issue.viewer_state?.can_manage) ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {onAddToProductivity ? (
                <button
                  onClick={onAddToProductivity}
                  disabled={isBusy}
                  className="rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
                >
                  Add to Productivity
                </button>
              ) : null}
              {issue.viewer_state?.can_claim ? (
                <button
                  onClick={onClaim}
                  disabled={isBusy}
                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {busyAction === "claim" ? "Claiming..." : "Claim"}
                </button>
              ) : null}
              {issue.viewer_state?.can_start ? (
                <button
                  onClick={onStart}
                  disabled={isBusy}
                  className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 transition-colors hover:bg-sky-500/20 disabled:opacity-50"
                >
                  {busyAction === "start" ? "Starting..." : "Start work"}
                </button>
              ) : null}
              {issue.viewer_state?.can_resolve ? (
                <button
                  onClick={onResolve}
                  disabled={isBusy}
                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {busyAction === "resolve" ? "Resolving..." : "Resolve"}
                </button>
              ) : null}
              {issue.viewer_state?.can_manage && issue.status === "open" ? (
                <button
                  onClick={onMarkTriaged}
                  disabled={isBusy}
                  className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                >
                  {busyAction === "triage" ? "Updating..." : "Mark triaged"}
                </button>
              ) : null}
              {issue.viewer_state?.can_manage && currentUserId && issue.assignee_user_id !== currentUserId ? (
                <button
                  onClick={onAssignToMe}
                  disabled={isBusy}
                  className="rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
                >
                  {busyAction === "assign" ? "Assigning..." : "Assign to me"}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
