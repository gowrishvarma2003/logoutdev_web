"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useFeed } from "@/lib/hooks/useFeed";
import PostList from "@/components/feed/PostList";

export default function ExplorePage() {
  const { user } = useAuth();
  const feed = useFeed("explore");

  if (!user) return null;

  return (
    <div>
      {/* ── Page header ── */}
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-4 py-4">
        <h1 className="text-[17px] font-bold text-white">Explore</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Discover what developers are building
        </p>
      </header>

      {/* ── Post list ── */}
      <PostList
        posts={feed.posts}
        currentUser={user}
        isLoading={feed.isLoading}
        isLoadingMore={feed.isLoadingMore}
        nextCursor={feed.nextCursor}
        error={feed.error}
        onUpdate={feed.updatePost}
        onDelete={feed.removePost}
        onLoadMore={feed.loadMore}
        emptyMessage="No posts yet. Be the first to share what you're building!"
      />
    </div>
  );
}
