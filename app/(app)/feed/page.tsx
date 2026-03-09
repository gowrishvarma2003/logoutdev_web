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

  const feed = useFeed("feed");

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
    feed.addPost(post);
    if (linkedEntity) {
      router.replace("/feed");
    }
  };

  return (
    <div>
      {/* ── Page header ── */}
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="px-4 pt-4 pb-0">
          <h1 className="text-[17px] font-bold text-white">Home</h1>
        </div>

        {/* Tab bar */}
        <div className="flex mt-3">
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

      {/* ── Compose box ── */}
      <ComposeBox
        currentUser={user}
        onPostCreated={handlePostCreated}
        initialLinkedEntity={linkedEntity}
        linkedEntityType={linkedEntityType}
        linkedEntityId={linkedEntityId}
        onClearLinkedEntity={() => router.replace("/feed")}
      />

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
        emptyMessage="Follow some developers to see their posts here, or check Explore."
      />
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
      className={`flex-1 py-3 text-sm font-medium relative transition-colors ${
        active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 inset-x-[30%] h-[2px] rounded-full bg-white" />
      )}
    </button>
  );
}
