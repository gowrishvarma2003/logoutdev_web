"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { followUser, unfollowUser } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";

interface FollowButtonProps {
  userId: string;
  initialFollowing?: boolean;
  initialFollowerCount?: number;
  isMe?: boolean;
  onChange?: (next: { following: boolean; followerCount: number }) => void;
  size?: "sm" | "md";
}

function formatCount(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

export default function FollowButton({
  userId,
  initialFollowing = false,
  initialFollowerCount = 0,
  isMe = false,
  onChange,
  size = "md",
}: FollowButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFollowing(initialFollowing);
    setFollowerCount(initialFollowerCount);
  }, [userId, initialFollowing, initialFollowerCount]);

  if (isMe || user?.id === userId) return null;

  const handleClick = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    const previousFollowing = following;
    const previousCount = followerCount;
    const optimisticFollowing = !following;
    const optimisticCount = Math.max(0, followerCount + (optimisticFollowing ? 1 : -1));

    setFollowing(optimisticFollowing);
    setFollowerCount(optimisticCount);
    setLoading(true);

    try {
      const result = optimisticFollowing ? await followUser(userId) : await unfollowUser(userId);
      const nextCount = typeof result.follower_count === "number" ? result.follower_count : optimisticCount;
      setFollowing(result.following);
      setFollowerCount(nextCount);
      onChange?.({ following: result.following, followerCount: nextCount });
    } catch {
      setFollowing(previousFollowing);
      setFollowerCount(previousCount);
      onChange?.({ following: previousFollowing, followerCount: previousCount });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`shrink-0 rounded-xl border font-semibold transition-colors disabled:opacity-60 ${
        following
          ? "border-border-strong bg-surface text-text-secondary hover:bg-surface-hover"
          : "border-sky-500/40 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
      } ${size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"}`}
    >
      {following ? "Following" : "Follow"}
      {followerCount > 0 ? <span className="ml-1.5 text-text-muted">{formatCount(followerCount)}</span> : null}
    </button>
  );
}
