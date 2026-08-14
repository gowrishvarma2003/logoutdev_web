"use client";

import { useCallback, useState } from "react";
import type { BadgeData } from "@/components/notifications/BadgeEarnedToast";

interface QueuedBadge extends BadgeData {
  toastId: string;
}

export function useBadgeNotifications() {
  const [badges, setBadges] = useState<QueuedBadge[]>([]);

  const showBadgeEarned = useCallback((badge: BadgeData) => {
    const toastId = `badge-${Date.now()}-${Math.random()}`;
    const queuedBadge: QueuedBadge = {
      ...badge,
      toastId,
    };

    setBadges((prev) => [...prev, queuedBadge]);

    // Auto-remove from queue after dismiss (5 seconds + 300ms animation)
    const timer = setTimeout(() => {
      removeBadge(toastId);
    }, 5300);

    return () => clearTimeout(timer);
  }, []);

  const removeBadge = useCallback((toastId: string) => {
    setBadges((prev) => prev.filter((b) => b.toastId !== toastId));
  }, []);

  return {
    badges,
    showBadgeEarned,
    removeBadge,
  };
}
