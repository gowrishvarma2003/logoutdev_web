"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useFeed } from "@/lib/hooks/useFeed";
import PostList from "@/components/feed/PostList";

export default function ExplorePage() {
  const { user } = useAuth();
  const feed = useFeed("explore", Boolean(user));

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-[17px] font-bold text-white">Explore</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Discover what developers are building
        </p>
      </header>

      {user ? (
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
      ) : (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-zinc-400">Sign in to browse the explore feed and interact with builders.</p>
        </div>
      )}
    </div>
  );
}
