"use client";

import { use, useMemo, useState, useRef, useEffect } from "react";
import { useDiscussion, useContributors } from "@/lib/hooks/useSpaces";
import { useAuth } from "@/lib/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import { ArrowLeftIcon, ChatIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { formatRelativeTime } from "@/lib/utils";
import * as api from "@/lib/services/spacesApi";
import * as cache from "@/lib/services/requestCache";
import type { DiscussionReply } from "@/lib/types";
import Link from "next/link";
import RichComposer, { type RichComposerHandle } from "@/components/ui/RichComposer";
import RichText from "@/components/ui/RichText";

const REPLY_LIMIT = 1000;

/** Group replies by parent_reply_id for child lookup. */
function buildChildrenMap(replies: DiscussionReply[]) {
  return replies.reduce<Record<string, DiscussionReply[]>>((acc, reply) => {
    const pid = reply.parent_reply_id;
    if (!pid) return acc;
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(reply);
    return acc;
  }, {});
}

/**
 * /spaces/[spaceId]/discussions/[threadId]/replies/[replyId]
 *
 * Reply page — shows a single reply as the focus post.
 * Its direct child replies are listed below, each linking to its own page.
 */
export default function DiscussionReplyThreadPage({
  params,
}: {
  params: Promise<{ spaceId: string; threadId: string; replyId: string }>;
}) {
  const { spaceId, threadId, replyId } = use(params);
  const { user } = useAuth();
  const { discussion, loading, error, refetch } = useDiscussion(spaceId, threadId);
  const { contributors } = useContributors(spaceId);
  const isMember = contributors.some((c) => c.user_id === user?.id);

  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [composerFocused, setComposerFocused] = useState(false);
  const composerRef = useRef<RichComposerHandle>(null);

  const charCount = replyBody.length;
  const isOverLimit = charCount > REPLY_LIMIT;

  useEffect(() => {
    composerRef.current?.adjustHeight?.(160);
  }, [replyBody]);

  const replies = discussion?.replies ?? [];
  const targetReply = useMemo(
    () => replies.find((r) => r.id === replyId) ?? null,
    [replies, replyId]
  );
  const childrenMap = useMemo(() => buildChildrenMap(replies), [replies]);
  const directChildren = childrenMap[replyId] ?? [];

  // Count grandchildren for each direct child
  const nestedCountByParent = useMemo(
    () =>
      replies.reduce<Record<string, number>>((acc, r) => {
        if (r.parent_reply_id) {
          acc[r.parent_reply_id] = (acc[r.parent_reply_id] ?? 0) + 1;
        }
        return acc;
      }, {}),
    [replies]
  );

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() || isOverLimit) return;
    setReplying(true);
    setReplyError("");
    try {
      await api.addReply(spaceId, threadId, replyBody.trim(), replyId);
      cache.invalidateSpace(spaceId, "discussions");
      setReplyBody("");
      setComposerFocused(false);
      refetch();
    } catch (err: unknown) {
      setReplyError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setReplying(false);
    }
  }

  // ── Loading / error ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !discussion || !targetReply) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-text-disabled">
          {error || "Reply not found."}
        </p>
        <Link
          href={`/spaces/${spaceId}/discussions/${threadId}`}
          className="mt-3 inline-flex text-xs text-sky-400 hover:text-sky-300"
        >
          Back to discussion
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Breadcrumb nav ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b border-border-default bg-app/90 backdrop-blur-sm">
        <Link
          href={`/spaces/${spaceId}/discussions/${threadId}`}
          className="inline-flex items-center gap-1 text-xs text-text-disabled hover:text-text-secondary transition-colors"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Back to Discussion
        </Link>
      </div>

      {/* ── Focus reply card ──────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-border-default bg-surface/25">
        <div className="flex gap-3">
          <Avatar user={targetReply.author} size="md" className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 text-xs">
              <span className="font-semibold text-text-primary">
                {targetReply.author?.name ?? "Unknown"}
              </span>
              <span className="text-zinc-700">·</span>
              <span className="text-text-disabled">
                {formatRelativeTime(targetReply.created_at)}
              </span>
            </div>
            <RichText text={targetReply.body} className="text-sm text-text-secondary whitespace-pre-line leading-relaxed" />
          </div>
        </div>
      </div>

      {/* ── Replies header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border-default/60 bg-app">
        <ChatIcon className="w-3.5 h-3.5 text-text-disabled" />
        <span className="text-xs font-semibold text-text-disabled">
          {directChildren.length === 0
            ? "No replies yet"
            : directChildren.length === 1
            ? "1 Reply"
            : `${directChildren.length} Replies`}
        </span>
        <div className="flex-1 h-px bg-surface-hover/50" />
      </div>

      {/* ── Child replies list — each links to its own page ───────────── */}
      {directChildren.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center px-4">
          <p className="text-sm text-text-disabled">
            {isMember ? "Be the first to reply." : "No replies yet."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border-default/40">
          {directChildren.map((child) => {
            const grandCount = nestedCountByParent[child.id] ?? 0;
            return (
              <Link
                key={child.id}
                href={`/spaces/${spaceId}/discussions/${threadId}/replies/${child.id}`}
                className="group flex gap-3 px-5 py-4 hover:bg-surface/40 transition-colors"
              >
                <Avatar user={child.author} size="sm" className="mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 text-xs">
                    <span className="font-semibold text-text-primary">
                      {child.author?.name ?? "Unknown"}
                    </span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-text-disabled">
                      {formatRelativeTime(child.created_at)}
                    </span>
                  </div>
                  <RichText text={child.body} className="text-sm text-text-secondary leading-relaxed whitespace-pre-line" />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-text-disabled">
                      <ChatIcon className="w-3.5 h-3.5" />
                      {grandCount} {grandCount === 1 ? "reply" : "replies"}
                    </span>
                    <ChevronRightIcon className="w-3.5 h-3.5 text-text-disabled group-hover:text-text-secondary transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Spacer for sticky composer */}
      {isMember && <div className="h-24" />}

      {/* ── Sticky reply composer ─────────────────────────────────────── */}
      {isMember && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-app/95 backdrop-blur-md border-t border-border-default shadow-xl">
          <form onSubmit={handleReply} className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex gap-3 items-end">
              <Avatar user={user} size="sm" className="shrink-0 mb-0.5" />
              <div className="flex-1 relative">
                <RichComposer
                  ref={composerRef}
                  value={replyBody}
                  onChange={(value) => setReplyBody(value)}
                  onFocus={() => setComposerFocused(true)}
                  placeholder="Reply to this post…"
                  rows={1}
                  previewClassName={`w-full px-3.5 py-2.5 rounded-xl text-sm leading-relaxed text-text-primary
                    bg-surface border transition-all duration-200
                    ${composerFocused
                      ? "border-border-strong ring-1 ring-border-strong pb-7"
                      : "border-border-default hover:border-border-strong"}
                    ${isOverLimit ? "border-rose-500/60 ring-rose-500/20" : ""}`}
                   className={`w-full px-3.5 py-2.5 text-sm leading-relaxed text-transparent caret-white
                    transition-all duration-200 resize-none focus:outline-none
                    ${composerFocused ? "pb-7" : ""}`}
                />
                {composerFocused && (
                  <span
                    className={`absolute bottom-2 right-3 text-[11px] font-medium transition-colors pointer-events-none ${
                      isOverLimit
                        ? "text-rose-400"
                        : charCount > REPLY_LIMIT * 0.85
                        ? "text-amber-400"
                        : "text-text-disabled"
                    }`}
                  >
                    {charCount}/{REPLY_LIMIT}
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={replying || !replyBody.trim() || isOverLimit}
                className="shrink-0 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold
                  hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed
                  active:scale-95 transition-all"
              >
                {replying ? "…" : "Reply"}
              </button>
            </div>
            {replyError && (
              <p className="text-xs text-rose-400 mt-1.5 ml-11">{replyError}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
