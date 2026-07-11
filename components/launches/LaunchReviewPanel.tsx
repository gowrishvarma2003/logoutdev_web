"use client";

import { useMemo, useState } from "react";
import type {
  Launch,
  LaunchReview,
  LaunchReviewCategory,
  LaunchReviewRecommendation,
  User,
} from "@/lib/types";
import RichComposer from "@/components/ui/RichComposer";
import RichText from "@/components/ui/RichText";
import Avatar from "@/components/ui/Avatar";
import { PinIcon, SparklesIcon, TrashIcon } from "@/components/ui/Icons";

interface LaunchReviewPanelProps {
  launch: Launch;
  reviews: LaunchReview[];
  currentUser?: User | null;
  canReview?: boolean;
  disabledMessage?: string | null;
  loading?: boolean;
  error?: string | null;
  activeCategory: string;
  onActiveCategoryChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  scopeFilter: "all" | "mine" | "bookmarked";
  onScopeFilterChange: (value: "all" | "mine" | "bookmarked") => void;
  sort: string;
  onSortChange: (value: string) => void;
  onCreateReview: (payload: {
    headline: string;
    body: string;
    recommendation: string;
    category: string;
  }) => Promise<void> | void;
  onUpdateReview: (
    reviewId: string,
    payload: Partial<{
      headline: string;
      body: string;
      recommendation: string;
      category: string;
      status: string;
    }>
  ) => Promise<void> | void;
  onDeleteReview: (reviewId: string) => Promise<void> | void;
  onAddComment: (reviewId: string, body: string) => Promise<void> | void;
  onToggleBookmark: (reviewId: string, bookmarked: boolean) => Promise<void> | void;
}

