"use client";

import type { Post, User } from "@/lib/types";
import PostCard from "./PostCard";
import Spinner from "@/components/ui/Spinner";

interface PostListProps {
  posts: Post[];
  currentUser: User;
  isLoading: boolean;
  isLoadingMore: boolean;
  nextCursor: string | null;
  error: string | null;
  onUpdate: (updated: Post) => void;
  onDelete: (id: string) => void;
  onLoadMore: () => void;
  emptyMessage?: string;
}

export default function PostList({
  posts,
  currentUser,
  isLoading,
  isLoadingMore,
  nextCursor,
  error,
  onUpdate,
  onDelete,
  onLoadMore,
  emptyMessage = "No posts yet. Be the first to post!",
}: PostListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
        <p className="text-sm text-zinc-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-medium text-sky-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
          <span className="text-2xl">✦</span>
        </div>
        <p className="text-sm text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUser={currentUser}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}

      {/* Load more */}
      {nextCursor && (
        <div className="flex justify-center py-6">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-700 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-60"
          >
            {isLoadingMore ? (
              <>
                <Spinner size="sm" />
                Loading…
              </>
            ) : (
              "Load more"
            )}
          </button>
        </div>
      )}

      {/* End of feed */}
      {!nextCursor && posts.length > 0 && (
        <p className="py-10 text-center text-xs text-zinc-700">
          You&apos;re all caught up ✦
        </p>
      )}
    </div>
  );
}
