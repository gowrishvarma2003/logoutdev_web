"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { ChatIcon } from "@/components/ui/Icons";
import type { SpaceWorkComment, User } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import * as api from "@/lib/services/spacesApi";
import * as cache from "@/lib/services/requestCache";
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
      cache.invalidateSpace(spaceId, "work");
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
    <form onSubmit={handleSubmit} className="space-y-2 mt-3">
      <div className="flex gap-3">
        <Avatar user={currentUser} size="xs" className="mt-1 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <RichComposer
            value={body}
            onChange={(value) => setBody(value)}
            rows={2}
            placeholder={placeholder}
            previewClassName="rounded-xl border border-border-default bg-app px-3 py-2 text-sm text-text-primary"
            className="w-full rounded-xl border border-border-default bg-surface/40 px-3 py-2 text-sm text-text-primary outline-none focus:border-border-strong"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-text-disabled">
              Format with markdown.
            </span>
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary disabled:opacity-40 transition-colors cursor-pointer"
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const children = childrenMap[comment.id] ?? [];
  const hasReplies = children.length > 0;

  return (
    <div className="group/node py-3.5">
      <div className="flex gap-3">
        <Avatar user={comment.author ?? null} size={depth === 0 ? "sm" : "xs"} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          {/* Header metadata */}
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="font-semibold text-text-primary">{comment.author?.name ?? "Unknown"}</span>
            <span className="text-text-disabled">•</span>
            <span className="text-text-disabled">{formatRelativeTime(comment.created_at)}</span>
          </div>
          
          {/* Comment body */}
          <RichText text={comment.body} className="whitespace-pre-line text-sm leading-relaxed text-text-secondary" />

          {/* Action Row */}
          <div className="mt-2.5 flex items-center gap-3 text-xs text-text-disabled">
            {currentUser && (
              <button
                onClick={() => setShowReply((value) => !value)}
                className="hover:text-text-secondary cursor-pointer flex items-center gap-1 transition-colors"
              >
                <ChatIcon className="h-3 w-3" />
                {showReply ? "Cancel" : "Reply"}
              </button>
            )}
            
            {hasReplies && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hover:text-text-secondary cursor-pointer transition-colors"
              >
                {isCollapsed ? `Show replies (${children.length})` : "Hide replies"}
              </button>
            )}
          </div>

          {showReply && currentUser && (
            <div className="max-w-xl">
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
                ctaLabel="Reply"
              />
            </div>
          )}

          {/* Indented reply threads */}
          {hasReplies && !isCollapsed && (
            <div className="mt-3 pl-4 border-l border-border-default space-y-2">
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
          )}
        </div>
      </div>
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
    <section className="space-y-4">
      {/* Simple Clean Header */}
      <div className="flex items-center justify-between border-b border-border-default pb-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Discussion</h3>
          <p className="text-xs text-text-disabled mt-0.5">
            Keep conversation specific to this work item.
          </p>
        </div>
        <div className="text-xs text-text-muted font-medium bg-surface border border-border-default rounded-full px-3 py-1">
          {totalComments} comment{totalComments === 1 ? "" : "s"}
        </div>
      </div>

      {/* Main Composer */}
      {currentUser ? (
        <Composer
          spaceId={spaceId}
          issueId={issueId}
          currentUser={currentUser}
          onPosted={onRefresh}
          placeholder="Type a message to start a discussion thread..."
          ctaLabel="Comment"
        />
      ) : (
        <div className="rounded-xl border border-dashed border-border-default bg-app/20 px-4 py-3 text-xs text-text-disabled">
          Sign in to join the discussion.
        </div>
      )}

      {/* Discussion Threads List */}
      {rootComments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-default bg-app/10 px-4 py-8 text-center text-sm text-text-disabled">
          No messages in this discussion yet.
        </div>
      ) : (
        <div className="divide-y divide-border-default/60">
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
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => setVisibleRootCount((current) => current + 20)}
                className="rounded-lg border border-border-default bg-surface/40 px-3.5 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer"
              >
                Load more comments
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
