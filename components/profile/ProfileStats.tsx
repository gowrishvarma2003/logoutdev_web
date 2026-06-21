"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProfileStats as ProfileStatsType } from "@/lib/types";
import FollowListModal from "@/components/profile/FollowListModal";

interface ProfileStatsProps {
  stats: ProfileStatsType;
  username: string;
  profileId: string;
  isMe: boolean;
}

interface StatItemProps {
  value: number;
  label: string;
  onClick?: () => void;
  title?: string;
}

function StatItem({ value, label, onClick, title }: StatItemProps) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      {...(onClick ? { onClick, type: "button" as const, title } : { title })}
      className={`flex flex-col items-center text-center min-w-0 px-1 ${
        onClick ? "rounded-lg py-1 hover:bg-zinc-800/60 transition-colors cursor-pointer" : "py-1"
      }`}
    >
      <span className="text-[17px] font-bold text-white tabular-nums">
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </span>
      <span className="text-[11px] text-zinc-500 mt-0.5 whitespace-nowrap font-medium">
        {label}
      </span>
    </Wrapper>
  );
}

export default function ProfileStats({ stats, username, profileId, isMe }: ProfileStatsProps) {
  const router = useRouter();
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);

  const base = `/profile/${username}`;
  const go = (path: string) => () => router.push(path);

  const spacesTotal = stats.projects_created_count + stats.projects_contributed_count;
  const freelanceTotal = stats.freelance_wins_count + stats.freelance_projects_posted_count;

  return (
    <>
      <div className="px-4 py-4 border-b border-zinc-800">
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-4 lg:grid-cols-8">
          <StatItem
            value={stats.followers}
            label="Followers"
            onClick={() => setFollowModal("followers")}
            title="View followers"
          />
          <StatItem
            value={stats.following}
            label="Following"
            onClick={() => setFollowModal("following")}
            title="View following"
          />
          <StatItem
            value={stats.posts_count}
            label="Posts"
            onClick={go(`${base}/posts`)}
            title="View posts"
          />
          <StatItem
            value={stats.launches_published_count}
            label="Launches"
            onClick={go(`${base}/launches`)}
            title="View launches"
          />
          <StatItem
            value={spacesTotal}
            label="Spaces"
            onClick={go(`${base}/projects`)}
            title="View projects"
          />
          <StatItem
            value={stats.repos_count ?? 0}
            label="Repos"
            onClick={go(`${base}/repos`)}
            title="View repos"
          />
          <StatItem
            value={stats.questions_count ?? 0}
            label="Questions"
            onClick={go(`${base}/questions`)}
            title="View questions"
          />
          <StatItem
            value={stats.freelance_wins_count}
            label="Wins"
            onClick={freelanceTotal > 0 ? go(`${base}/freelance`) : undefined}
            title="View freelance outcomes"
          />
        </div>
      </div>

      <FollowListModal
        userId={profileId}
        initialTab={followModal ?? "followers"}
        open={followModal !== null}
        onClose={() => setFollowModal(null)}
      />
    </>
  );
}