const CATEGORIES: Array<{ value: LaunchReviewCategory; label: string }> = [
  { value: "experience", label: "Experience" },
  { value: "issue", label: "Issues" },
  { value: "praise", label: "Praise" },
  { value: "suggestion", label: "Suggestions" },
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

const REC_CONFIG: Record<
  LaunchReviewRecommendation,
  { label: string; short: string; color: string }
> = {
  recommend: { label: "Recommend", short: "Recommends", color: "emerald" },
  mixed: { label: "Mixed", short: "Mixed", color: "amber" },
  not_recommend: { label: "Not recommend", short: "Not recommended", color: "rose" },
};

const COMPOSER_DETAILS: Record<
  string,
  { title: string; desc: string; headlinePlaceholder: string; bodyPlaceholder: string }
> = {
  experience: {
    title: "Share your experience",
    desc: "Post an overall take — you can leave another anytime you try something new.",
    headlinePlaceholder: "One-line summary of your experience",
    bodyPlaceholder: "What worked? What felt rough? Who is this for?",
  },
  issue: {
    title: "Report an issue",
    desc: "Found a bug or friction? Capture it as its own feedback entry so the builder can track it.",
    headlinePlaceholder: "What broke or felt wrong?",
    bodyPlaceholder: "Steps to reproduce, expected vs actual, and any workaround you found.",
  },
  praise: {
    title: "Call out something great",
    desc: "Highlight a feature or flow that felt polished — builders love specific wins.",
    headlinePlaceholder: "What stood out?",
    bodyPlaceholder: "Describe the moment and why it mattered for your workflow.",
  },
  suggestion: {
    title: "Suggest an improvement",
    desc: "Ship product ideas as separate entries so they can be triaged independently.",
    headlinePlaceholder: "What should improve?",
    bodyPlaceholder: "Desired outcome, why it matters, and any reference products.",
  },
};

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

export default function LaunchReviewPanel({
  launch,
  reviews,
  currentUser,
  canReview = true,
  disabledMessage = null,
  loading = false,
  error = null,
  activeCategory,
  onActiveCategoryChange,
  statusFilter,
  onStatusFilterChange,
  scopeFilter,
  onScopeFilterChange,
  sort,
  onSortChange,
  onCreateReview,
  onUpdateReview,
  onDeleteReview,
  onAddComment,
  onToggleBookmark,
}: LaunchReviewPanelProps) {
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [recommendation, setRecommendation] =
    useState<LaunchReviewRecommendation>("recommend");
  const [isComposing, setIsComposing] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHeadline, setEditHeadline] = useState("");
  const [editBody, setEditBody] = useState("");

  const details = COMPOSER_DETAILS[activeCategory] || COMPOSER_DETAILS.experience;
  const isOwner = Boolean(launch.viewer_state?.is_owner);

  const openCount = useMemo(
    () => reviews.filter((review) => review.status === "open").length,
    [reviews]
  );

  const startEdit = (review: LaunchReview) => {
    setEditingId(review.id);
    setEditHeadline(review.headline);
    setEditBody(review.body);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border-default/80 pb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-border-default bg-app/60 p-1">
            {CATEGORIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  onActiveCategoryChange(value);
                  setHeadline("");
                  setBody("");
                }}
                className={`rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition-all ${
                  activeCategory === value
                    ? "bg-surface-hover text-text-primary shadow-sm ring-1 ring-border-strong"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { value: "all", label: "All" },
                { value: "mine", label: "Mine" },
                { value: "bookmarked", label: "Bookmarked" },
              ] as const
            ).map((scope) => (
              <button
                key={scope.value}
                type="button"
                onClick={() => onScopeFilterChange(scope.value)}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                  scopeFilter === scope.value
                    ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                    : "border-border-default text-text-muted hover:text-text-secondary"
                }`}
              >
                {scope.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="rounded-lg border border-border-default bg-app px-2.5 py-1.5 text-xs text-text-primary focus:border-border-strong focus:outline-none"
            >
              <option value="">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="rounded-lg border border-border-default bg-app px-2.5 py-1.5 text-xs text-text-primary focus:border-border-strong focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="open_first">Open first</option>
            </select>
          </div>
          <p className="text-xs text-text-disabled font-light">
            Multiple feedback entries per person · {openCount} open in this view
          </p>
        </div>
      </div>

      {currentUser && !isOwner && canReview ? (
        isComposing ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!headline.trim() || !body.trim()) return;
              await onCreateReview({
                headline: headline.trim(),
                body: body.trim(),
                recommendation,
                category: activeCategory,
              });
              setHeadline("");
              setBody("");
              setIsComposing(false);
            }}
            className="rounded-2xl border border-border-default/80 bg-app/40 p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                  <SparklesIcon className="h-4 w-4 text-sky-400" />
                  {details.title}
                </h3>
                <p className="mt-1 text-xs text-text-disabled leading-relaxed font-light">
                  {details.desc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="text-xs text-text-disabled hover:text-text-secondary"
              >
                Cancel
              </button>
            </div>

            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={details.headlinePlaceholder}
              className="w-full rounded-xl border border-border-default bg-app px-4 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none"
            />

            <RichComposer
              value={body}
              onChange={setBody}
              rows={4}
              placeholder={details.bodyPlaceholder}
              previewClassName="w-full rounded-xl border border-border-default bg-app px-4 py-3 text-sm leading-relaxed text-text-primary prose prose-invert max-w-none"
              className="w-full resize-y px-4 py-3 text-sm leading-relaxed text-transparent caret-white placeholder:text-text-disabled focus:outline-none selection:bg-[#1d9bf0]/30"
            />

            {activeCategory === "experience" && (
              <div className="flex flex-wrap gap-2">
                {(Object.entries(REC_CONFIG) as [LaunchReviewRecommendation, (typeof REC_CONFIG)[LaunchReviewRecommendation]][]).map(
                  ([val, config]) => {
                    const isActive = recommendation === val;
                    const colorClasses = {
                      emerald: isActive
                        ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                        : "border-border-strong text-text-muted hover:text-text-secondary",
                      amber: isActive
                        ? "border-amber-500/30 bg-amber-500/15 text-amber-400"
                        : "border-border-strong text-text-muted hover:text-text-secondary",
                      rose: isActive
                        ? "border-rose-500/30 bg-rose-500/15 text-rose-400"
                        : "border-border-strong text-text-muted hover:text-text-secondary",
                    };
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setRecommendation(val)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                          colorClasses[config.color as keyof typeof colorClasses]
                        }`}
                      >
                        {config.label}
                      </button>
                    );
                  }
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
              {error ? <p className="text-xs text-rose-400">{error}</p> : <div />}
              <button
                type="submit"
                disabled={loading || !headline.trim() || !body.trim()}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? "Posting…" : "Post feedback"}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsComposing(true)}
            className="w-full rounded-2xl border border-dashed border-border-strong/60 bg-surface/30 py-4 text-sm text-text-muted transition-colors hover:border-border-strong hover:bg-surface/50 hover:text-text-secondary"
          >
            Add feedback…
          </button>
        )
      ) : currentUser && !isOwner && !canReview ? (
        <div className="rounded-2xl border border-border-default/80 bg-app/20 px-5 py-4 text-sm text-text-disabled font-light">
          {disabledMessage || "Feedback is not available right now."}
        </div>
      ) : !currentUser ? (
        <p className="rounded-2xl border border-border-default/60 bg-surface/30 px-4 py-3 text-sm text-text-disabled">
          Sign in to leave product feedback.
        </p>
      ) : null}

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-default bg-app/20 px-4 py-12 text-center">
          <p className="text-sm text-text-muted font-medium mb-1">No feedback in this view yet.</p>
          <p className="text-xs text-text-disabled font-light">
            Issues, praise, and suggestions can all live as separate entries.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const accentClass = STATUS_ACCENT[review.status] ?? "border-l-zinc-600";
            const badgeClass =
              STATUS_BADGE[review.status] ?? "bg-surface-hover text-text-muted border-border-strong";
            const rec = REC_CONFIG[review.recommendation] ?? REC_CONFIG.mixed;
            const builderReplied = review.comments?.some((c) => c.author_id === launch.builder_id);
            const isAuthor = currentUser?.id === review.author_id;
            const isEditing = editingId === review.id;

            return (
              <article
                key={review.id}
                className={`rounded-2xl border border-border-default border-l-4 bg-surface/10 p-5 shadow-sm space-y-4 transition-all hover:bg-surface/20 ${accentClass}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar user={review.author} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-secondary truncate">
                        {review.author?.name ?? "Community member"}
                      </p>
                      <p className="text-[10px] text-text-disabled font-light mt-0.5">
                        {formatDate(review.created_at)} · {review.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider capitalize ${badgeClass}`}
                    >
                      {review.status.replace(/_/g, " ")}
                    </span>
                    {review.category === "experience" && (
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                          rec.color === "emerald"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : rec.color === "rose"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {rec.short}
                      </span>
                    )}
                    {builderReplied && (
                      <span className="rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-medium tracking-wide">
                        Builder replied
                      </span>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      value={editHeadline}
                      onChange={(e) => setEditHeadline(e.target.value)}
                      className="w-full rounded-xl border border-border-default bg-app px-4 py-2.5 text-sm text-text-primary focus:border-border-strong focus:outline-none"
                    />
                    <RichComposer
                      value={editBody}
                      onChange={setEditBody}
                      rows={3}
                      previewClassName="w-full rounded-xl border border-border-default bg-app px-4 py-3 text-sm leading-relaxed text-text-primary"
                      className="w-full resize-y px-4 py-3 text-sm leading-relaxed text-transparent caret-white focus:outline-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-border-default px-3 py-1.5 text-xs text-text-muted"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await onUpdateReview(review.id, {
                            headline: editHeadline.trim(),
                            body: editBody.trim(),
                          });
                          setEditingId(null);
                        }}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="text-base font-bold text-text-primary tracking-tight">
                      {review.headline}
                    </h4>
                    <RichText
                      text={review.body}
                      className="text-sm leading-relaxed text-text-secondary prose prose-invert prose-sm max-w-none font-light"
                    />
                  </div>
                )}

                {(review.comments ?? []).length > 0 && (
                  <div className="space-y-3 rounded-xl border border-border-default/80 bg-app/40 p-4">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-text-disabled border-b border-border-subtle pb-2">
                      Replies ({review.comments?.length ?? 0})
                    </p>
                    {review.comments?.map((comment) => {
                      const isBuilderComment = comment.author_id === launch.builder_id;
                      return (
                        <div key={comment.id} className="flex gap-3 text-sm items-start">
                          <Avatar user={comment.author} size="xs" className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-text-secondary text-xs">
                                {comment.author?.name ?? "Member"}
                              </span>
                              {isBuilderComment && (
                                <span className="rounded bg-sky-500/10 text-sky-400 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider border border-sky-500/20">
                                  Builder
                                </span>
                              )}
                              <span className="text-[9px] text-text-disabled font-light">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-text-muted font-light">
                              <RichText text={comment.body} as="span" className="inline" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-3 border-t border-border-subtle/60 sm:flex-row sm:items-center sm:justify-between">
                  {currentUser && (
                    <div className="flex-1 flex gap-2">
                      <input
                        value={commentDrafts[review.id] ?? ""}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))
                        }
                        placeholder={isOwner ? "Reply as builder…" : "Reply to thread…"}
                        className="flex-1 rounded-xl border border-border-default bg-app/80 px-4 py-2.5 text-xs text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const val = commentDrafts[review.id] ?? "";
                          if (!val.trim()) return;
                          await onAddComment(review.id, val.trim());
                          setCommentDrafts((prev) => ({ ...prev, [review.id]: "" }));
                        }}
                        className="rounded-xl bg-surface-hover px-4 py-2 text-xs font-semibold text-text-secondary border border-border-default/80 transition-all cursor-pointer"
                      >
                        Reply
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                    {currentUser && (
                      <button
                        type="button"
                        onClick={() =>
                          onToggleBookmark(review.id, Boolean(review.is_bookmarked_by_me))
                        }
                        className={`rounded-xl border px-3 py-1.5 text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                          review.is_bookmarked_by_me
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : "border-border-default text-text-muted hover:text-text-secondary"
                        }`}
                        title={review.is_bookmarked_by_me ? "Remove bookmark" : "Bookmark"}
                      >
                        <PinIcon className="h-3 w-3" />
                        {review.is_bookmarked_by_me ? "Saved" : "Save"}
                      </button>
                    )}

                    {isOwner && (
                      <select
                        value={review.status}
                        onChange={(e) => onUpdateReview(review.id, { status: e.target.value })}
                        className="rounded-xl border border-border-default bg-app px-2.5 py-1.5 text-xs text-text-primary focus:border-border-strong focus:outline-none"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    )}

                    {isAuthor && !isEditing && (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(review)}
                          className="rounded-xl border border-border-default px-3 py-1.5 text-[10px] font-semibold text-text-muted hover:text-text-secondary"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteReview(review.id)}
                          className="rounded-xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10 px-3 py-1.5 text-[10px] font-semibold text-rose-400 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <TrashIcon className="h-3 w-3" />
                          Delete
                        </button>
                      </>
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
