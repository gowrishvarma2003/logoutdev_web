"use client";

import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { ChatIcon } from "@/components/ui/Icons";
import { formatRelativeTime } from "@/lib/utils";
import * as api from "@/lib/services/spacesApi";
import type { DiscussionReply, User } from "@/lib/types";
import RichText from "@/components/ui/RichText";

const REPLY_LIMIT = 1000;
const MAX_THREAD_DEPTH = 4;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Group all replies by their parent_reply_id for O(1) child lookup. */
export function buildChildrenMap(replies: DiscussionReply[]) {
  return replies.reduce<Record<string, DiscussionReply[]>>((acc, reply) => {
    const pid = reply.parent_reply_id;
    if (!pid) return acc;
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(reply);
    return acc;
  }, {});
}

// ─── Inline Reply Composer ──────────────────────────────────────────────────

/**
 * Compact single-line reply composer (Twitter-style).
 * Shows avatar + input + reply button.
 */
export function InlineComposer({
  user,
  spaceId,
  threadId,
  parentReplyId,
  onPosted,
  placeholder = "Post your reply…",
}: {
  user: User | null | undefined;
  spaceId: string;
  threadId: string;
  parentReplyId?: string;
  onPosted: () => void;
  placeholder?: string;
}) {
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!body.trim()) return;
    setPosting(true);
    setError("");
    try {
      await api.addReply(spaceId, threadId, body.trim(), parentReplyId);
      setBody("");
      onPosted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reply");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="flex gap-2.5 items-start">
      <Avatar user={user ?? null} size="xs" className="mt-1 shrink-0" />
      <div className="flex-1">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={placeholder}
            maxLength={REPLY_LIMIT}
            className="flex-1 px-3 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
          <button
            onClick={submit}
            disabled={posting || !body.trim()}
            className="shrink-0 px-3.5 py-1.5 rounded-full bg-sky-500 text-white text-xs font-bold hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {posting ? "…" : "Reply"}
          </button>
        </div>
        {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
      </div>
    </div>
  );
}

// ─── Threaded Reply Component ───────────────────────────────────────────────

/**
 * Recursive threaded reply — renders a single reply with its nested children
 * inline below, connected by a vertical line from the avatar (Twitter pattern).
 *
 * Children are placed inside the parent's content column, so visual nesting
 * happens naturally (each level indents by avatar-width + gap).
 */
export default function ThreadedReply({
  reply,
  childrenMap,
  depth = 0,
  spaceId,
  threadId,
  isMember,
  user,
  onReplyPosted,
}: {
  reply: DiscussionReply;
  childrenMap: Record<string, DiscussionReply[]>;
  depth?: number;
  spaceId: string;
  threadId: string;
  isMember: boolean;
  user: User | null | undefined;
  onReplyPosted: () => void;
}) {
  const [showComposer, setShowComposer] = useState(false);
  const children = childrenMap[reply.id] ?? [];
  const hasChildren = children.length > 0;
  const canNest = depth < MAX_THREAD_DEPTH;

  return (
    <div className="flex gap-2.5 pt-3">
      {/* ── Avatar column with thread connector line ── */}
      <div className="flex flex-col items-center shrink-0 w-8">
        <Avatar
          user={reply.author}
          size={depth < 2 ? "sm" : "xs"}
          className="shrink-0"
        />
        {/* Vertical connector to children */}
        {hasChildren && canNest && (
          <div className="w-0.5 bg-zinc-700/50 flex-1 mt-1.5 rounded-full min-h-[12px]" />
        )}
      </div>

      {/* ── Content + nested children ── */}
      <div className="flex-1 min-w-0 pb-3">
        {/* Author row */}
        <div className="flex items-center gap-2 text-xs mb-1">
          <span className="font-semibold text-white">
            {reply.author?.name ?? "Unknown"}
          </span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-500">
            {formatRelativeTime(reply.created_at)}
          </span>
        </div>

        {/* Reply body */}
        <RichText text={reply.body} className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed" />

        {/* Action bar */}
        <div className="flex items-center gap-4 mt-2 text-xs">
          {isMember ? (
            <button
              onClick={() => setShowComposer((s) => !s)}
              className={`inline-flex items-center gap-1.5 transition-colors ${
                showComposer
                  ? "text-sky-400"
                  : "text-zinc-500 hover:text-sky-400"
              }`}
            >
              <ChatIcon className="w-3.5 h-3.5" />
              {children.length > 0 && <span>{children.length}</span>}
            </button>
          ) : (
            children.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-zinc-500">
                <ChatIcon className="w-3.5 h-3.5" />
                <span>{children.length}</span>
              </span>
            )
          )}
        </div>

        {/* Inline reply composer */}
        {showComposer && isMember && (
          <div className="mt-3">
            <InlineComposer
              user={user}
              spaceId={spaceId}
              threadId={threadId}
              parentReplyId={reply.id}
              onPosted={() => {
                setShowComposer(false);
                onReplyPosted();
              }}
            />
          </div>
        )}

        {/* Nested children (rendered inside content column for natural indentation) */}
        {hasChildren && canNest && (
          <div className="mt-1">
            {children.map((child) => (
              <ThreadedReply
                key={child.id}
                reply={child}
                childrenMap={childrenMap}
                depth={depth + 1}
                spaceId={spaceId}
                threadId={threadId}
                isMember={isMember}
                user={user}
                onReplyPosted={onReplyPosted}
              />
            ))}
          </div>
        )}

        {/* Depth limit indicator */}
        {hasChildren && !canNest && (
          <p className="text-[11px] text-zinc-600 mt-2 italic">
            {children.length} more{" "}
            {children.length === 1 ? "reply" : "replies"} in this thread
          </p>
        )}
      </div>
    </div>
  );
}
