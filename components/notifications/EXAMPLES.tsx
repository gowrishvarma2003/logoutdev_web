/**
 * Badge Notifications - Usage Examples
 *
 * This file demonstrates how to use the badge earned notification system
 * in your LogoutDev application.
 */

import { useBadgeNotifications } from "@/lib/hooks/useBadgeNotifications";

/**
 * Example 1: Basic usage in a component
 */
export function BasicExample() {
  const { showBadgeEarned } = useBadgeNotifications();

  const handleEarnBadge = () => {
    showBadgeEarned({
      name: "First Launch",
      emoji: "🚀",
      description: "Launched your first project!",
    });
  };

  return <button onClick={handleEarnBadge}>Earn Badge</button>;
}

/**
 * Example 2: Multiple badges in sequence
 */
export function SequentialBadgesExample() {
  const { showBadgeEarned } = useBadgeNotifications();

  const handleCompleteChallenge = async () => {
    // Show first badge
    showBadgeEarned({
      name: "Challenge Started",
      emoji: "🎯",
      description: "You started a new challenge!",
    });

    // Stagger subsequent badges
    setTimeout(() => {
      showBadgeEarned({
        name: "Halfway There",
        emoji: "⏳",
        description: "50% of the challenge complete!",
      });
    }, 2000);

    setTimeout(() => {
      showBadgeEarned({
        name: "Challenge Complete",
        emoji: "✅",
        description: "You completed the challenge!",
      });
    }, 4000);
  };

  return <button onClick={handleCompleteChallenge}>Complete Challenge</button>;
}

/**
 * Example 3: Badge earned from API response
 */
export function APIBadgeExample() {
  const { showBadgeEarned } = useBadgeNotifications();

  const handleLaunchProject = async () => {
    try {
      const response = await fetch("/api/projects/launch", {
        method: "POST",
        body: JSON.stringify({ name: "My Project" }),
      });

      const data = await response.json();

      // Check if any badges were earned
      if (data.badges && data.badges.length > 0) {
        for (const badge of data.badges) {
          showBadgeEarned({
            id: badge.id,
            name: badge.name,
            emoji: badge.emoji,
            description: badge.description,
          });
        }
      }

      // Show success message or update UI
      console.log("Project launched successfully!");
    } catch (error) {
      console.error("Failed to launch project:", error);
    }
  };

  return <button onClick={handleLaunchProject}>Launch Project</button>;
}

/**
 * Example 4: Common badges
 */
export const COMMON_BADGES = {
  firstLaunch: {
    name: "First Launch",
    emoji: "🚀",
    description: "Launched your first project!",
  },
  expertDeveloper: {
    name: "Expert Developer",
    emoji: "💻",
    description: "Reached expert level in 3 skills!",
  },
  teamPlayer: {
    name: "Team Player",
    emoji: "🤝",
    description: "Collaborated with 10 developers!",
  },
  sevenDayStreak: {
    name: "7-Day Streak",
    emoji: "🔥",
    description: "Logged in every day this week!",
  },
  earlyAdopter: {
    name: "Early Adopter",
    emoji: "⭐",
    description: "You were one of the first to join!",
  },
  hundredPointsMilestone: {
    name: "100 Points",
    emoji: "💯",
    description: "Earned 100 achievement points!",
  },
  skillMaster: {
    name: "Skill Master",
    emoji: "🎓",
    description: "Mastered your first skill!",
  },
  communityContributor: {
    name: "Community Contributor",
    emoji: "🌟",
    description: "Made your first contribution to the community!",
  },
  speedRunner: {
    name: "Speed Runner",
    emoji: "⚡",
    description: "Completed a project in record time!",
  },
  creativeGenius: {
    name: "Creative Genius",
    emoji: "🎨",
    description: "Created an innovative project!",
  },
};

/**
 * Example 5: Using predefined badges
 */
export function PredefinedBadgesExample() {
  const { showBadgeEarned } = useBadgeNotifications();

  const handleEarnFirstLaunchBadge = () => {
    showBadgeEarned(COMMON_BADGES.firstLaunch);
  };

  const handleEarnTeamPlayerBadge = () => {
    showBadgeEarned(COMMON_BADGES.teamPlayer);
  };

  return (
    <div className="flex gap-2">
      <button onClick={handleEarnFirstLaunchBadge}>Earn First Launch</button>
      <button onClick={handleEarnTeamPlayerBadge}>Earn Team Player</button>
    </div>
  );
}

