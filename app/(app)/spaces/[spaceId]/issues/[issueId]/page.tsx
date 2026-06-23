"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  useContributors,
  useIssue,
  useMilestones,
  useUpdates,
  useWorkActivity,
  useWorkComments,
} from "@/lib/hooks/useSpaces";
import { useRepos } from "@/lib/hooks/useRepos";
import { IssuePriorityBadge, IssueStatusBadge } from "@/components/spaces/SpaceIssueBadges";
import WorkCommentsPanel from "@/components/spaces/WorkCommentsPanel";
import WorkActivityTimeline from "@/components/spaces/WorkActivityTimeline";
import ProgressUpdateCard from "@/components/spaces/ProgressUpdateCard";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import { ArrowLeftIcon } from "@/components/ui/Icons";
import { formatRelativeTime } from "@/lib/utils";
import * as api from "@/lib/services/spacesApi";
import * as cache from "@/lib/services/requestCache";
import type { SpaceIssuePriority, SpaceIssueStatus, SpaceWorkItem, WorkItemType } from "@/lib/types";
import { parseWorkSearchParams, serializeWorkQuery } from "@/lib/workFilters";
import RichComposer from "@/components/ui/RichComposer";
import RichText from "@/components/ui/RichText";
import ExternalImage from "@/components/ui/ExternalImage";
import { XMarkIcon } from "@heroicons/react/24/outline";

const STATUS_OPTIONS: SpaceIssueStatus[] = ["open", "triaged", "in-progress", "resolved", "closed"];
const PRIORITY_OPTIONS: SpaceIssuePriority[] = ["low", "medium", "high", "critical"];
const TYPE_OPTIONS: WorkItemType[] = ["task", "bug", "feature", "docs", "research"];
const CLOSE_REASON_OPTIONS = ["", "duplicate", "invalid", "archived"];
const CUSTOM_CLOSE_REASON_VALUE = "__custom__";
const ACTIVITY_PAGE_SIZE = 20;

