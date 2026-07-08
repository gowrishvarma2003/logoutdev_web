"use client";

import { useState } from "react";
import type { Launch, LaunchFeedbackItem, User } from "@/lib/types";
import RichComposer from "@/components/ui/RichComposer";
import RichText from "@/components/ui/RichText";
import Avatar from "@/components/ui/Avatar";
import { ChatBubbleIcon, TrashIcon, SparklesIcon, CheckIcon } from "@/components/ui/Icons";

interface LaunchFeedbackBoardProps {
  launch: Launch;
  currentUser?: User | null;
  feedback: LaunchFeedbackItem[];
  activeType: string;
  onActiveTypeChange: (value: string) => void;
  canPostFeedback?: boolean;
  disabledMessage?: string | null;
  loading?: boolean;
  error?: string | null;
  onCreateFeedback: (payload: { type: string; title: string; body: string }) => Promise<void> | void;
  onUpdateFeedbackStatus: (feedbackId: string, status: string) => Promise<void> | void;
  onDeleteFeedback: (feedbackId: string) => Promise<void> | void;
  onAddComment: (feedbackId: string, body: string) => Promise<void> | void;
}

const TABS = [
  { value: "suggestion", label: "Suggestions" },
  { value: "bug", label: "Bugs" },
  { value: "idea", label: "Ideas" },
];

const STATUSES = ["open", "acknowledged", "planned", "resolved", "closed"];

const STATUS_ACCENT: Record<string, string> = {
  open: "border-l-sky-500",
  acknowledged: "border-l-amber-500",
  planned: "border-l-purple-500",
  resolved: "border-l-emerald-500",
  closed: "border-l-zinc-600",
};

const STATUS_BADGE: Record<string, string> = {
  open: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  acknowledged: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  planned: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-surface-hover text-text-muted border-border-strong",
};

const COMPOSER_DETAILS: Record<string, { title: string; desc: string; titlePlaceholder: string; bodyPlaceholder: string }> = {
  bug: {
    title: "Report a Bug",
    desc: "Help us make LogoutDev stable by reporting issues with steps to reproduce.",
    titlePlaceholder: "Brief summary of the issue (e.g. Cannot upload screenshot on profile edit)",
    bodyPlaceholder: `### What happened?
[Describe the bug here]

### Steps to reproduce
1. Go to...
2. Click on...
3. See error...

### Expected behavior
[What should have happened]`,
  },
  idea: {
    title: "Suggest an Idea",
    desc: "Share your vision for new features and capability additions.",
    titlePlaceholder: "What is your idea? (e.g. Add dark mode toggle in navbar)",
    bodyPlaceholder: `### Desired outcome
[What feature would you like to see?]

### Why it matters
[How will this help developer workflows?]`,
  },
  suggestion: {
    title: "Share a Suggestion",
    desc: "Recommend improvements to existing features, styling, or documentation.",
    titlePlaceholder: "What can we improve? (e.g. Make sidebar scroll behavior smoother)",
    bodyPlaceholder: `### Desired improvement
[Describe the suggestion here]

### Additional context
[Any references or reasoning]`,
  },
};

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

