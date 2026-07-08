"use client";

import { useState } from "react";
import { likePost, unlikePost, repostPost, undoRepost } from "@/lib/api";
import type { Post } from "@/lib/types";
import { HeartIcon, ChatIcon, RepeatIcon } from "@/components/ui/Icons";

interface PostActionsProps {
  post: Post;
  onUpdate: (updated: Post) => void;
  onReplyClick?: () => void;
}

export default function PostActions({ post, onUpdate, onReplyClick }: PostActionsProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);

    // Optimistic update
    const wasLiked = post.is_liked_by_me;
    const optimistic: Post = {
      ...post,
      is_liked_by_me: !wasLiked,
      like_count: post.like_count + (wasLiked ? -1 : 1),
    };
    onUpdate(optimistic);

    try {
      if (wasLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch {
      // Revert on failure
      onUpdate(post);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReposting) return;
    setIsReposting(true);

    const wasReposted = post.is_reposted_by_me;
    const optimistic: Post = {
      ...post,
      is_reposted_by_me: !wasReposted,
      repost_count: post.repost_count + (wasReposted ? -1 : 1),
    };
    onUpdate(optimistic);

    try {
      if (wasReposted) {
        await undoRepost(post.id);
      } else {
        await repostPost(post.id);
      }
    } catch {
      onUpdate(post);
    } finally {
      setIsReposting(false);
    }
  };

  return (
    <div className="flex items-center gap-5 mt-3 -ml-1.5">
      {/* Reply */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onReplyClick?.();
        }}
        className="group flex items-center gap-1.5 text-text-disabled hover:text-sky-400 transition-colors"
        aria-label="Reply"
      >
        <span className="p-1.5 rounded-full group-hover:bg-sky-500/10 transition-colors">
          <ChatIcon />
        </span>
        <span className="text-xs tabular-nums">{post.reply_count ?? 0}</span>
      </button>

      {/* Like */}
      <button
        onClick={handleLike}
        disabled={isLiking}
        className={`group flex items-center gap-1.5 transition-colors ${
          post.is_liked_by_me
            ? "text-rose-400"
            : "text-text-disabled hover:text-rose-400"
        }`}
        aria-label={post.is_liked_by_me ? "Unlike" : "Like"}
      >
        <span
          className={`p-1.5 rounded-full transition-colors ${
            post.is_liked_by_me ? "bg-rose-500/10" : "group-hover:bg-rose-500/10"
          }`}
        >
          <HeartIcon filled={!!post.is_liked_by_me} />
        </span>
        <span className="text-xs tabular-nums">{post.like_count ?? 0}</span>
      </button>

      {/* Repost */}
      <button
        onClick={handleRepost}
        disabled={isReposting}
        className={`group flex items-center gap-1.5 transition-colors ${
          post.is_reposted_by_me
            ? "text-emerald-400"
            : "text-text-disabled hover:text-emerald-400"
        }`}
        aria-label={post.is_reposted_by_me ? "Undo repost" : "Repost"}
      >
        <span
          className={`p-1.5 rounded-full transition-colors ${
            post.is_reposted_by_me
              ? "bg-emerald-500/10"
              : "group-hover:bg-emerald-500/10"
          }`}
        >
          <RepeatIcon />
        </span>
        <span className="text-xs tabular-nums">{post.repost_count ?? 0}</span>
      </button>
    </div>
  );
}
