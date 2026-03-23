"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { ChatIcon } from "@/components/ui/Icons";
import type { SpaceWorkComment, User } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import * as api from "@/lib/services/spacesApi";
import RichComposer from "@/components/ui/RichComposer";
import RichText from "@/components/ui/RichText";

function buildChildrenMap(comments: SpaceWorkComment[]) {
  return comments.reduce<Record<string, SpaceWorkComment[]>>((acc, comment) => {
    if (!comment.parent_comment_id) return acc;
    if (!acc[comment.parent_comment_id]) acc[comment.parent_comment_id] = [];
    acc[comment.parent_comment_id].push(comment);
    return acc;
  }, {});
}

function Composer({
  spaceId,
  issueId,
  currentUser,
  onPosted,
  parentCommentId,
  placeholder,
  ctaLabel,
}: {
  spaceId: string;
  issueId: string;
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
      await api.createWorkComment(spaceId, issueId, body.trim(), parentCommentId);
      setBody("");
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  const isReply = Boolean(parentCommentId);

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isReply
          ? "space-y-2"
          : "space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/50 p-3 sm:p-4"
      }
    >
      <div className="flex gap-2.5 sm:gap-3">
        <Avatar user={currentUser} size="xs" className="mt-1 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <RichComposer
            value={body}
            onChange={(value) => setBody(value)}
            rows={2}
            placeholder={placeholder}
            previewClassName="rounded-xl border border-zinc-800 bg-zinc-950/90 px-3 py-2.5 text-sm leading-relaxed text-white"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 px-3 py-2.5 text-sm leading-relaxed text-transparent caret-white outline-none transition-colors focus:border-zinc-600 selection:bg-[#1d9bf0]/30"
          />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="mr-auto text-[11px] text-zinc-500">
              Keep it constructive and specific.
            </span>
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="rounded-xl bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Posting..." : ctaLabel}
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        {error ? <p className="mr-auto text-xs text-rose-400">{error}</p> : null}
      </div>
    </form>
  );
}

function CommentNode({
  spaceId,
  issueId,
  comment,
  childrenMap,
  currentUser,
  onRefresh,
  depth = 0,
}: {
  spaceId: string;
  issueId: string;
  comment: SpaceWorkComment;
  childrenMap: Record<string, SpaceWorkComment[]>;
  currentUser: User | null;
  onRefresh: () => void;
  depth?: number;
}) {
  const [showReply, setShowReply] = useState(false);
  const children = childrenMap[comment.id] ?? [];
  const hasReplies = children.length > 0;

  return (
    <div className={depth > 0 ? "ml-4 border-l border-zinc-800/80 pl-4 sm:ml-6" : ""}>
      <article className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-3 sm:p-4">
        <div className="flex gap-3">
        <Avatar user={comment.author ?? null} size="sm" className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="font-semibold text-white">{comment.author?.name ?? "Unknown"}</span>
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-500">{formatRelativeTime(comment.created_at)}</span>
            {hasReplies ? (
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">
                {children.length} repl{children.length === 1 ? "y" : "ies"}
              </span>
            ) : null}
          </div>
          <RichText text={comment.body} className="whitespace-pre-line text-sm leading-relaxed text-zinc-300" />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {currentUser ? (
              <button
                onClick={() => setShowReply((value) => !value)}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-sky-400/40 hover:text-sky-300"
              >
                <ChatIcon className="h-3.5 w-3.5" />
                {showReply ? "Cancel" : "Reply"}
              </button>
            ) : null}
          </div>

          {showReply && currentUser ? (
            <div className="mt-3">
              <Composer
                spaceId={spaceId}
                issueId={issueId}
                currentUser={currentUser}
                parentCommentId={comment.id}
                onPosted={() => {
                  setShowReply(false);
                  onRefresh();
                }}
                placeholder="Write a reply..."
                ctaLabel="Post reply"
              />
            </div>
          ) : null}

          {hasReplies ? (
            <div className="mt-3 space-y-2">
              {children.map((child) => (
                <CommentNode
                  key={child.id}
                  spaceId={spaceId}
                  issueId={issueId}
                  comment={child}
                  childrenMap={childrenMap}
                  currentUser={currentUser}
                  onRefresh={onRefresh}
                  depth={depth + 1}
                />
              ))}
            </div>
          ) : null}
        </div>
        </div>
      </article>
    </div>
  );
}

export default function WorkCommentsPanel({
  spaceId,
  issueId,
  currentUser,
  comments,
  onRefresh,
}: {
  spaceId: string;
  issueId: string;
  currentUser: User | null;
  comments: SpaceWorkComment[];
  onRefresh: () => void;
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
  }, [issueId]);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/20">
      <div className="border-b border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-900/30 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">Comments</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Use @mentions for context and keep discussion attached to this work item.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="rounded-full border border-zinc-700 bg-zinc-900/70 px-2.5 py-1">
              {totalComments} total
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-900/70 px-2.5 py-1">
              {rootComments.length} threads
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {currentUser ? (
          <Composer
            spaceId={spaceId}
            issueId={issueId}
            currentUser={currentUser}
            onPosted={onRefresh}
            placeholder="Add to the work thread..."
            ctaLabel="Post comment"
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 px-4 py-3 text-xs text-zinc-500">
            Sign in to add a comment.
          </div>
        )}

        {rootComments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-10 text-center text-sm text-zinc-500">
            No comments yet.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleRootComments.map((comment) => (
              <CommentNode
                key={comment.id}
                spaceId={spaceId}
                issueId={issueId}
                comment={comment}
                childrenMap={childrenMap}
                currentUser={currentUser}
                onRefresh={onRefresh}
              />
            ))}
            {hasMoreRootComments ? (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleRootCount((current) => current + 20)}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  Load more comments
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
