"use client";

import { useMemo, useState } from "react";
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
}: {
  questionId: string;
  currentUser: User | null;
  onPosted: () => void;
  parentCommentId?: string;
  placeholder: string;
}) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2.5">
        <Avatar user={currentUser} size="xs" className="mt-1 shrink-0" />
        <RichComposer
          value={body}
          onChange={(value) => setBody(value)}
          rows={2}
          placeholder={placeholder}
          previewClassName="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm leading-relaxed text-white"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm leading-relaxed text-transparent caret-white outline-none focus:border-zinc-600 selection:bg-[#1d9bf0]/30"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        {error && <p className="mr-auto text-xs text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !body.trim()}
          className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Posting…" : "Reply"}
        </button>
      </div>
    </form>
  );
}

function CommentNode({
  comment,
  childrenMap,
  questionId,
  currentUser,
  onRefresh,
  depth = 0,
}: {
  comment: QuestionDiscussionComment;
  childrenMap: Record<string, QuestionDiscussionComment[]>;
  questionId: string;
  currentUser: User | null;
  onRefresh: () => void;
  depth?: number;
}) {
  const [showReply, setShowReply] = useState(false);
  const children = childrenMap[comment.id] ?? [];

  return (
    <div className={`${depth > 0 ? "ml-8 border-l border-zinc-800 pl-4" : ""}`}>
      <div className="flex gap-3 py-3">
        <Avatar user={comment.author ?? null} size="sm" className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-xs">
            <span className="font-semibold text-white">{comment.author?.name ?? "Unknown"}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-500">{formatRelativeTime(comment.created_at)}</span>
          </div>
          <RichText text={comment.body} className="whitespace-pre-line text-sm leading-relaxed text-zinc-300" />

          {currentUser && (
            <button
              onClick={() => setShowReply((value) => !value)}
              className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-sky-300"
            >
              <ChatIcon className="h-3.5 w-3.5" />
              Reply
            </button>
          )}

          {showReply && currentUser && (
            <div className="mt-3">
              <Composer
                questionId={questionId}
                currentUser={currentUser}
                parentCommentId={comment.id}
                onPosted={() => {
                  setShowReply(false);
                  onRefresh();
                }}
                placeholder="Write a reply…"
              />
            </div>
          )}

          {children.length > 0 && (
            <div className="mt-2 space-y-1">
              {children.map((child) => (
                <CommentNode
                  key={child.id}
                  comment={child}
                  childrenMap={childrenMap}
                  questionId={questionId}
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

export default function DiscussionPanel({
  questionId,
  currentUser,
  comments,
  onRefresh,
}: {
  questionId: string;
  currentUser: User | null;
  comments: QuestionDiscussionComment[];
  onRefresh: () => void;
}) {
  const childrenMap = useMemo(() => buildChildrenMap(comments), [comments]);
  const rootComments = useMemo(
    () => comments.filter((comment) => !comment.parent_comment_id),
    [comments]
  );

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/20">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Discussion</h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          Clarify tradeoffs, compare approaches, and add follow-up context.
        </p>
      </div>

      <div className="space-y-3 p-4">
        {currentUser && (
          <Composer
            questionId={questionId}
            currentUser={currentUser}
            onPosted={onRefresh}
            placeholder="Add to the discussion…"
          />
        )}

        {rootComments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
            No discussion yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {rootComments.map((comment) => (
              <CommentNode
                key={comment.id}
                comment={comment}
                childrenMap={childrenMap}
                questionId={questionId}
                currentUser={currentUser}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
