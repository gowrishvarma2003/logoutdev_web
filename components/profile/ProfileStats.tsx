"use client";

/**
 * ProfileStats — Enhanced stats visualization with icons, abbreviated numbers,
 * growth indicators, tooltips, and clickable navigation.
 * Optimized with React.memo to prevent unnecessary re-renders
 */

import { useState, memo } from "react";
import Link from "next/link";
import type { ProfileStats as ProfileStatsType } from "@/lib/types";
import {
  UsersIcon,
  FolderIcon,
  DocumentTextIcon,
  UserIcon,
  TrendingUpIcon,
} from "@/components/ui/Icons";

interface ProfileStatsProps {
  stats: ProfileStatsType;
  username: string;
}

interface StatItemProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  href?: string;
  growth?: number;
  tooltip?: string;
}

/**
 * Abbreviate large numbers (1200 -> 1.2K, 1500000 -> 1.5M)
 */
function abbreviateNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return String(value);
}

/**
 * StatItem component - memoized to prevent unnecessary re-renders
 */
const StatItem = memo(function StatItem({
  value,
  label,
  icon,
  href,
  growth,
  tooltip,
}: StatItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const abbrevValue = abbreviateNumber(value);

  const content = (
    <div
      className="flex flex-col items-start gap-2 sm:gap-2.5 p-2.5 sm:p-4 rounded-lg border border-zinc-800/50 bg-zinc-950/30 hover:bg-zinc-900/50 transition-colors cursor-pointer group relative min-h-[100px] sm:min-h-auto"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Icon and value row */}
      <div className="flex items-center gap-2 sm:gap-3 w-full min-h-[44px]">
        <div className="text-zinc-400 group-hover:text-zinc-300 transition-colors flex-shrink-0">
          {icon}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-base sm:text-lg font-bold text-white tabular-nums break-words">
            {abbrevValue}
          </span>
          <span className="text-xs text-zinc-500 font-medium truncate">{label}</span>
        </div>
      </div>

      {/* Growth indicator */}
      {growth !== undefined && growth > 0 && (
        <div className="flex items-center gap-1 text-xs text-emerald-400 flex-shrink-0">
          <TrendingUpIcon className="w-3 h-3 flex-shrink-0" />
          <span className="whitespace-nowrap">↑ {growth}% this week</span>
        </div>
      )}

      {/* Tooltip on hover */}
      {showTooltip && tooltip && (
        <div className="absolute bottom-full left-0 mb-2 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 whitespace-nowrap z-10">
          {tooltip}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
});

export default memo(function ProfileStats({
  stats,
  username,
}: ProfileStatsProps) {
  // Mock growth data for demonstration
  const mockGrowth = {
    followers: 12,
    following: 8,
    posts: 5,
    projects: 3,
  };

  const statItems = [
    {
      value: stats.followers,
      label: "Followers",
      icon: <UsersIcon className="w-5 h-5" />,
      href: `/@${username}/followers`,
      growth: mockGrowth.followers,
      tooltip: `${stats.followers.toLocaleString()} followers`,
    },
    {
      value: stats.following,
      label: "Following",
      icon: <UserIcon className="w-5 h-5" />,
      href: `/@${username}/following`,
      growth: mockGrowth.following,
      tooltip: `Following ${stats.following.toLocaleString()} people`,
    },
    {
      value: stats.posts_count,
      label: "Posts",
      icon: <DocumentTextIcon className="w-5 h-5" />,
      href: `/@${username}/posts`,
      growth: mockGrowth.posts,
      tooltip: `${stats.posts_count.toLocaleString()} posts`,
    },
    {
      value:
        stats.projects_created_count + stats.projects_contributed_count,
      label: "Projects",
      icon: <FolderIcon className="w-5 h-5" />,
      href: `/@${username}/projects`,
      growth: mockGrowth.projects,
      tooltip: `${(
        stats.projects_created_count + stats.projects_contributed_count
      ).toLocaleString()} projects`,
    },
  ];

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 border-y border-zinc-800">
      {/* Desktop: Horizontal layout (4 items in a row) */}
      <div className="hidden md:grid grid-cols-4 gap-2 sm:gap-3">
        {statItems.map((item) => (
          <StatItem key={item.label} {...item} />
        ))}
      </div>

      {/* Mobile: 2x2 grid layout */}
      <div className="md:hidden grid grid-cols-2 gap-2 sm:gap-3">
        {statItems.map((item) => (
          <StatItem key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
});
