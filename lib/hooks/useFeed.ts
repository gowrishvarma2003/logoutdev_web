"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Post } from "../types";
import { getFeed, getExplore } from "../api";

type FeedType = "feed" | "explore";

/**
 * Fetches and manages a paginated list of posts.
 * Exposes helpers to add, update, or remove a single post (for optimistic updates).
 */
export function useFeed(type: FeedType) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Prevent double-fetch in React strict mode
  const hasFetched = useRef(false);

  const fetchPage = useCallback(
    async (cursor?: string) => {
      const isInitial = !cursor;
      isInitial ? setIsLoading(true) : setIsLoadingMore(true);
      setError(null);

      try {
        const fn = type === "feed" ? getFeed : getExplore;
        const data = await fn(cursor);

        setPosts((prev) => (isInitial ? data.posts : [...prev, ...data.posts]));
        setNextCursor(data.nextCursor);
      } catch {
        setError("Failed to load posts. Please try again.");
      } finally {
        isInitial ? setIsLoading(false) : setIsLoadingMore(false);
      }
    },
    [type]
  );

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchPage();
    }
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (nextCursor && !isLoadingMore) fetchPage(nextCursor);
  }, [nextCursor, isLoadingMore, fetchPage]);

  /** Prepend a newly created post to the top of the list. */
  const addPost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  /** Replace a post with an updated version (e.g. after like/repost). */
  const updatePost = useCallback((updated: Post) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  /** Remove a post from the list (e.g. after deletion). */
  const removePost = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const refresh = useCallback(() => {
    hasFetched.current = false;
    fetchPage();
  }, [fetchPage]);

  return {
    posts,
    isLoading,
    isLoadingMore,
    nextCursor,
    error,
    loadMore,
    addPost,
    updatePost,
    removePost,
    refresh,
  };
}
