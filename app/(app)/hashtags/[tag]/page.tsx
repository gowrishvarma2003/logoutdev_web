"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPostsByHashtag } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Post, RelatedHashtag } from "@/lib/types";
import PostCard from "@/components/feed/PostCard";
import Spinner from "@/components/ui/Spinner";
import { ArrowLeftIcon } from "@/components/ui/Icons";

interface HashtagPageProps {
  params: Promise<{ tag: string }>;
}

export default function HashtagPage({ params }: HashtagPageProps) {
  const { tag } = use(params);
  const normalizedTag = decodeURIComponent(tag).toLowerCase();
  const { user } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [relatedTags, setRelatedTags] = useState<RelatedHashtag[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getPostsByHashtag(normalizedTag);
        if (cancelled) return;
        setPosts(res.posts);
        setRelatedTags(res.related_tags);
        setNextCursor(res.nextCursor);
      } catch {
        if (cancelled) return;
        setError("Failed to load hashtag feed.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [normalizedTag]);

  async function loadMore() {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await getPostsByHashtag(normalizedTag, nextCursor);
      setPosts((prev) => [...prev, ...res.posts]);
      setNextCursor(res.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (!user) return null;

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border-default bg-app/80 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="rounded-full p-1.5 text-text-muted transition-colors hover:bg-surface-hover"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[17px] font-bold text-text-primary">#{normalizedTag}</h1>
          <p className="text-xs text-text-disabled">Hashtag feed</p>
        </div>
      </header>

      {relatedTags.length > 0 && (
        <section className="border-b border-border-default px-4 py-3">
          <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-text-disabled">
            Related tags
          </p>
          <div className="flex flex-wrap gap-2">
            {relatedTags.map((item) => (
              <Link
                key={item.normalized_tag}
                href={`/hashtags/${item.normalized_tag}`}
                className="rounded-full border border-border-strong px-3 py-1 text-xs text-sky-300 transition-colors hover:bg-surface-hover"
              >
                #{item.tag}
              </Link>
            ))}
          </div>
        </section>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-text-disabled">{error}</p>
        </div>
      )}

      {!isLoading && !error && posts.length === 0 && (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-text-disabled">No posts use this hashtag yet.</p>
        </div>
      )}

      {!isLoading && !error && posts.length > 0 && (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              onUpdate={(updated) =>
                setPosts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
              }
              onDelete={(id) => setPosts((prev) => prev.filter((item) => item.id !== id))}
            />
          ))}

          {nextCursor && (
            <div className="flex justify-center py-6">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="rounded-full border border-border-strong px-5 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-60"
              >
                {isLoadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
