"use client";

import { use, useState } from "react";
import { useRepoContext } from "../../layout";
import {
  usePullRequest,
  usePullRequestComments,
  usePullRequestReviews,
} from "@/lib/hooks/useRepos";
import {
  addPullRequestComment,
  mergePullRequest,
  closePullRequest,
  reopenPullRequest,
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
  const { reviews, loading: reviewsLoading } = usePullRequestReviews(repo.id, number);

  const [commentBody, setCommentBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!pullRequest || commentsLoading || reviewsLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Combine reviews and general comments into a single timeline sorted by date
  // For MVP, we'll just sort by created_at / submitted_at
  const timelineItems: TimelineItem[] = [
    ...(comments || []).filter(c => !c.path).map((c) => ({ ...c, kind: "comment" as const, date: c.created_at })),
    ...(reviews || []).map((r) => ({ ...r, kind: "review" as const, date: r.submitted_at || r.created_at })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleComment = async () => {
    if (!commentBody.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await addPullRequestComment(repo.id, number, { body: commentBody });
      setCommentBody("");
      refetchComments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMerge = async () => {
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
  };

  const handleCloseReopen = async (action: "close" | "reopen") => {
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
  };

  const isOpen = pullRequest.status === "open";

  return (
    <div className="mx-auto max-w-4xl pt-4">
      {error && (
        <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Origin Description */}
      <div className="mb-6 flex gap-4">
        <div className="hidden sm:block">
          <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
            <span className="text-zinc-500 text-sm">{pullRequest.author?.username?.[0]?.toUpperCase()}</span>
          </div>
        </div>
        <div className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 relative">
          <div className="border-b border-zinc-800 bg-zinc-800/80 px-4 py-3 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-semibold text-zinc-200">{pullRequest.author?.username}</span>{" "}
              <span className="text-zinc-400">commented {formatRelativeTime(pullRequest.created_at)}</span>
            </div>
            {/* Can add edit button here if author */}
          </div>
          <div className="p-4 text-sm text-zinc-300 min-h-[60px] whitespace-pre-wrap">
            {pullRequest.body || <span className="italic text-zinc-500">No description provided.</span>}
          </div>
        </div>
      </div>

      {/* Timeline items (Comments & Reviews) */}
      <div className="relative mb-6 pl-6 sm:pl-16">
        <div className="absolute left-10 sm:left-20 top-0 bottom-0 w-px bg-zinc-800 -z-10 hidden sm:block"></div>
        
        {timelineItems.map((item) => (
          <div key={`${item.kind}-${item.id}`} className="mb-6 flex gap-4">
            <div className="absolute left-5 sm:left-[3.25rem] mt-3 h-8 w-8 -translate-x-1/2 rounded-full bg-zinc-950 flex items-center justify-center ring-1 ring-zinc-800 hidden sm:flex">
              {item.kind === "review" ? (
                <span className="text-xs">👀</span>
              ) : (
                <span className="text-xs">💬</span>
              )}
            </div>

            <div className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 shadow-sm relative ml-0 sm:ml-4">
              <div className="border-b border-zinc-800 bg-zinc-800/80 px-4 py-3 text-sm">
                <span className="font-semibold text-zinc-200">
                  {item.kind === "comment" ? item.author?.username : item.reviewer?.username}
                </span>{" "}
                <span className="text-zinc-400">
                  {item.kind === "comment" ? "commented" : `reviewed (${item.status})`}{" "}
                  {formatRelativeTime(item.date)}
                </span>
              </div>
              <div className="p-4 text-sm text-zinc-300 whitespace-pre-wrap">
                {item.body || <span className="italic text-zinc-500">No additional details.</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Comment Box */}
      <div className="flex gap-4 border-t border-zinc-800 pt-8 pb-12">
        <div className="hidden sm:block">
          <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
            <span className="text-zinc-500 text-sm">Me</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="rounded-md border border-zinc-700 bg-zinc-900 mb-3 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
            <div className="border-b border-zinc-800 bg-zinc-800/80 px-4 py-2">
              <span className="text-sm font-medium text-zinc-300">Write a comment</span>
            </div>
            <textarea
              rows={4}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Leave a comment"
              className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            {isOpen && (
              <button
                onClick={() => handleCloseReopen("close")}
                disabled={isClosing}
                className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-red-500 hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isClosing && <Spinner size="sm" />}
                Close pull request
              </button>
            )}

            {!isOpen && pullRequest.status === "closed" && (
              <button
                onClick={() => handleCloseReopen("reopen")}
                disabled={isClosing}
                className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isClosing && <Spinner size="sm" />}
                Reopen pull request
              </button>
            )}

            <button
              onClick={handleComment}
              disabled={isSubmitting || !commentBody.trim()}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Spinner size="sm" />}
              Comment
            </button>
            
            {isOpen && (
              <button
                onClick={handleMerge}
                disabled={isMerging}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isMerging && <Spinner size="sm" />}
                Merge pull request
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
