/**
 * BadgesGrid component
 * Displays earned and available badges in a grid layout with progress indicators
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import { memo } from "react";
import { LockIcon, CheckCircleIcon } from "@/components/ui/Icons";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  earned: boolean;
  earnedAt?: string;
  category: "achievement" | "milestone" | "skill" | "contribution";
  rarity: "common" | "rare" | "epic" | "legendary";
  progress?: {
    current: number;
    total: number;
  };
  points?: number;
}

interface BadgesGridProps {
  badges: Badge[];
  showLocked?: boolean;
}

const rarityColors = {
  common: "bg-zinc-700/30 border-zinc-600",
  rare: "bg-blue-500/20 border-blue-500/50",
  epic: "bg-purple-500/20 border-purple-500/50",
  legendary: "bg-amber-500/20 border-amber-500/50",
};

const rarityTextColors = {
  common: "text-zinc-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
};

/**
 * BadgeItem component - memoized to prevent unnecessary re-renders
 */
const BadgeItem = memo(function BadgeItem({ badge }: { badge: Badge }) {
  return (
    <div
      className={`relative group rounded-xl border p-3 sm:p-4 transition-all cursor-pointer hover:scale-105 ${
        badge.earned
          ? rarityColors[badge.rarity]
          : "bg-zinc-800/20 border-zinc-700/50 opacity-60 hover:opacity-70"
      }`}
      title={badge.description}
    >
      {/* Lock icon for unavailable badges */}
      {!badge.earned && (
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
          <LockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-600" />
        </div>
      )}

      {/* Badge icon */}
      <div className="text-3xl sm:text-4xl mb-2 text-center">
        {badge.icon}
      </div>

      {/* Badge name */}
      <h3 className="text-xs sm:text-sm font-semibold text-white text-center truncate mb-1">
        {badge.name}
      </h3>

      {/* Description */}
      <p className="text-xs text-zinc-400 text-center line-clamp-2 mb-2">
        {badge.description}
      </p>

      {/* Progress bar for multi-level badges */}
      {badge.progress && (
        <div className="mb-2">
          <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all"
              style={{
                width: `${(badge.progress.current / badge.progress.total) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-zinc-500 text-center mt-1">
            {badge.progress.current}/{badge.progress.total}
          </p>
        </div>
      )}

      {/* Rarity and points */}
      <div className="flex items-center justify-between gap-1">
        <span
          className={`text-xs font-medium capitalize ${rarityTextColors[badge.rarity]}`}
        >
          {badge.rarity}
        </span>
        {badge.points && (
          <span className="text-xs text-amber-400 font-medium">
            +{badge.points}pts
          </span>
        )}
      </div>

      {/* Earned indicator */}
      {badge.earned && (
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
          <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
        </div>
      )}

      {/* Tooltip on hover */}
      <div className="absolute left-0 right-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-xs text-white whitespace-nowrap mx-auto w-max">
          {badge.earnedAt && (
            <p className="text-zinc-400">
              Earned: {new Date(badge.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

export default memo(function BadgesGrid({ badges, showLocked = true }: BadgesGridProps) {
  const filteredBadges = showLocked
    ? badges
    : badges.filter((badge) => badge.earned);

  if (filteredBadges.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500 text-sm">No badges to display</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
      {filteredBadges.map((badge) => (
        <BadgeItem key={badge.id} badge={badge} />
      ))}
    </div>
  );
});
