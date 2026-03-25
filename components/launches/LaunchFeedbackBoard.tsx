"use client";

import { useState } from "react";
import type { Launch, LaunchFeedbackItem, User } from "@/lib/types";
import RichComposer from "@/components/ui/RichComposer";
import RichText from "@/components/ui/RichText";

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
  open: "bg-sky-500/10 text-sky-300",
  acknowledged: "bg-amber-500/10 text-amber-300",
  planned: "bg-purple-500/10 text-purple-300",
  resolved: "bg-emerald-500/10 text-emerald-300",
  closed: "bg-zinc-800 text-zinc-400",
};

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-1">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onActiveTypeChange(value)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                activeType === value ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-sm leading-6 text-zinc-500">
          Track what the community wants next and keep each thread easy to scan.
        </p>
      </div>

      {currentUser && !launch.viewer_state?.is_owner && canPostFeedback && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onCreateFeedback({ type: activeType, title: title.trim(), body: body.trim() });
            setTitle("");
            setBody("");
          }}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-white">Post a {activeType}</p>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Give enough detail for the builder to understand the outcome you want.
              </p>
            </div>

            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Title your ${activeType}`}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
              />

              <RichComposer
                value={body}
                onChange={(value) => setBody(value)}
                rows={3}
                placeholder="Give enough detail for the builder to act on this"
                previewClassName="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-7 text-white"
                className="w-full resize-y rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-7 text-transparent caret-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none selection:bg-[#1d9bf0]/30"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {error ? <p className="text-xs text-rose-400">{error}</p> : <div />}

              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-60 sm:ml-auto"
              >
                {loading ? "Posting…" : `Post ${activeType}`}
              </button>
            </div>
          </div>
        </form>
      )}

      {currentUser && !launch.viewer_state?.is_owner && !canPostFeedback ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-500">
          {disabledMessage || "Feedback is not available right now."}
        </p>
      ) : null}

      {feedback.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-6 text-center text-sm text-zinc-500">
          No {activeType} items yet.
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.map((item) => {
            const accentClass = STATUS_ACCENT[item.status] ?? "border-l-zinc-600";
            const badgeClass = STATUS_BADGE[item.status] ?? "bg-zinc-800 text-zinc-400";

            return (
              <article
                key={item.id}
                className={`rounded-2xl border border-zinc-800 border-l-4 bg-zinc-950/55 p-4 sm:p-5 ${accentClass}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${badgeClass}`}>
                        {item.status.replace(/_/g, " ")}
                      </span>
                      <p className="text-xs text-zinc-500 [overflow-wrap:anywhere]">
                        {item.author?.name ?? "Community member"}
                      </p>
                    </div>

                    <h4 className="mt-3 text-base font-semibold text-white [overflow-wrap:anywhere]">{item.title}</h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {launch.viewer_state?.is_owner && (
                      <select
                        value={item.status}
                        onChange={(e) => onUpdateFeedbackStatus(item.id, e.target.value)}
                        className="min-w-[148px] rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-600 focus:outline-none"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    )}

                    {currentUser?.id === item.author_id && (
                      <button
                        type="button"
                        onClick={() => onDeleteFeedback(item.id)}
                        className="rounded-2xl border border-rose-500/20 px-3 py-2 text-[11px] font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <RichText text={item.body} className="mt-4 text-sm leading-7 text-zinc-300 [overflow-wrap:anywhere]" />

                {(item.comments ?? []).length > 0 && (
                  <div className="mt-4 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                    {item.comments?.map((comment) => (
                      <div key={comment.id} className="text-sm leading-6 text-zinc-300 [overflow-wrap:anywhere]">
                        <span className="font-medium text-white">{comment.author?.name ?? "Member"}: </span>
                        <RichText text={comment.body} as="span" className="inline" />
                      </div>
                    ))}
                  </div>
                )}

                {currentUser && (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={commentDrafts[item.id] ?? ""}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Reply…"
                      className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={async () => {
                        const val = commentDrafts[item.id] ?? "";
                        if (!val.trim()) return;
                        await onAddComment(item.id, val);
                        setCommentDrafts((prev) => ({ ...prev, [item.id]: "" }));
                      }}
                      className="rounded-2xl border border-zinc-700 px-4 py-3 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