/**
 * Example 6: Hook integration in a custom service
 */
export function useProjectService() {
  const { showBadgeEarned } = useBadgeNotifications();

  const createProject = async (name: string) => {
    const project = { id: Date.now(), name, createdAt: new Date() };

    // Show badge if it's their first project
    const projectCount = 1; // In real app, fetch this from API
    if (projectCount === 1) {
      showBadgeEarned(COMMON_BADGES.firstLaunch);
    }

    return project;
  };

  const completeChallenge = async (challengeId: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Show badge
    showBadgeEarned({
      name: "Challenge Master",
      emoji: "🏅",
      description: `Completed challenge ${challengeId}!`,
    });
  };

  return { createProject, completeChallenge };
}

/**
 * Example 7: Root layout integration
 *
 * Add this to your app/layout.tsx or app/RootLayout.tsx:
 *
 * ```tsx
 * import { useBadgeNotifications } from "@/lib/hooks/useBadgeNotifications";
 * import { BadgeNotificationContainer } from "@/components/notifications";
 *
 * export default function RootLayout({
 *   children,
 * }: {
 *   children: React.ReactNode;
 * }) {
 *   const { badges, removeBadge } = useBadgeNotifications();
 *
 *   return (
 *     <html lang="en">
 *       <body>
 *         {children}
 *         <BadgeNotificationContainer badges={badges} onRemove={removeBadge} />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */

/**
 * Example 8: Error handling with badges
 */
export function ErrorHandlingExample() {
  const { showBadgeEarned } = useBadgeNotifications();

  const handleRiskyOperation = async () => {
    try {
      // Perform some operation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success badge
      showBadgeEarned({
        name: "Success",
        emoji: "✅",
        description: "Operation completed successfully!",
      });
    } catch (error) {
      // Show error badge instead
      showBadgeEarned({
        name: "Oops!",
        emoji: "⚠️",
        description: "Something went wrong. Try again!",
      });
    }
  };

  return <button onClick={handleRiskyOperation}>Try Operation</button>;
}

/**
 * Example 9: Badge with specific ID tracking
 */
export function BadgeTrackingExample() {
  const { showBadgeEarned } = useBadgeNotifications();
  const earnedBadgeIds = new Set<string>();

  const handleMilestone = (milestoneId: string) => {
    if (earnedBadgeIds.has(milestoneId)) {
      console.log("Badge already earned!");
      return;
    }

    earnedBadgeIds.add(milestoneId);

    showBadgeEarned({
      id: milestoneId,
      name: `Milestone ${milestoneId}`,
      emoji: "🎯",
      description: "You've reached a new milestone!",
    });
  };

  return <button onClick={() => handleMilestone("m1")}>Reach Milestone</button>;
}

/**
 * Example 10: Dynamic badge generation
 */
function generateBadge(type: string, value?: string | number) {
  const templates: Record<string, { emoji: string; description: (v?: string | number) => string }> = {
    skill_level: {
      emoji: "🎓",
      description: (level) => `Reached level ${level} in a new skill!`,
    },
    achievement_points: {
      emoji: "💯",
      description: (points) => `Earned ${points} achievement points!`,
    },
    collaboration: {
      emoji: "🤝",
      description: (count) => `Collaborated with ${count} developers!`,
    },
    streak: {
      emoji: "🔥",
      description: (days) => `${days}-day activity streak!`,
    },
  };

  const template = templates[type];
  if (!template) return null;

  return {
    name: type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    emoji: template.emoji,
    description: template.description(value),
  };
}

export function DynamicBadgeExample() {
  const { showBadgeEarned } = useBadgeNotifications();

  const handleAchievement = (type: string, value?: string | number) => {
    const badge = generateBadge(type, value);
    if (badge) {
      showBadgeEarned(badge);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={() => handleAchievement("skill_level", 5)}>
        Level 5 Skill
      </button>
      <button onClick={() => handleAchievement("achievement_points", 500)}>
        500 Points
      </button>
      <button onClick={() => handleAchievement("collaboration", 10)}>
        10 Collaborators
      </button>
      <button onClick={() => handleAchievement("streak", 7)}>
        7-Day Streak
      </button>
    </div>
  );
}