export default function LaunchFeedbackBoard({
  launch,
  currentUser,
  feedback,
  activeType,
  onActiveTypeChange,
  canPostFeedback = true,
  disabledMessage = null,
  loading = false,
  error = null,
  onCreateFeedback,
  onUpdateFeedbackStatus,
  onDeleteFeedback,
  onAddComment,
}: LaunchFeedbackBoardProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const details = COMPOSER_DETAILS[activeType] || COMPOSER_DETAILS.suggestion;

  return (
    <div className="space-y-6">
      {/* Header and navigation tabs */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border-default/80 pb-4">
        <div className="flex gap-1.5 rounded-xl border border-border-default bg-app/60 p-1">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                onActiveTypeChange(value);
                // Reset form with type-specific defaults when switching tabs
                setTitle("");
                setBody("");
              }}
              className={`rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
                activeType === value
                  ? "bg-surface-hover text-text-primary shadow-sm ring-1 ring-border-strong"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs text-text-disabled font-light max-w-xs md:text-right">
          Track what the community wants next and keep each thread easy to scan.
        </p>
      </div>

      {/* Composer form */}
      {currentUser && !launch.viewer_state?.is_owner && canPostFeedback && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!title.trim() || !body.trim()) return;
            await onCreateFeedback({ type: activeType, title: title.trim(), body: body.trim() });
            setTitle("");
            setBody("");
          }}
          className="rounded-2xl border border-border-default/80 bg-app/40 p-5 space-y-4"
        >
          <div>
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <SparklesIcon className="h-4 w-4 text-sky-400" />
              {details.title}
            </h3>
            <p className="mt-1 text-xs text-text-disabled leading-relaxed font-light">
              {details.desc}
            </p>
          </div>

          <div className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={details.titlePlaceholder}
              className="w-full rounded-xl border border-border-default bg-app px-4 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-default transition-all"
            />

            <RichComposer
              value={body}
              onChange={(value) => setBody(value)}
              rows={4}
              placeholder={details.bodyPlaceholder}
              previewClassName="w-full rounded-xl border border-border-default bg-app px-4 py-3 text-sm leading-relaxed text-text-primary prose prose-invert max-w-none"
               className="w-full resize-y px-4 py-3 text-sm leading-relaxed text-transparent caret-white placeholder:text-text-disabled focus:outline-none selection:bg-[#1d9bf0]/30"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border-subtle pt-3">
            {error ? <p className="text-xs text-rose-400">{error}</p> : <div />}

            <button
              type="submit"
              disabled={loading || !title.trim() || !body.trim()}
              className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary-hover disabled:opacity-50 sm:ml-auto cursor-pointer"
            >
              {loading ? "Posting…" : `Post ${activeType}`}
            </button>
          </div>
        </form>
      )}

      {currentUser && !launch.viewer_state?.is_owner && !canPostFeedback ? (
        <div className="rounded-2xl border border-border-default/80 bg-app/20 px-5 py-4 text-sm text-text-disabled font-light leading-relaxed">
          {disabledMessage || "Feedback submission is not open right now."}
        </div>
      ) : null}

      {/* Feedback list */}
      {feedback.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-default bg-app/20 px-4 py-12 text-center">
          <p className="text-sm text-text-muted font-medium mb-1">
            No {activeType} items yet.
          </p>
          <p className="text-xs text-text-disabled font-light">
            Be the first to suggest what LogoutDev should build or fix next.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => {
            const accentClass = STATUS_ACCENT[item.status] ?? "border-l-zinc-600";
            const badgeClass = STATUS_BADGE[item.status] ?? "bg-surface-hover text-text-muted border-border-strong";
            const builderReplied = item.comments?.some((c) => c.author_id === launch.builder_id);

            return (
              <article
                key={item.id}
                className={`rounded-2xl border border-border-default border-l-4 bg-surface/10 p-5 shadow-sm space-y-4 transition-all hover:bg-surface/20 ${accentClass}`}
              >
                {/* User details and status row */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar user={item.author} size="sm" />
                    <div>
                      <p className="text-xs font-semibold text-text-secondary">
                        {item.author?.name ?? "Community member"}
                      </p>
                      <p className="text-[10px] text-text-disabled font-light mt-0.5">
                        Posted on {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider capitalize ${badgeClass}`}>
                      {item.status.replace(/_/g, " ")}
                    </span>
                    {builderReplied && (
                      <span className="rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-medium tracking-wide">
                        Builder Replied
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-text-primary tracking-tight">
                    {item.title}
                  </h4>
                  <div className="pl-0.5">
                    <RichText text={item.body} className="text-sm leading-relaxed text-text-secondary prose prose-invert prose-sm max-w-none font-light" />
                  </div>
                </div>

                {/* Comments / Nested threads list */}
                {(item.comments ?? []).length > 0 && (
                  <div className="mt-4 space-y-3 rounded-xl border border-border-default/80 bg-app/40 p-4">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-text-disabled border-b border-border-subtle pb-2 mb-2">Replies</p>
                    {item.comments?.map((comment) => {
                      const isBuilderComment = comment.author_id === launch.builder_id;
                      return (
                        <div key={comment.id} className="flex gap-3 text-sm leading-relaxed items-start">
                          <Avatar user={comment.author} size="xs" className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-text-secondary text-xs">{comment.author?.name ?? "Member"}</span>
                              {isBuilderComment && (
                                <span className="rounded bg-sky-500/10 text-sky-400 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider border border-sky-500/20">
                                  Builder
                                </span>
                              )}
                              <span className="text-[9px] text-text-disabled font-light">{formatDate(comment.created_at)}</span>
                            </div>
                            <div className="mt-1 text-xs text-text-muted font-light pl-0.5">
                              <RichText text={comment.body} as="span" className="inline" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Actions row: admin controls and reply form */}
                <div className="flex flex-col gap-3 pt-3 border-t border-border-subtle/60 sm:flex-row sm:items-center sm:justify-between">
                  {currentUser && (
                    <div className="flex-1 flex gap-2">
                      <input
                        value={commentDrafts[item.id] ?? ""}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        placeholder={launch.viewer_state?.is_owner ? "Reply as builder…" : "Reply to thread…"}
                        className="flex-1 rounded-xl border border-border-default bg-app/80 px-4 py-2.5 text-xs text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={async () => {
                          const val = commentDrafts[item.id] ?? "";
                          if (!val.trim()) return;
                          await onAddComment(item.id, val);
                          setCommentDrafts((prev) => ({ ...prev, [item.id]: "" }));
                        }}
                        className="rounded-xl bg-surface-hover hover:bg-surface-hover px-4 py-2 text-xs font-semibold text-text-secondary border border-border-default/80 transition-all cursor-pointer"
                      >
                        Reply
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 sm:ml-auto">
                    {launch.viewer_state?.is_owner && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-text-disabled">Status:</span>
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateFeedbackStatus(item.id, e.target.value)}
                          className="rounded-xl border border-border-default bg-app px-2.5 py-1.5 text-xs text-text-primary focus:border-border-strong focus:outline-none"
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {currentUser?.id === item.author_id && (
                      <button
                        type="button"
                        onClick={() => onDeleteFeedback(item.id)}
                        className="rounded-xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10 px-3 py-1.5 text-[10px] font-semibold text-rose-400 transition-all flex items-center gap-1 cursor-pointer"
                        title="Delete feedback"
                      >
                        <TrashIcon className="h-3 w-3" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
