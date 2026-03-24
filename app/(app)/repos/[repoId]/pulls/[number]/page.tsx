"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRepoContext } from "../../layout";
import {
  usePullRequest,
  usePullRequestComments,
  usePullRequestReviews,
} from "@/lib/hooks/useRepos";
import {
  addPullRequestComment,
  closePullRequest,
  mergePullRequest,
  reopenPullRequest,
  submitPullRequestReview,
} from "@/lib/services/reposApi";
import type { PullRequestComment, PullRequestReview } from "@/lib/types";
import Spinner from "@/components/ui/Spinner";
import { formatRelativeTime } from "@/lib/utils";

type TimelineItem =
  | (PullRequestComment & { kind: "comment"; date: string })
  | (PullRequestReview & { kind: "review"; date: string });

export default function PRConversationPage({
  params,
}: {
  params: Promise<{ repoId: string; number: string }>;
}) {
  const { number } = use(params);
  const { repo } = useRepoContext();

  const { pullRequest, refetch: refetchPR } = usePullRequest(repo.id, number);
  const { comments, loading: commentsLoading, refetch: refetchComments } = usePullRequestComments(repo.id, number);
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = usePullRequestReviews(repo.id, number);

  const [commentBody, setCommentBody] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inlineComments = useMemo(
    () => (comments || []).filter((comment) => comment.path),
    [comments]
  );
  const generalComments = useMemo(
    () => (comments || []).filter((comment) => !comment.path),
    [comments]
  );
  const inlineSummary = useMemo(() => {
    const unresolved = inlineComments.filter((comment) => !comment.is_resolved);
    const uniqueFiles = Array.from(new Set(inlineComments.map((comment) => comment.path).filter(Boolean)));
    return {
      total_threads: inlineComments.length,
      unresolved_threads: unresolved.length,
      files: uniqueFiles.slice(0, 5),
    };
  }, [inlineComments]);

  if (!pullRequest || commentsLoading || reviewsLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const timelineItems: TimelineItem[] = [
    ...generalComments.map((comment) => ({ ...comment, kind: "comment" as const, date: comment.created_at })),
    ...reviews.map((review) => ({ ...review, kind: "review" as const, date: review.submitted_at || review.created_at })),
  ].sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());

  async function handleComment() {
    if (!commentBody.trim()) return;
    setIsSubmittingComment(true);
    setError(null);
    try {
      await addPullRequestComment(repo.id, number, { body: commentBody.trim() });
      setCommentBody("");
      refetchComments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleReview(status: "approved" | "changes_requested" | "commented") {
    setIsSubmittingReview(true);
    setError(null);
    try {
      await submitPullRequestReview(repo.id, number, {
        status,
        body: reviewBody.trim() || undefined,
      });
      setReviewBody("");
      refetchReviews();
      refetchPR();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function handleMerge() {
    setIsMerging(true);
    setError(null);
    try {
      await mergePullRequest(repo.id, number);
      refetchPR();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to merge pull request");
    } finally {
      setIsMerging(false);
    }
  }

  async function handleCloseReopen(action: "close" | "reopen") {
    setIsClosing(true);
    setError(null);
    try {
      if (action === "close") {
        await closePullRequest(repo.id, number);
      } else {
        await reopenPullRequest(repo.id, number);
      }
      refetchPR();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${action} pull request`);
    } finally {
      setIsClosing(false);
    }
  }

  const isOpen = pullRequest.status === "open";
  const blockingReasons = pullRequest.rule_evaluation?.blocking_reasons || [];

  return (
    <div className="mx-auto max-w-5xl pt-4">
      {error ? (
        <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      ) : null}

      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
            pullRequest.mergeable_state === "clean"
              ? "bg-emerald-500/10 text-emerald-300"
              : pullRequest.mergeable_state === "draft"
                ? "bg-amber-500/10 text-amber-300"
                : pullRequest.mergeable_state === "dirty" || pullRequest.mergeable_state === "head_missing"
                  ? "bg-rose-500/10 text-rose-300"
                  : "bg-zinc-800 text-zinc-300"
          }`}>
            {pullRequest.mergeable_state || "unknown"}
          </span>
          <span className="text-zinc-400">
            {pullRequest.review_summary?.approvals_count || 0} approvals / {pullRequest.review_summary?.changes_requested_count || 0} change requests
          </span>
          {pullRequest.rule_evaluation?.status_checks ? (
            <span className="text-zinc-400">
              Checks: {pullRequest.rule_evaluation.status_checks.passed.length}/{pullRequest.rule_evaluation.status_checks.required.length || pullRequest.rule_evaluation.status_checks.passed.length}
            </span>
          ) : null}
        </div>
        {blockingReasons.length > 0 ? (
          <div className="mt-3 space-y-1 text-sm text-rose-300">
            {blockingReasons.map((reason) => (
              <p key={reason}>{reason}</p>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-emerald-300">This pull request is currently mergeable.</p>
        )}
      </div>

      {inlineSummary.total_threads > 0 ? (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Inline review threads</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {inlineSummary.unresolved_threads} unresolved of {inlineSummary.total_threads} total thread(s)
              </p>
            </div>
            <Link
              href={`/repos/${repo.id}/pulls/${pullRequest.number}/files`}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
            >
              Open files changed
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {inlineSummary.files.map((file) => (
              <span key={file} className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                {file}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mb-6 flex gap-4">
        <div className="hidden sm:block">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
            <span className="text-zinc-500 text-sm">{pullRequest.author?.username?.[0]?.toUpperCase()}</span>
          </div>
        </div>
        <div className="flex-1 rounded-md border border-zinc-700 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-800/80 px-4 py-3">
            <div className="text-sm">
              <span className="font-semibold text-zinc-200">{pullRequest.author?.username}</span>{" "}
              <span className="text-zinc-400">opened this pull request {formatRelativeTime(pullRequest.created_at)}</span>
            </div>
          </div>
          <div className="p-4 text-sm text-zinc-300 whitespace-pre-wrap">
            {pullRequest.body || <span className="italic text-zinc-500">No description provided.</span>}
          </div>
        </div>
      </div>

      <div className="relative mb-6 pl-6 sm:pl-16">
        <div className="absolute left-10 top-0 bottom-0 hidden w-px bg-zinc-800 sm:block sm:left-20" />

        {timelineItems.map((item) => (
          <div key={`${item.kind}-${item.id}`} className="mb-6 flex gap-4">
            <div className="absolute left-5 mt-3 hidden h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-zinc-950 ring-1 ring-zinc-800 sm:flex sm:left-[3.25rem]">
              {item.kind === "review" ? (
                <span className="text-[10px] font-semibold text-zinc-400">RV</span>
              ) : (
                <span className="text-[10px] font-semibold text-zinc-400">CM</span>
              )}
            </div>

            <div className="ml-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 shadow-sm sm:ml-4">
              <div className="border-b border-zinc-800 bg-zinc-800/80 px-4 py-3 text-sm">
                <span className="font-semibold text-zinc-200">
                  {item.kind === "comment" ? item.author?.username : item.reviewer?.username}
                </span>{" "}
                <span className="text-zinc-400">
                  {item.kind === "comment" ? "commented" : `reviewed (${item.status})`}{" "}
                  {formatRelativeTime(item.date)}
                </span>
              </div>
              <div className="p-4 text-sm whitespace-pre-wrap text-zinc-300">
                {item.body || <span className="italic text-zinc-500">No additional details.</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {pullRequest.reviewer_eligibility?.can_review ? (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-semibold text-white">Review this pull request</h2>
          <textarea
            rows={4}
            value={reviewBody}
            onChange={(event) => setReviewBody(event.target.value)}
            placeholder="Add context for your review"
            className="mt-4 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => handleReview("commented")}
              disabled={isSubmittingReview || !isOpen}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {isSubmittingReview ? <Spinner size="sm" className="mr-2 inline" /> : null}
              Comment review
            </button>
            <button
              onClick={() => handleReview("approved")}
              disabled={isSubmittingReview || !pullRequest.reviewer_eligibility?.can_approve}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => handleReview("changes_requested")}
              disabled={isSubmittingReview || !pullRequest.reviewer_eligibility?.can_request_changes}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              Request changes
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex gap-4 border-t border-zinc-800 pt-8 pb-12">
        <div className="hidden sm:block">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
            <span className="text-zinc-500 text-sm">Me</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="mb-3 rounded-md border border-zinc-700 bg-zinc-900 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <div className="border-b border-zinc-800 bg-zinc-800/80 px-4 py-2">
              <span className="text-sm font-medium text-zinc-300">Write a comment</span>
            </div>
            <textarea
              rows={4}
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder="Leave a comment"
              className="w-full resize-y bg-transparent px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {isOpen ? (
              <button
                onClick={() => handleCloseReopen("close")}
                disabled={isClosing}
                className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-red-400 hover:bg-zinc-700 disabled:opacity-50"
              >
                {isClosing ? <Spinner size="sm" className="mr-2 inline" /> : null}
                Close pull request
              </button>
            ) : pullRequest.status === "closed" ? (
              <button
                onClick={() => handleCloseReopen("reopen")}
                disabled={isClosing}
                className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                {isClosing ? <Spinner size="sm" className="mr-2 inline" /> : null}
                Reopen pull request
              </button>
            ) : null}

            <button
              onClick={handleComment}
              disabled={isSubmittingComment || !commentBody.trim()}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
            >
              {isSubmittingComment ? <Spinner size="sm" className="mr-2 inline" /> : null}
              Comment
            </button>

            {isOpen ? (
              <button
                onClick={handleMerge}
                disabled={isMerging || pullRequest.mergeable_state !== "clean" || !repo.can_merge}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
              >
                {isMerging ? <Spinner size="sm" className="mr-2 inline" /> : null}
                Merge pull request
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
