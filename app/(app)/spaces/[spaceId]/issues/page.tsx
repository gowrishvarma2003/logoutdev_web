"use client";

import { use, useState } from "react";
import { useIssues } from "@/lib/hooks/useSpaces";
import { useAuth } from "@/lib/hooks/useAuth";
import SpaceIssueCard from "@/components/spaces/SpaceIssueCard";
import { EmptyState, SectionHeader } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { PlusIcon, QuestionMarkCircleIcon } from "@/components/ui/Icons";
import * as api from "@/lib/services/spacesApi";
import type { SpaceIssuePriority, SpaceIssueStatus } from "@/lib/types";
import RichComposer from "@/components/ui/RichComposer";

const STATUS_OPTIONS: Array<{ value: "" | SpaceIssueStatus; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "triaged", label: "Triaged" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS: Array<{ value: "" | SpaceIssuePriority; label: string }> = [
  { value: "", label: "All priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export default function IssuesPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);
  const { user, isLoaded } = useAuth();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"" | SpaceIssueStatus>("");
  const [priority, setPriority] = useState<"" | SpaceIssuePriority>("");
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  const { issues, total, loading, error, refetch } = useIssues(spaceId, {
    status: status || undefined,
    priority: priority || undefined,
    assignee: assignedToMe && user ? "me" : undefined,
    page,
  });

  const canCreate = Boolean(user);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setPosting(true);
    setPostError("");
    try {
      await api.createIssue(spaceId, {
        title: title.trim(),
        body: body.trim(),
      });
      setTitle("");
      setBody("");
      setShowComposer(false);
      setPage(1);
      refetch();
    } catch (err: unknown) {
      setPostError(err instanceof Error ? err.message : "Failed to create issue");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      <SectionHeader
        title="Issues"
        count={total}
        action={
          canCreate ? (
            <button
              onClick={() => setShowComposer((current) => !current)}
              className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Raise issue
            </button>
          ) : undefined
        }
      />

      <div className="border-b border-zinc-800 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "" | SpaceIssueStatus);
              setPage(1);
            }}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value as "" | SpaceIssuePriority);
              setPage(1);
            }}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {user && (
            <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={assignedToMe}
                onChange={(e) => {
                  setAssignedToMe(e.target.checked);
                  setPage(1);
                }}
                className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-950 text-white"
              />
              Assigned to me
            </label>
          )}
        </div>
      </div>

      {showComposer && canCreate && (
        <form onSubmit={handlePost} className="space-y-3 border-b border-zinc-800 bg-zinc-900/30 px-4 py-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Issue title"
            maxLength={180}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
          <RichComposer
            value={body}
            onChange={(value) => setBody(value)}
            placeholder="Describe what needs to be fixed or resolved"
            rows={4}
            previewClassName="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm leading-relaxed text-white"
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm leading-relaxed text-transparent caret-white focus:border-zinc-600 focus:outline-none selection:bg-[#1d9bf0]/30"
          />
          <div className="flex items-center justify-end gap-2">
            {postError && <span className="mr-auto text-xs text-rose-400">{postError}</span>}
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={posting || !title.trim() || !body.trim()}
              className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-50"
            >
              {posting ? "Posting..." : "Submit issue"}
            </button>
          </div>
        </form>
      )}

      {!canCreate && isLoaded && (
        <div className="border-b border-zinc-800 px-4 py-3 text-xs text-zinc-500">
          Sign in to raise an issue for this space.
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {error && <p className="py-10 text-center text-sm text-rose-400">{error}</p>}

      {!loading && !error && issues.length === 0 && (
        <EmptyState
          icon={<QuestionMarkCircleIcon className="h-10 w-10" />}
          title="No issues found"
          description={
            status || priority || assignedToMe
              ? "No issues match the current filters."
              : canCreate
                ? "Raise the first issue for this project space."
                : "No one has raised an issue for this project space yet."
          }
        />
      )}

      {!loading && !error && issues.length > 0 && (
        <div>
          {issues.map((issue) => (
            <SpaceIssueCard key={issue.id} issue={issue} spaceId={spaceId} />
          ))}
        </div>
      )}

      {(page > 1 || issues.length >= 20) && (
        <div className="flex items-center justify-center gap-3 py-4">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-zinc-500">Page {page}</span>
          <button
            onClick={() => setPage((current) => current + 1)}
            disabled={issues.length < 20}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
