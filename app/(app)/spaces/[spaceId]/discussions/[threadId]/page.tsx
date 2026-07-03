"use client";

import { use, useMemo, useState, useRef, useEffect } from "react";
import { useDiscussion, useSpace } from "@/lib/hooks/useSpaces";
import { useAuth } from "@/lib/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import {
  ArrowLeftIcon,
  PinIcon,
  CheckCircleIcon,
  ChatIcon,
  ChevronRightIcon,
} from "@/components/ui/Icons";
import { formatRelativeTime } from "@/lib/utils";
import * as api from "@/lib/services/spacesApi";
import * as cache from "@/lib/services/requestCache";
import Link from "next/link";
import RichComposer, { type RichComposerHandle } from "@/components/ui/RichComposer";
import RichText from "@/components/ui/RichText";

// ─── Design tokens ─────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { bg: string; text: string; border: string; label: string; emoji: string }
> = {
  idea:          { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-l-violet-500/60", label: "Idea",       emoji: "💡" },
  decision:      { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-l-emerald-500/60", label: "Decision", emoji: "✅" },
  question:      { bg: "bg-sky-500/10",     text: "text-sky-400",     border: "border-l-sky-500/60",     label: "Question", emoji: "❓" },
  blocked:       { bg: "bg-rose-500/10",    text: "text-rose-400",    border: "border-l-rose-500/60",    label: "Blocked",  emoji: "🚫" },
  retrospective: { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-l-amber-500/60",   label: "Retro",    emoji: "🔁" },
};

const STATUS_META: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  open:          { label: "Open",        bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  "in-progress": { label: "In Progress", bg: "bg-amber-500/10",   text: "text-amber-400",   dot: "bg-amber-400" },
  resolved:      { label: "Resolved",    bg: "bg-sky-500/10",     text: "text-sky-400",     dot: "bg-sky-400" },
  closed:        { label: "Closed",      bg: "bg-zinc-700/30",    text: "text-zinc-500",    dot: "bg-zinc-600" },
};

const REPLY_LIMIT = 1000;

/**
 * /spaces/[spaceId]/discussions/[threadId]
 *
 * Twitter-style thread page:
 *   ① Sticky breadcrumb nav
 *   ② Original post card (prominent, category-colored border)
 *   ③ "N Replies" section divider
 *   ④ Reply list — each reply is clickable, navigates to its own page
 *   ⑤ Sticky reply composer at bottom
 */
export default function DiscussionThreadPage({
  params,
}: {
  params: Promise<{ spaceId: string; threadId: string }>;
}) {
  const { spaceId, threadId } = use(params);
  const { user, isLoaded: authLoaded } = useAuth();
  const { space, loading: spaceLoading } = useSpace(spaceId);
  const { discussion, loading, error, refetch } = useDiscussion(spaceId, threadId);
  const viewerPermissions = space?.viewer_permissions;
  const permissionsLoaded = Boolean(viewerPermissions) && !spaceLoading;

  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [composerFocused, setComposerFocused] = useState(false);
  const composerRef = useRef<RichComposerHandle>(null);

  const charCount = replyBody.length;
  const isOverLimit = charCount > REPLY_LIMIT;

  // Auto-expand textarea height
  useEffect(() => {
    composerRef.current?.adjustHeight?.(160);
  }, [replyBody]);

  const replies = useMemo(() => discussion?.replies ?? [], [discussion?.replies]);
  const rootReplies = useMemo(
    () => replies.filter((r) => !r.parent_reply_id),
    [replies]
  );
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
  const canReply = Boolean(
    discussion
    && viewerPermissions?.can_reply === true
    && viewerPermissions.allowed_discussion_categories.includes(discussion.category)
  );

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() || isOverLimit) return;
    setReplying(true);
    setReplyError("");
    try {
      await api.addReply(spaceId, threadId, replyBody.trim());
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
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <p className="text-sm text-zinc-400">{error || "Discussion not found."}</p>
        <Link
          href={`/spaces/${spaceId}/discussions`}
          className="mt-3 text-xs text-sky-400 hover:text-sky-300 transition-colors"
        >
          ← Back to Discussions
        </Link>
      </div>
    );
  }

  const cat = CATEGORY_META[discussion.category] ?? CATEGORY_META.idea;
  const st = STATUS_META[discussion.status] ?? STATUS_META.open;

  return (
    <div className="flex flex-col min-h-full">

      {/* ── ① Breadcrumb nav ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center gap-2 px-5 py-3 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800">
        <Link
          href={`/spaces/${spaceId}/discussions`}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors group"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Discussions
        </Link>
        <span className="text-zinc-700 text-xs">/</span>
        <span className="text-xs text-zinc-400 truncate max-w-[200px]">
          {discussion.title}
        </span>
      </div>

      {/* ── ② Original Post card ────────────────────────────────────────── */}
      <article className={`border-b border-zinc-800 border-l-[4px] ${cat.border} bg-zinc-900/20`}>
        <div className="px-5 pt-5 pb-5">

          {/* Labels row: OP badge + category + status + pin */}
          <div className="flex items-center gap-2 flex-wrap mb-3.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold
              bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase tracking-widest">
              Original Post
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cat.bg} ${cat.text}`}>
              {cat.emoji} {cat.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${st.bg} ${st.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              {st.label}
            </span>
            {discussion.is_pinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold
                bg-amber-500/10 text-amber-400 border border-amber-500/25">
                <PinIcon className="w-2.5 h-2.5" />
                Pinned
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-white leading-snug mb-4">
            {discussion.title}
          </h1>

          {/* Author row */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar user={discussion.author} size="md" />
            <div>
              <p className="text-sm font-semibold text-white leading-none">
                {discussion.author?.name ?? "Unknown"}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {formatRelativeTime(discussion.created_at)}
              </p>
            </div>
          </div>

          {/* Body */}
          <RichText
            text={discussion.body}
            className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line"
          />

          {/* Decision summary callout */}
          {discussion.decision_summary && (
            <div className="mt-5 flex gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/25">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  Decision Summary
                </p>
                <p className="text-sm text-emerald-300 leading-relaxed">
                  {discussion.decision_summary}
                </p>
              </div>
            </div>
          )}
        </div>
      </article>

      {/* ── ③ Replies section header ────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3 bg-zinc-950 border-b border-zinc-800/60">
        <ChatIcon className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-xs font-semibold text-zinc-500">
          {rootReplies.length === 0
            ? "No replies yet"
            : rootReplies.length === 1
            ? "1 Reply"
            : `${rootReplies.length} Replies`}
        </span>
        <div className="flex-1 h-px bg-zinc-800/50" />
      </div>

      {/* ── ④ Reply list — each reply links to its own page ───────────── */}
      {rootReplies.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center px-4">
          <p className="text-sm text-zinc-600">
            {canReply
              ? "Be the first to reply to this discussion."
              : "No replies yet."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-zinc-800/40">
          {rootReplies.map((reply) => {
            const nestedCount = nestedCountByParent[reply.id] ?? 0;
            return (
              <Link
                key={reply.id}
                href={`/spaces/${spaceId}/discussions/${threadId}/replies/${reply.id}`}
                className="group flex gap-3 px-5 py-4 hover:bg-zinc-900/40 transition-colors"
              >
                <Avatar user={reply.author} size="sm" className="mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  {/* Author + time */}
                  <div className="flex items-center gap-2 mb-1 text-xs">
                    <span className="font-semibold text-white">
                      {reply.author?.name ?? "Unknown"}
                    </span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-zinc-500">
                      {formatRelativeTime(reply.created_at)}
                    </span>
                  </div>
                  {/* Body */}
                  <RichText
                    text={reply.body}
                    className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line"
                  />
                  {/* Footer: reply count + chevron */}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-zinc-500">
                      <ChatIcon className="w-3.5 h-3.5" />
                      {nestedCount} {nestedCount === 1 ? "reply" : "replies"}
                    </span>
                    <ChevronRightIcon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Spacer so sticky composer doesn't cover last reply */}
      {canReply && <div className="h-24" />}

      {/* ── ⑤ Sticky reply composer ───────────────────────────────────── */}
      {canReply ? (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 shadow-xl">
          <form onSubmit={handleReply} className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex gap-3 items-end">
              <Avatar user={user} size="sm" className="shrink-0 mb-0.5" />
              <div className="flex-1 relative">
                <RichComposer
                  ref={composerRef}
                  value={replyBody}
                  onChange={(value) => setReplyBody(value)}
                  onFocus={() => setComposerFocused(true)}
                  placeholder="Write a reply…"
                  rows={1}
                  previewClassName={`w-full px-3.5 py-2.5 rounded-xl text-sm leading-relaxed text-white
                    bg-zinc-900 border transition-all duration-200
                    ${composerFocused
                      ? "border-zinc-600 ring-1 ring-zinc-700 pb-7"
                      : "border-zinc-800 hover:border-zinc-700"}
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
                        : "text-zinc-600"
                    }`}
                  >
                    {charCount}/{REPLY_LIMIT}
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={replying || !replyBody.trim() || isOverLimit}
                className="shrink-0 px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold
                  hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed
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
      ) : authLoaded && user && !permissionsLoaded ? (
        <div className="border-t border-zinc-800 bg-zinc-950/60 px-5 py-4">
          <div className="flex justify-center">
            <Spinner />
          </div>
        </div>
      ) : authLoaded && user ? (
        <div className="border-t border-zinc-800 bg-zinc-950/60 px-5 py-4 text-sm text-zinc-400">
          Replies in this thread are limited to contributors or to viewers allowed for the <span className="text-zinc-200">{discussion.category}</span> category.
        </div>
      ) : authLoaded ? (
        <div className="border-t border-zinc-800 bg-zinc-950/60 px-5 py-4 text-sm text-zinc-400">
          Sign in to reply where this discussion category is open to public participants.
        </div>
      ) : null}
    </div>
  );
}
