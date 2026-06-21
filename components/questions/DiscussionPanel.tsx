"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { ChatIcon } from "@/components/ui/Icons";
import type { QuestionDiscussionComment, User } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import * as api from "@/lib/services/questionsApi";
import RichComposer from "@/components/ui/RichComposer";
import RichText from "@/components/ui/RichText";

function buildChildrenMap(comments: QuestionDiscussionComment[]) {
  return comments.reduce<Record<string, QuestionDiscussionComment[]>>((acc, comment) => {
    if (!comment.parent_comment_id) return acc;
    if (!acc[comment.parent_comment_id]) acc[comment.parent_comment_id] = [];
    acc[comment.parent_comment_id].push(comment);
    return acc;
  }, {});
}

function Composer({
  questionId,
  currentUser,
  onPosted,
  parentCommentId,
  placeholder,
  ctaLabel,
}: {
  questionId: string;
  currentUser: User | null;
  onPosted: () => void;
  parentCommentId?: string;
  placeholder: string;
  ctaLabel: string;
}) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim() || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      await api.createDiscussionComment(questionId, body.trim(), parentCommentId);
      setBody("");
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-3">
      <div className="flex gap-3">
        <Avatar user={currentUser} size="xs" className="mt-1 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <RichComposer
            value={body}
            onChange={(value) => setBody(value)}
            rows={2}
            placeholder={placeholder}
            previewClassName="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-white outline-none focus:border-zinc-700"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-500">
              Format with markdown.
            </span>
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="rounded-lg bg-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              {submitting ? "Posting..." : ctaLabel}
            </button>
          </div>
        </div>
      </div>
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </form>
  );
}

function CommentNode({
  questionId,
  comment,
  childrenMap,
  currentUser,
  onRefresh,
  depth = 0,
  questionAuthorId,
}: {
  questionId: string;
  comment: QuestionDiscussionComment;
  childrenMap: Record<string, QuestionDiscussionComment[]>;
  currentUser: User | null;
  onRefresh: () => void;
  depth?: number;
  questionAuthorId?: string;
}) {
  const [showReply, setShowReply] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const children = childrenMap[comment.id] ?? [];
  const hasReplies = children.length > 0;
  const isAsker = questionAuthorId && comment.author_id === questionAuthorId;

  return (
    <div className="group/node py-3.5">
      <div className="flex gap-3">
        <Avatar user={comment.author ?? null} size={depth === 0 ? "sm" : "xs"} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          {/* Header metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
            <span className="font-semibold text-white">{comment.author?.name ?? "Unknown"}</span>
            {isAsker && (
              <span className="rounded bg-sky-500/10 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-sky-400 border border-sky-500/20">
                Asker
              </span>
            )}
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500">{formatRelativeTime(comment.created_at)}</span>
          </div>
          
          {/* Comment body */}
          <RichText text={comment.body} className="whitespace-pre-line text-sm leading-relaxed text-zinc-300" />

          {/* Action Row */}
          <div className="mt-2.5 flex items-center gap-3 text-xs text-zinc-500">
            {currentUser && (
              <button
                onClick={() => setShowReply((value) => !value)}
                className="hover:text-zinc-300 cursor-pointer flex items-center gap-1 transition-colors"
              >
                <ChatIcon className="h-3 w-3" />
                {showReply ? "Cancel" : "Reply"}
              </button>
            )}
            
            {hasReplies && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hover:text-zinc-300 cursor-pointer transition-colors"
              >
                {isCollapsed ? `Show replies (${children.length})` : "Hide replies"}
              </button>
            )}
          </div>

          {showReply && currentUser && (
            <div className="max-w-xl">
              <Composer
                questionId={questionId}
                currentUser={currentUser}
                parentCommentId={comment.id}
                onPosted={() => {
                  setShowReply(false);
                  onRefresh();
                }}
                placeholder="Write a reply..."
                ctaLabel="Reply"
              />
            </div>
          )}

          {/* Indented reply threads */}
          {hasReplies && !isCollapsed && (
            <div className="mt-3 pl-4 border-l border-zinc-800 space-y-2">
              {children.map((child) => (
                <CommentNode
                  key={child.id}
                  questionId={questionId}
                  comment={child}
                  childrenMap={childrenMap}
                  currentUser={currentUser}
                  onRefresh={onRefresh}
                  depth={depth + 1}
                  questionAuthorId={questionAuthorId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DiscussionPanel({
  questionId,
  currentUser,
  comments,
  onRefresh,
  questionAuthorId,
}: {
  questionId: string;
  currentUser: User | null;
  comments: QuestionDiscussionComment[];
  onRefresh: () => void;
  questionAuthorId?: string;
}) {
  const childrenMap = useMemo(() => buildChildrenMap(comments), [comments]);
  const [visibleRootCount, setVisibleRootCount] = useState(20);
  const rootComments = useMemo(
    () => comments.filter((comment) => !comment.parent_comment_id),
    [comments]
  );
  const visibleRootComments = useMemo(
    () => rootComments.slice(0, visibleRootCount),
    [rootComments, visibleRootCount]
  );

  const totalComments = comments.length;
  const hasMoreRootComments = rootComments.length > visibleRootCount;

  useEffect(() => {
    setVisibleRootCount(20);
  }, [questionId]);

  return (
    <section className="space-y-4">
      {/* Simple Clean Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h3 className="text-base font-semibold text-white">Discussion</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Clarify tradeoffs, compare approaches, and add follow-up context.
          </p>
        </div>
        <div className="text-xs text-zinc-400 font-medium bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1">
          {totalComments} post{totalComments === 1 ? "" : "s"}
        </div>
      </div>

      {/* Main Composer */}
      {currentUser ? (
        <Composer
          questionId={questionId}
          currentUser={currentUser}
          onPosted={onRefresh}
          placeholder="Type a message to start a discussion thread..."
          ctaLabel="Comment"
        />
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20 px-4 py-3 text-xs text-zinc-500">
          Sign in to join the discussion.
        </div>
      )}

      {/* Discussion Threads List */}
      {rootComments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/10 px-4 py-8 text-center text-sm text-zinc-500">
          No posts in this discussion yet.
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/60">
          {visibleRootComments.map((comment) => (
            <CommentNode
              key={comment.id}
              questionId={questionId}
              comment={comment}
              childrenMap={childrenMap}
              currentUser={currentUser}
              onRefresh={onRefresh}
              questionAuthorId={questionAuthorId}
            />
          ))}
          {hasMoreRootComments ? (
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => setVisibleRootCount((current) => current + 20)}
                className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                Load more posts
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}



