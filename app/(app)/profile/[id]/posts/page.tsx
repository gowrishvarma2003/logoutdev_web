"use client";

/**
 * Profile posts page — /profile/:id/posts
 * Shows all posts (not replies) authored by this user.
 */

import { use, useState, useCallback } from "react";
import { useProfilePosts } from "@/lib/hooks/useProfile";
import { useAuth } from "@/lib/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import PostCard from "@/components/feed/PostCard";
import type { Post } from "@/lib/types";

interface ProfilePostsPageProps {
  params: Promise<{ id: string }>;
}

export default function ProfilePostsPage({ params }: ProfilePostsPageProps) {
  const { id: username } = use(params);
  const [page, setPage] = useState(1);
  const { user: currentUser } = useAuth();

  const { posts: initialPosts, total, loading, error } = useProfilePosts(username, page);
  // Local override list so like/delete mutations feel instant
  const [localPosts, setLocalPosts] = useState<Post[] | null>(null);
  const posts = localPosts ?? initialPosts;

  const handleUpdate = useCallback((updated: Post) => {
    setLocalPosts((prev) =>
      (prev ?? initialPosts).map((p) => (p.id === updated.id ? updated : p))
    );
  }, [initialPosts]);

  const handleDelete = useCallback((id: string) => {
    setLocalPosts((prev) => (prev ?? initialPosts).filter((p) => p.id !== id));
  }, [initialPosts]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-rose-400 text-sm">{error}</p>
      </div>
    );
  }

  if (posts.length === 0 || !currentUser) {
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-zinc-600 text-sm">No posts yet.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUser={currentUser}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 px-5 py-5">
          <button
            onClick={() => { setPage((p) => Math.max(1, p - 1)); setLocalPosts(null); }}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); setLocalPosts(null); }}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

