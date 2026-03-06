"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "@/lib/api";
import type { Post, User } from "@/lib/types";
import { formatRelativeTime, emailToHandle } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import PostActions from "./PostActions";
import ComposeBox from "./ComposeBox";
import { createReply } from "@/lib/api";
import { DotsIcon, TrashIcon, RepeatIcon } from "@/components/ui/Icons";

interface PostCardProps {
  post: Post;
  currentUser: User;
  onUpdate: (updated: Post) => void;
  onDelete: (id: string) => void;
  /** When true, clicking the card navigates to the post detail page */
  clickable?: boolean;
  /** When true, expands reply box inline */
  showReplies?: boolean;
}

/**
 * Splits content into plain text and #hashtag spans.
 */
function PostContent({ text }: { text: string }) {
  const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
  return (
    <p className="mt-1.5 text-[15px] text-zinc-100 leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        part.startsWith("#") ? (
          <span key={i} className="text-sky-400 hover:underline cursor-pointer">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

export default function PostCard({
  post,
  currentUser,
  onUpdate,
  onDelete,
  clickable = true,
  showReplies = false,
}: PostCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [replyOpen, setReplyOpen] = useState(showReplies);

  const isOwn = post.user_id === currentUser.id;

  const handleCardClick = () => {
    if (clickable) router.push(`/post/${post.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await deletePost(post.id);
      onDelete(post.id);
    } catch {
      // silent fail — UI stays intact
    } finally {
      setIsDeleting(false);
      setMenuOpen(false);
    }
  };

  return (
    <article
      onClick={clickable ? handleCardClick : undefined}
      className={`relative border-b border-zinc-800 px-4 py-4 transition-colors
        ${clickable ? "hover:bg-zinc-900/70 cursor-pointer" : ""}`}
    >
      {/* Repost banner */}
      {post.is_repost && (
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium mb-2 ml-[52px]">
          <RepeatIcon className="w-3.5 h-3.5" />
          <span>{post.author?.name ?? "Someone"} reposted</span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Author avatar */}
        <Avatar user={post.author ?? null} size="md" className="mt-0.5 shrink-0" />

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-white leading-snug">
              {post.author?.name ?? "Unknown"}
            </span>
            <span className="text-sm text-zinc-500 leading-snug truncate">
              @{emailToHandle(post.author?.email)}
            </span>
            <span className="text-zinc-700 text-sm">·</span>
            <span className="text-xs text-zinc-500 shrink-0">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>

          {/* Content */}
          <PostContent text={post.content} />

          {/* Actions */}
          <PostActions
            post={post}
            onUpdate={onUpdate}
            onReplyClick={() => setReplyOpen((o) => !o)}
          />
        </div>

        {/* Options menu (own posts only) */}
        {isOwn && (
          <div className="relative shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
              className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              aria-label="Post options"
            >
              <DotsIcon />
            </button>

            {menuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 top-8 z-20 w-44 bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl overflow-hidden">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                  >
                    <TrashIcon />
                    {isDeleting ? "Deleting…" : "Delete post"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Inline reply box */}
      {replyOpen && (
        <div
          className="mt-3 ml-[52px] border-t border-zinc-800 pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          <ComposeBox
            currentUser={currentUser}
            placeholder="Write a reply…"
            compact
            onSubmit={async (content) => {
              const res = await createReply(post.id, content);
              // Bump reply count optimistically
              onUpdate({ ...post, reply_count: (post.reply_count ?? 0) + 1 });
              return res.reply;
            }}
            onPostCreated={() => setReplyOpen(false)}
          />
        </div>
      )}
    </article>
  );
}
