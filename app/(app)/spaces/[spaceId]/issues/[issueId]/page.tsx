"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useContributors, useIssue, useSpace } from "@/lib/hooks/useSpaces";
import { IssuePriorityBadge, IssueStatusBadge } from "@/components/spaces/SpaceIssueBadges";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import { ArrowLeftIcon } from "@/components/ui/Icons";
import { formatRelativeTime } from "@/lib/utils";
import * as api from "@/lib/services/spacesApi";
import type { SpaceIssuePriority, SpaceIssueStatus } from "@/lib/types";
import RichComposer from "@/components/ui/RichComposer";
import RichText from "@/components/ui/RichText";

const STATUS_OPTIONS: SpaceIssueStatus[] = ["open", "triaged", "in-progress", "resolved", "closed"];
const PRIORITY_OPTIONS: SpaceIssuePriority[] = ["low", "medium", "high", "critical"];

export default function IssueDetailPage({
  params,
}: {
  params: Promise<{ spaceId: string; issueId: string }>;
}) {
  const { spaceId, issueId } = use(params);
  const { user } = useAuth();
  const { space } = useSpace(spaceId);
  const { issue, loading, error, refetch } = useIssue(spaceId, issueId);
  const { contributors } = useContributors(spaceId);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<SpaceIssueStatus>("open");
  const [priority, setPriority] = useState<SpaceIssuePriority>("medium");
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!issue) return;
    setTitle(issue.title);
    setBody(issue.body);
    setStatus(issue.status);
    setPriority(issue.priority);
    setAssigneeUserId(issue.assignee_user_id ?? "");
  }, [issue]);

  const currentMembership = useMemo(
    () => contributors.find((member) => member.user_id === user?.id) ?? null,
    [contributors, user?.id]
  );
  const canManage = Boolean(
    issue &&
    user &&
    (space?.owner_id === user.id || currentMembership?.role === "owner" || currentMembership?.role === "maintainer")
  );
  const canReporterEdit = Boolean(issue && user && issue.author_id === user.id && ["open", "triaged"].includes(issue.status));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!issue) return;

    setSaving(true);
    setSaveError("");
    try {
      await api.updateIssue(spaceId, issue.id, {
        title: title.trim(),
        body: body.trim(),
        ...(canManage
          ? {
              status,
              priority,
              assignee_user_id: assigneeUserId || null,
            }
          : {}),
      });
      setEditing(false);
      refetch();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to update issue");
    } finally {
      setSaving(false);
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
        <p className="text-sm text-zinc-400">{error || "Issue not found."}</p>
        <Link href={`/spaces/${spaceId}/issues`} className="mt-3 text-xs text-sky-400 transition-colors hover:text-sky-300">
          Back to Issues
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <Link
        href={`/spaces/${spaceId}/issues`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Issues
      </Link>

      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40">
        <div className="border-b border-zinc-800 px-6 py-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <IssueStatusBadge status={issue.status} />
            <IssuePriorityBadge priority={issue.priority} />
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
              </div>
            </div>

            {(canManage || canReporterEdit) && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
              >
                Edit issue
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4 px-6 py-5">
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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

            {canManage && (
              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SpaceIssueStatus)}
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
                  onChange={(e) => setPriority(e.target.value as SpaceIssuePriority)}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <select
                  value={assigneeUserId}
                  onChange={(e) => setAssigneeUserId(e.target.value)}
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
            )}

            <div className="flex items-center justify-end gap-2">
              {saveError && <span className="mr-auto text-xs text-rose-400">{saveError}</span>}
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setTitle(issue.title);
                  setBody(issue.body);
                  setStatus(issue.status);
                  setPriority(issue.priority);
                  setAssigneeUserId(issue.assignee_user_id ?? "");
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
            <section>
              <h2 className="text-sm font-semibold text-white">Issue description</h2>
              <RichText text={issue.body} className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-300" />
            </section>

            <section className="grid gap-4 border-t border-zinc-800 pt-5 sm:grid-cols-3">
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
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
