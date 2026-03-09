"use client";

/**
 * ProfileStats — horizontal stats bar (followers, posts, projects created/contributed).
 */

import type { ProfileStats as ProfileStatsType } from "@/lib/types";

interface ProfileStatsProps {
  stats: ProfileStatsType;
  username: string;
}

interface StatItemProps {
  value: number;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="flex flex-col items-center text-center min-w-0">
      <span className="text-[17px] font-bold text-white tabular-nums">
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </span>
      <span className="text-[11px] text-zinc-500 mt-0.5 whitespace-nowrap font-medium">
        {label}
      </span>
    </div>
  );
}

export default function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <div className="px-5 py-4 border-y border-zinc-800">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <StatItem value={stats.followers} label="Followers" />
        <StatItem value={stats.posts_count} label="Posts" />
        <StatItem value={stats.launches_published_count} label="Launches" />
        <StatItem value={stats.freelance_wins_count} label="Wins" />
        <StatItem value={stats.projects_created_count + stats.projects_contributed_count} label="Spaces" />
        <StatItem value={stats.launch_reviews_received_count + stats.updates_posted_count} label="Signals" />
      </div>
    </div>
  );
}
