"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFeed } from "@/lib/hooks/useFeed";
import ComposeBox from "@/components/feed/ComposeBox";
import PostList from "@/components/feed/PostList";
import type { EntityRef, Post } from "@/lib/types";

type Tab = "foryou" | "following";

export default function FeedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("foryou");

  const forYouFeed = useFeed("explore", activeTab === "foryou");
  const followingFeed = useFeed("feed", activeTab === "following");
  const activeFeed = activeTab === "foryou" ? forYouFeed : followingFeed;

  if (!user) return null;

  const linkedEntityType = searchParams.get("shareType");
  const linkedEntityId = searchParams.get("shareId");
  const linkedEntity: EntityRef | null = linkedEntityType && linkedEntityId
    ? {
        type: linkedEntityType,
        id: linkedEntityId,
        title: searchParams.get("shareTitle") || "Attached item",
        subtitle: searchParams.get("shareSubtitle") || null,
        href: searchParams.get("shareHref") || null,
      }
    : null;

  const handlePostCreated = (post: Post) => {
    forYouFeed.addPost(post);
    followingFeed.addPost(post);
    if (linkedEntity) {
      router.replace("/feed");
    }
  };

  const handlePostUpdated = (post: Post) => {
    forYouFeed.updatePost(post);
    followingFeed.updatePost(post);
  };

  const handlePostDeleted = (postId: string) => {
    forYouFeed.removePost(postId);
    followingFeed.removePost(postId);
  };

  const emptyMessage = activeTab === "foryou"
    ? "No posts yet. Check back later for updates from across the community."
    : "Follow some developers to see their posts here, or check For You.";

  return (
    <div>
      {/* ── Page Header with Pill segmented control ── */}
      <header className="sticky top-0 z-20 bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-extrabold tracking-tight text-white">Developer Feed</h1>
        </div>

        {/* Tab Buttons (Pill Control) */}
        <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800/80 p-1 rounded-full shadow-inner">
          <TabButton
            label="For You"
            active={activeTab === "foryou"}
            onClick={() => setActiveTab("foryou")}
          />
          <TabButton
            label="Following"
            active={activeTab === "following"}
            onClick={() => setActiveTab("following")}
          />
        </div>
      </header>

      {/* ── Compose Box ── */}
      <ComposeBox
        currentUser={user}
        onPostCreated={handlePostCreated}
        initialLinkedEntity={linkedEntity}
        linkedEntityType={linkedEntityType}
        linkedEntityId={linkedEntityId}
        onClearLinkedEntity={() => router.replace("/feed")}
      />

      {/* ── Post List ── */}
      <div className="divide-y divide-zinc-800/60">
        <PostList
          posts={activeFeed.posts}
          currentUser={user}
          isLoading={activeFeed.isLoading}
          isLoadingMore={activeFeed.isLoadingMore}
          nextCursor={activeFeed.nextCursor}
          error={activeFeed.error}
          onUpdate={handlePostUpdated}
          onDelete={handlePostDeleted}
          onLoadMore={activeFeed.loadMore}
          emptyMessage={emptyMessage}
        />
      </div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer select-none ${
        active
          ? "bg-zinc-800 text-white shadow-sm"
          : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}
