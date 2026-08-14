"use client";

import BadgeEarnedToast from "./BadgeEarnedToast";
import type { BadgeData } from "./BadgeEarnedToast";

interface QueuedBadge extends BadgeData {
  toastId: string;
}

interface BadgeNotificationContainerProps {
  badges: QueuedBadge[];
  onRemove: (toastId: string) => void;
}

export default function BadgeNotificationContainer({
  badges,
  onRemove,
}: BadgeNotificationContainerProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Stack badges from bottom-right, staggered vertically */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-3 pointer-events-auto">
        {badges.map((badge, index) => (
          <div key={badge.toastId} style={{ marginTop: `${index * 20}px` }}>
            <BadgeEarnedToast
              badge={badge}
              onClose={() => onRemove(badge.toastId)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
