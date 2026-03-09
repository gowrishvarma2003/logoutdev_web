"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type {
  NotificationItem,
  NotificationSummary,
  SuggestedAction,
} from "../types";
import {
  getNotificationSummary,
  listNotifications,
  readAllNotifications,
  readNotification,
} from "../api";

export type NotificationTab = "needs-action" | "unread" | "all";

const REFRESH_EVENT = "notifications:changed";

export function broadcastNotificationChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REFRESH_EVENT));
  }
}

export function useNotificationSummary(enabled = true) {
  const pathname = usePathname();
  const [summary, setSummary] = useState<NotificationSummary>({
    unread_count: 0,
    needs_action_count: 0,
    recent: [],
  });
  const [loading, setLoading] = useState(Boolean(enabled));

  const refresh = useCallback(async () => {
    if (!enabled) {
      setSummary({ unread_count: 0, needs_action_count: 0, recent: [] });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getNotificationSummary();
      setSummary(data);
    } catch {
      setSummary({ unread_count: 0, needs_action_count: 0, recent: [] });
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  useEffect(() => {
    if (!enabled) return;

    const handleFocus = () => {
      refresh();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener(REFRESH_EVENT, handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = window.setInterval(refresh, 60000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(REFRESH_EVENT, handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(interval);
    };
  }, [enabled, refresh]);

  return { summary, loading, refresh };
}

export function useNotificationsInbox(tab: NotificationTab) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (cursor?: string | null) => {
      const isInitial = !cursor;
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const response = await listNotifications({ tab, cursor: cursor || undefined, limit: 20 });
        setItems((current) =>
          isInitial ? response.notifications : [...current, ...response.notifications]
        );
        setSuggestedActions((current) =>
          isInitial ? response.suggested_actions : current
        );
        setNextCursor(response.next_cursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load notifications.");
      } finally {
        if (isInitial) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [tab]
  );

  useEffect(() => {
    setItems([]);
    setSuggestedActions([]);
    setNextCursor(null);
    load();
  }, [load, tab]);

  const markOneRead = useCallback(async (notificationId: string) => {
    await readNotification(notificationId);
    setItems((current) =>
      current.map((item) =>
        item.id === notificationId
          ? { ...item, read_at: item.read_at || new Date().toISOString() }
          : item
      )
    );
    broadcastNotificationChange();
  }, []);

  const markVisibleRead = useCallback(async () => {
    await readAllNotifications(tab);
    setItems((current) =>
      current.map((item) => ({
        ...item,
        read_at: item.read_at || new Date().toISOString(),
      }))
    );
    broadcastNotificationChange();
  }, [tab]);

  const loadMore = useCallback(() => {
    if (nextCursor && !loadingMore) {
      load(nextCursor);
    }
  }, [load, loadingMore, nextCursor]);

  const refetch = useCallback(() => {
    setItems([]);
    setSuggestedActions([]);
    setNextCursor(null);
    load();
  }, [load]);

  return {
    items,
    suggestedActions,
    nextCursor,
    loading,
    loadingMore,
    error,
    loadMore,
    markOneRead,
    markVisibleRead,
    refetch,
  };
}
