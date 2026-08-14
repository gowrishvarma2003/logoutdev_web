"use client";

/**
 * Profile achievements page — /profile/:id/achievements
 * Shows earned and available badges with progress indicators.
 */

import { use, useMemo } from "react";
import BadgesGrid, { type Badge } from "@/components/profile/BadgesGrid";
import Spinner from "@/components/ui/Spinner";
import { SparklesIcon, AwardIcon } from "@/components/ui/Icons";

interface ProfileAchievementsPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Mock badge data - In production, this would come from an API
 */
const MOCK_BADGES: Badge[] = [
  // Earned badges
  {
    id: "first-post",
    name: "First Post",
    description: "Published your first post",
    icon: "📝",
    earned: true,
    earnedAt: "2024-01-15T10:30:00Z",
    category: "milestone",
    rarity: "common",
    points: 10,
  },
  {
    id: "week-streak",
    name: "Week Warrior",
    description: "Posted 7 days in a row",
    icon: "🔥",
    earned: true,
    earnedAt: "2024-02-01T14:22:00Z",
    category: "achievement",
    rarity: "rare",
    points: 50,
    progress: { current: 7, total: 7 },
  },
  {
    id: "hundred-followers",
    name: "Century Club",
    description: "Reached 100 followers",
    icon: "👥",
    earned: true,
    earnedAt: "2024-02-10T09:15:00Z",
    category: "milestone",
    rarity: "rare",
    points: 75,
  },
  {
    id: "verified-contributor",
    name: "Verified Contributor",
    description: "Contributed to 5 projects",
    icon: "✅",
    earned: true,
    earnedAt: "2024-02-15T16:45:00Z",
    category: "contribution",
    rarity: "epic",
    points: 100,
    progress: { current: 5, total: 5 },
  },
  {
    id: "helpful-comments",
    name: "Community Helper",
    description: "Made 50 helpful comments",
    icon: "💬",
    earned: true,
    earnedAt: "2024-02-20T11:20:00Z",
    category: "contribution",
    rarity: "rare",
    points: 60,
    progress: { current: 50, total: 50 },
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    description: "Reviewed 10 pull requests",
    icon: "👀",
    earned: true,
    earnedAt: "2024-03-01T13:30:00Z",
    category: "contribution",
    rarity: "epic",
    points: 85,
    progress: { current: 10, total: 10 },
  },

  // Available badges (not earned)
  {
    id: "month-streak",
    name: "Month Master",
    description: "Posted 30 days in a row",
    icon: "📅",
    earned: false,
    category: "achievement",
    rarity: "epic",
    points: 150,
    progress: { current: 12, total: 30 },
  },
  {
    id: "thousand-followers",
    name: "Influencer",
    description: "Reached 1000 followers",
    icon: "⭐",
    earned: false,
    category: "milestone",
    rarity: "legendary",
    points: 500,
  },
  {
    id: "tech-expert",
    name: "Tech Expert",
    description: "Mastered a tech stack (5+ posts)",
    icon: "🛠️",
    earned: false,
    category: "skill",
    rarity: "epic",
    points: 120,
    progress: { current: 3, total: 5 },
  },
  {
    id: "top-contributor",
    name: "Top Contributor",
    description: "Ranked in top 10 contributors this month",
    icon: "🏆",
    earned: false,
    category: "achievement",
    rarity: "legendary",
    points: 200,
  },
  {
    id: "bug-hunter",
    name: "Bug Hunter",
    description: "Found and reported 5 critical bugs",
    icon: "🐛",
    earned: false,
    category: "contribution",
    rarity: "epic",
    points: 100,
    progress: { current: 2, total: 5 },
  },
  {
    id: "mentor",
    name: "Mentor",
    description: "Helped 10 junior developers",
    icon: "🎓",
    earned: false,
    category: "contribution",
    rarity: "epic",
    points: 150,
    progress: { current: 4, total: 10 },
  },
  {
    id: "thought-leader",
    name: "Thought Leader",
    description: "Had a post with 500+ likes",
    icon: "💡",
    earned: false,
    category: "achievement",
    rarity: "legendary",
    points: 300,
  },
  {
    id: "first-launch",
    name: "Launch Starter",
    description: "Published your first project launch",
    icon: "🚀",
    earned: false,
    category: "milestone",
    rarity: "rare",
    points: 80,
  },
];

export default function ProfileAchievementsPage({
  params,
}: ProfileAchievementsPageProps) {
  const { id: username } = use(params);
  // In production, you would fetch badges based on username
  // const { badges, loading, error } = useProfileBadges(username);

  const loading = false;
  const error = null;

  const { earnedBadges, availableBadges, totalPoints, totalEarned } = useMemo(
    () => {
      const earned = MOCK_BADGES.filter((b) => b.earned);
      const available = MOCK_BADGES.filter((b) => !b.earned);
      const points = earned.reduce((sum, badge) => sum + (badge.points || 0), 0);

      return {
        earnedBadges: earned,
        availableBadges: available,
        totalPoints: points,
        totalEarned: earned.length,
      };
    },
    []
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-rose-400 text-sm">{error}</p>
      </div>
    );
  }

  const hasAnyBadges = earnedBadges.length > 0 || availableBadges.length > 0;

  if (!hasAnyBadges) {
    return (
      <div className="px-5 py-16 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
          <AwardIcon className="w-6 h-6 text-zinc-600" />
        </div>
        <p className="text-zinc-600 text-sm">
          No badges yet. Start earning achievements!
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 space-y-7">
      {/* ── Stats Summary ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs text-zinc-500 font-medium uppercase mb-1">
            Badges Earned
          </p>
          <p className="text-2xl font-bold text-white">
            {totalEarned}
            <span className="text-sm text-zinc-500 ml-1">
              / {MOCK_BADGES.length}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs text-zinc-500 font-medium uppercase mb-1">
            Points
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold text-amber-400">{totalPoints}</p>
            <SparklesIcon className="w-4 h-4 text-amber-400" />
          </div>
        </div>
      </div>

      {/* ── Earned Badges Section ── */}
      {earnedBadges.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-400">✓</span>
            </div>
            <h2 className="text-base font-semibold text-white">
              Earned Badges ({earnedBadges.length})
            </h2>
          </div>
          <BadgesGrid badges={earnedBadges} />
        </section>
      )}

      {/* ── Available Badges Section ── */}
      {availableBadges.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-700/40 border border-zinc-600/50 flex items-center justify-center">
              <span className="text-xs text-zinc-500">🔒</span>
            </div>
            <h2 className="text-base font-semibold text-zinc-400">
              Available Badges ({availableBadges.length})
            </h2>
            <p className="text-xs text-zinc-600 ml-auto">
              Keep contributing to unlock more!
            </p>
          </div>
          <BadgesGrid badges={availableBadges} showLocked={true} />
        </section>
      )}

      {/* ── Badge Categories Legend ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white">Rarity Levels</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
            <span className="text-zinc-400">Common</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-blue-300">Rare</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-purple-300">Epic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-amber-300">Legendary</span>
          </div>
        </div>
      </div>

      {/* ── Tips section ── */}
      <div className="rounded-xl border border-sky-900/30 bg-sky-950/20 p-4">
        <p className="text-xs text-sky-300/80 leading-relaxed">
          💡 <strong>Tip:</strong> Badges are earned by actively participating
          in the community. Keep posting, contributing, and helping others to
          unlock new achievements!
        </p>
      </div>
    </div>
  );
}