export default function WorkDetailPage({
  params,
}: {
  params: Promise<{ spaceId: string; issueId: string }>;
}) {
  const { spaceId, issueId } = use(params);
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { issue, loading, error, refetch } = useIssue(spaceId, issueId);
  const { contributors } = useContributors(spaceId);
  const { repos } = useRepos(spaceId);
  const { milestones } = useMilestones(spaceId);
  const { updates, total: updateCount, refetch: refetchUpdates } = useUpdates(spaceId, 1, {
    work_item_id: issueId,
    limit: 2,
  });
  const { comments, refetch: refetchComments } = useWorkComments(spaceId, issueId);
  const [activityPage, setActivityPage] = useState(1);
  const {
    activity: activityPageItems,
    total: activityTotal,
    loading: activityLoading,
    refetch: refetchActivity,
  } = useWorkActivity(spaceId, issueId, activityPage, ACTIVITY_PAGE_SIZE);
  const [activity, setActivity] = useState<typeof activityPageItems>([]);
  const linkedUpdatesPreview = updates;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [quickAction, setQuickAction] = useState<string | null>(null);
  const [quickStatus, setQuickStatus] = useState<SpaceIssueStatus>("open");
  const [quickCloseReason, setQuickCloseReason] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState("");
  const [previewAttachmentIndex, setPreviewAttachmentIndex] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<SpaceIssueStatus>("open");
  const [priority, setPriority] = useState<SpaceIssuePriority>("medium");
  const [type, setType] = useState<WorkItemType>("task");
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [repoId, setRepoId] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [goodFirstTask, setGoodFirstTask] = useState(false);
  const [helpWanted, setHelpWanted] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");
  const [closeReason, setCloseReason] = useState("");
  const [estimate, setEstimate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [neededSkill, setNeededSkill] = useState("");

  function populateDraftFromIssue(nextIssue: SpaceWorkItem) {
    setTitle(nextIssue.title);
    setBody(nextIssue.body);
    setStatus(nextIssue.status);
    setQuickStatus(nextIssue.status);
    setPriority(nextIssue.priority);
    setType(nextIssue.type);
    setAssigneeUserId(nextIssue.assignee_user_id ?? "");
    setRepoId(nextIssue.repo_id ?? "");
    setMilestoneId(nextIssue.milestone_id ?? "");
    setGoodFirstTask(Boolean(nextIssue.good_first_task));
    setHelpWanted(Boolean(nextIssue.help_wanted));
    setBlockedReason(nextIssue.blocked_reason ?? "");
    setCloseReason(nextIssue.close_reason ?? "");
    setQuickCloseReason(nextIssue.close_reason ?? "");
    setEstimate(nextIssue.estimate ?? "");
    setTargetDate(nextIssue.target_date ? nextIssue.target_date.slice(0, 10) : "");
    setNeededSkill(nextIssue.needed_skill ?? "");
    setStatusUpdateError("");
  }

  useEffect(() => {
    if (!issue) return;
    populateDraftFromIssue(issue);
  }, [issue]);

  useEffect(() => {
    if (previewAttachmentIndex === null) return;
    const attachmentCount = issue?.attachments?.length ?? 0;
    if (attachmentCount === 0 || previewAttachmentIndex >= attachmentCount) {
      setPreviewAttachmentIndex(null);
    }
  }, [issue?.attachments?.length, previewAttachmentIndex]);

  useEffect(() => {
    if (previewAttachmentIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewAttachmentIndex(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [previewAttachmentIndex]);

  useEffect(() => {
    setActivity((current) => {
      if (activityPage === 1) {
        const sameLength = current.length === activityPageItems.length;
        const sameIds = sameLength
          && current.every((entry, index) => entry.id === activityPageItems[index]?.id);
        return sameIds ? current : activityPageItems;
      }

      const existingIds = new Set(current.map((entry) => entry.id));
      const nextChunk = activityPageItems.filter((entry) => !existingIds.has(entry.id));
      if (!nextChunk.length) return current;
      return [...current, ...nextChunk];
    });
  }, [activityPage, activityPageItems]);

  const queryString = serializeWorkQuery(
    parseWorkSearchParams(new URLSearchParams(searchParams.toString()))
  );
  const backHref = queryString ? `/spaces/${spaceId}/work?${queryString}` : `/spaces/${spaceId}/work`;

  const canManage = Boolean(issue?.viewer_state?.can_manage);
  const canEditContent = Boolean(issue?.viewer_state?.can_edit_content);
  const canPostUpdates = Boolean(issue?.viewer_state?.is_member);
  const closeReasonSelectValue = CLOSE_REASON_OPTIONS.includes(closeReason)
    ? closeReason
    : CUSTOM_CLOSE_REASON_VALUE;
  const quickCloseReasonSelectValue = CLOSE_REASON_OPTIONS.includes(quickCloseReason)
    ? quickCloseReason
    : CUSTOM_CLOSE_REASON_VALUE;

  async function refreshEverything() {
    setActivityPage(1);
    setActivity([]);
    refetch();
    refetchComments();
    refetchActivity();
    refetchUpdates();
  }

  const canLoadMoreActivity = activity.length < activityTotal;

  function handleLoadMoreActivity() {
    if (activityLoading || !canLoadMoreActivity) return;
    setActivityPage((current) => current + 1);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!issue) return;

    if (canManage && status === "closed" && !closeReason.trim()) {
      setSaveError("Close reason is required when closing this work item.");
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      await api.updateWork(spaceId, issue.id, {
        title: title.trim(),
        body: body.trim(),
        ...(canManage
          ? {
              status,
              priority,
              type,
              assignee_user_id: assigneeUserId || null,
              repo_id: repoId || null,
              milestone_id: milestoneId || null,
              good_first_task: goodFirstTask,
              help_wanted: helpWanted,
              blocked_reason: blockedReason.trim() || null,
              close_reason: closeReason.trim() || null,
              estimate: estimate.trim() || null,
              target_date: targetDate || null,
              needed_skill: neededSkill.trim() || null,
            }
          : {}),
      });
      setEditing(false);
      cache.invalidateSpace(spaceId, "work");
      await refreshEverything();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update work item");
    } finally {
      setSaving(false);
    }
  }

  async function runQuickAction(action: string, patch: Parameters<typeof api.updateWork>[2]) {
    if (!issue) return;
    setQuickAction(action);
    try {
      await api.updateWork(spaceId, issue.id, patch);
      cache.invalidateSpace(spaceId, "work");
      await refreshEverything();
    } finally {
      setQuickAction(null);
    }
  }

  async function handleQuickStatusUpdate() {
    if (!issue || !canManage || quickStatus === issue.status) return;

    if (quickStatus === "closed" && !quickCloseReason.trim()) {
      setStatusUpdateError("Close reason is required when closing this work item.");
      return;
    }

    setStatusUpdating(true);
    setStatusUpdateError("");
    try {
      await api.updateWork(spaceId, issue.id, {
        status: quickStatus,
        close_reason: quickStatus === "closed" ? quickCloseReason.trim() : null,
      });
      cache.invalidateSpace(spaceId, "work");
      await refreshEverything();
    } catch (err) {
      setStatusUpdateError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-sm text-zinc-400">{error || "Work item not found."}</p>
        <Link href={backHref} className="mt-3 text-xs text-sky-400 transition-colors hover:text-sky-300">
          Back to Work
        </Link>
      </div>
    );
  }

  const attachments = issue.attachments ?? [];
  const previewAttachment = previewAttachmentIndex === null ? null : attachments[previewAttachmentIndex] ?? null;

  return (
    <>
    <div className="mx-auto max-w-6xl p-4">
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Work
      </Link>

      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40">
        <div className="border-b border-zinc-800 px-6 py-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <IssueStatusBadge status={issue.status} />
            <IssuePriorityBadge priority={issue.priority} />
            <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-300">
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
              <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-300">
                Blocked
              </span>
            ) : null}
            {issue.due_state === "overdue" ? (
              <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-300">
                Overdue
              </span>
            ) : issue.due_state === "due_soon" ? (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
                Due soon
              </span>
            ) : null}
            {issue.is_stale ? (
              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
                Stale
              </span>
            ) : null}
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white">{issue.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <Avatar user={issue.author} size="sm" />
                  <span>Opened by {issue.author?.name ?? "Unknown"}</span>
                </div>
                <span>{formatRelativeTime(issue.created_at)}</span>
                <span>{issue.assignee ? `Assigned to ${issue.assignee.name}` : "Unassigned"}</span>
                {issue.repo ? <span>Repo: {issue.repo.name}</span> : null}
                {issue.milestone ? <span>Milestone: {issue.milestone.title}</span> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {issue.viewer_state?.can_claim ? (
                <button
                  onClick={() => runQuickAction("claim", { assignee_user_id: user?.id || "" })}
                  disabled={Boolean(quickAction)}
                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {quickAction === "claim" ? "Claiming..." : "Claim"}
                </button>
              ) : null}
              {issue.viewer_state?.can_start ? (
                <button
                  onClick={() => runQuickAction("start", { status: "in-progress" })}
                  disabled={Boolean(quickAction)}
                  className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 transition-colors hover:bg-sky-500/20 disabled:opacity-50"
                >
                  {quickAction === "start" ? "Starting..." : "Start work"}
                </button>
              ) : null}
              {issue.viewer_state?.can_resolve ? (
                <button
                  onClick={() => runQuickAction("resolve", { status: "resolved" })}
                  disabled={Boolean(quickAction)}
                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {quickAction === "resolve" ? "Resolving..." : "Resolve"}
                </button>
              ) : null}
              {canEditContent ? (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                >
                  Edit work
                </button>
              ) : null}
              {canPostUpdates ? (
                <Link
                  href={`/spaces/${spaceId}/updates?compose=true&workItemId=${issue.id}`}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  Post update
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4 px-6 py-5">
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
              />
              <RichComposer
                value={body}
                onChange={(value) => setBody(value)}
                rows={6}
                previewClassName="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm leading-relaxed text-white"
                className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm leading-relaxed text-transparent caret-white focus:border-zinc-600 focus:outline-none selection:bg-[#1d9bf0]/30"
              />
            </div>

            {canManage ? (
              <>
                <div className="grid gap-3 sm:grid-cols-4">
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as SpaceIssueStatus)}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as SpaceIssuePriority)}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <select
                    value={type}
                    onChange={(event) => setType(event.target.value as WorkItemType)}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <select
                    value={assigneeUserId}
                    onChange={(event) => setAssigneeUserId(event.target.value)}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {contributors.map((member) => (
                      <option key={member.id} value={member.user_id}>
                        {member.user?.name ?? member.user_id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <select
                    value={repoId}
                    onChange={(event) => setRepoId(event.target.value)}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
                  >
                    <option value="">No linked repo</option>
                    {repos.map((repo) => (
                      <option key={repo.id} value={repo.id}>
                        {repo.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={milestoneId}
                    onChange={(event) => setMilestoneId(event.target.value)}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
                  >
                    <option value="">No milestone</option>
                    {milestones.map((milestone) => (
                      <option key={milestone.id} value={milestone.id}>
                        {milestone.title}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={neededSkill}
                    onChange={(event) => setNeededSkill(event.target.value)}
                    placeholder="Needed skill"
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    value={estimate}
                    onChange={(event) => setEstimate(event.target.value)}
                    placeholder="Estimate"
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                  />
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(event) => setTargetDate(event.target.value)}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
                  />
                  <select
                    value={closeReasonSelectValue}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (nextValue === CUSTOM_CLOSE_REASON_VALUE) {
                        if (CLOSE_REASON_OPTIONS.includes(closeReason)) {
                          setCloseReason("");
                        }
                        return;
                      }
                      setCloseReason(nextValue);
                    }}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
                  >
                    {CLOSE_REASON_OPTIONS.map((option) => (
                      <option key={option || "none"} value={option}>
                        {option ? `Close reason: ${option}` : "No close reason"}
                      </option>
                    ))}
                    <option value={CUSTOM_CLOSE_REASON_VALUE}>Close reason: custom</option>
                  </select>
                </div>

                {closeReasonSelectValue === CUSTOM_CLOSE_REASON_VALUE ? (
                  <input
                    type="text"
                    value={closeReason}
                    onChange={(event) => setCloseReason(event.target.value)}
                    placeholder="Type close reason"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                  />
                ) : null}

                <input
                  type="text"
                  value={blockedReason}
                  onChange={(event) => setBlockedReason(event.target.value)}
                  placeholder="Blocked reason"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                />

                <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={goodFirstTask}
                      onChange={(event) => setGoodFirstTask(event.target.checked)}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
                    />
                    Good first task
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={helpWanted}
                      onChange={(event) => setHelpWanted(event.target.checked)}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
                    />
                    Help wanted
                  </label>
                </div>
              </>
            ) : null}

            <div className="flex items-center justify-end gap-2">
              {saveError ? <span className="mr-auto text-xs text-rose-400">{saveError}</span> : null}
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  populateDraftFromIssue(issue);
                }}
                className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim() || !body.trim()}
                className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 px-6 py-5">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
              <div className="space-y-6">
                <section>
                  <h2 className="text-sm font-semibold text-white">Work description</h2>
                  <RichText text={issue.body} className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-300" />
                </section>

                {attachments.length ? (
                  <section>
                    <h2 className="text-sm font-semibold text-white">Photos</h2>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {attachments.map((attachment, index) => (
                        <button
                          key={attachment.id}
                          type="button"
                          onClick={() => setPreviewAttachmentIndex(index)}
                          className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700"
                        >
                          <ExternalImage
                            src={attachment.url}
                            alt={attachment.filename}
                            className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.02]"
                            fallbackClassName="aspect-video w-full"
                          />
                          <div className="border-t border-zinc-800 px-3 py-2">
                            <p className="truncate text-left text-xs font-medium text-zinc-300">{attachment.filename}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="grid gap-4 border-t border-zinc-800 pt-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Status</p>
                    <div className="mt-2">
                      <IssueStatusBadge status={issue.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Priority</p>
                    <div className="mt-2">
                      <IssuePriorityBadge priority={issue.priority} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Assignee</p>
                    <p className="mt-2 text-sm text-zinc-300">{issue.assignee?.name ?? "Unassigned"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Type</p>
                    <p className="mt-2 text-sm capitalize text-zinc-300">{issue.type}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Repo</p>
                    <p className="mt-2 text-sm text-zinc-300">{issue.repo?.name ?? "No linked repo"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Milestone</p>
                    <p className="mt-2 text-sm text-zinc-300">{issue.milestone?.title ?? "No milestone"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Needed skill</p>
                    <p className="mt-2 text-sm text-zinc-300">{issue.needed_skill || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Estimate</p>
                    <p className="mt-2 text-sm text-zinc-300">{issue.estimate || "Not set"}</p>
                  </div>
                </section>

                <section className="grid gap-4 border-t border-zinc-800 pt-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Blocked reason</p>
                    <p className="mt-2 text-sm text-zinc-300">{issue.blocked_reason || "None"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Target date</p>
                    <p className="mt-2 text-sm text-zinc-300">{issue.target_date ? new Date(issue.target_date).toLocaleDateString() : "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Close reason</p>
                    <p className="mt-2 text-sm text-zinc-300">{issue.close_reason || "None"}</p>
                  </div>
                </section>
              </div>

              <aside className="space-y-4">
                {canManage ? (
                  <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                    <h3 className="text-sm font-semibold text-white">Status update</h3>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Change only the work status without editing the full work item.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <select
                        value={quickStatus}
                        onChange={(event) => {
                          const nextStatus = event.target.value as SpaceIssueStatus;
                          setQuickStatus(nextStatus);
                          if (nextStatus !== "closed") {
                            setQuickCloseReason("");
                            setStatusUpdateError("");
                          }
                        }}
                        disabled={statusUpdating}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none disabled:opacity-60"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleQuickStatusUpdate}
                        disabled={statusUpdating || quickStatus === issue.status}
                        className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {statusUpdating ? "Updating..." : "Update"}
                      </button>
                    </div>
                    {quickStatus === "closed" ? (
                      <>
                        <select
                          value={quickCloseReasonSelectValue}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            if (nextValue === CUSTOM_CLOSE_REASON_VALUE) {
                              if (CLOSE_REASON_OPTIONS.includes(quickCloseReason)) {
                                setQuickCloseReason("");
                              }
                              return;
                            }
                            setQuickCloseReason(nextValue);
                          }}
                          disabled={statusUpdating}
                          className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none disabled:opacity-60"
                        >
                          <option value="">Select close reason</option>
                          {CLOSE_REASON_OPTIONS.filter(Boolean).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                          <option value={CUSTOM_CLOSE_REASON_VALUE}>custom</option>
                        </select>
                        {quickCloseReasonSelectValue === CUSTOM_CLOSE_REASON_VALUE ? (
                          <input
                            type="text"
                            value={quickCloseReason}
                            onChange={(event) => setQuickCloseReason(event.target.value)}
                            disabled={statusUpdating}
                            placeholder="Type close reason"
                            className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none disabled:opacity-60"
                          />
                        ) : null}
                      </>
                    ) : null}
                    {statusUpdateError ? (
                      <p className="mt-2 text-xs text-rose-400">{statusUpdateError}</p>
                    ) : null}
                  </section>
                ) : null}

                <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <h3 className="text-sm font-semibold text-white">Linked updates</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {updateCount} update(s) connected to this work item. Showing latest 2.
                  </p>
                  <div className="mt-3 space-y-3">
                    {linkedUpdatesPreview.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
                        No linked updates yet.
                      </div>
                    ) : (
                      linkedUpdatesPreview.map((update) => (
                        <ProgressUpdateCard key={update.id} update={update} />
                      ))
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/spaces/${spaceId}/updates?workItemId=${issue.id}`}
                      className="inline-flex text-xs text-zinc-300 transition-colors hover:text-white"
                    >
                      View all linked updates
                    </Link>
                    {canPostUpdates ? (
                      <Link
                        href={`/spaces/${spaceId}/updates?compose=true&workItemId=${issue.id}`}
                        className="inline-flex text-xs text-sky-400 transition-colors hover:text-sky-300"
                      >
                        Post a linked update
                      </Link>
                    ) : null}
                  </div>
                </section>
              </aside>
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <div className="mx-auto w-full max-w-5xl">
                <WorkCommentsPanel
                  spaceId={spaceId}
                  issueId={issueId}
                  currentUser={user}
                  comments={comments}
                  onRefresh={() => {
                    refetchComments();
                    refetchActivity();
                  }}
                />
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <div className="mx-auto w-full max-w-5xl">
                <WorkActivityTimeline
                  spaceId={spaceId}
                  issueId={issueId}
                  activity={activity}
                  canLoadMore={canLoadMoreActivity}
                  loadingMore={activityLoading && activityPage > 1}
                  onLoadMore={handleLoadMoreActivity}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    {previewAttachment ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
        onClick={() => setPreviewAttachmentIndex(null)}
      >
        <button
          type="button"
          onClick={() => setPreviewAttachmentIndex(null)}
          className="absolute right-4 top-4 rounded-full bg-zinc-800/80 p-2 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
          aria-label="Close image preview"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="relative max-h-[85vh] max-w-[90vw]" onClick={(event) => event.stopPropagation()}>
          <ExternalImage
            src={previewAttachment.url}
            alt={previewAttachment.filename}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            fallbackClassName="h-[50vh] w-[50vw] rounded-lg"
          />
          <p className="mt-3 text-center text-sm text-zinc-400">{previewAttachment.filename}</p>

          {attachments.length > 1 ? (
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setPreviewAttachmentIndex((current) => (
                    current === null ? 0 : (current - 1 + attachments.length) % attachments.length
                  ));
                }}
                className="pointer-events-auto -ml-12 rounded-full bg-zinc-800/80 p-2 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
                aria-label="Previous photo"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setPreviewAttachmentIndex((current) => (
                    current === null ? 0 : (current + 1) % attachments.length
                  ));
                }}
                className="pointer-events-auto -mr-12 rounded-full bg-zinc-800/80 p-2 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
                aria-label="Next photo"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    ) : null}
    </>
  );
}
