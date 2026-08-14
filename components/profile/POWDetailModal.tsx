"use client";

/**
 * POWDetailModal — Detailed breakdown of a user's Proof-of-Work score
 * Shows score by category with progress bars, contributing activities, and improvement tips
 */

import {
  SparklesIcon,
  XIcon,
  RocketIcon,
  UsersIcon,
  AwardIcon,
  ClockIcon,
  CodeBracketIcon,
} from "@/components/ui/Icons";

interface POWDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  score: number;
  percentile: number;
}

// Category configuration with colors and icons
interface CategoryConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  colorBg: string;
  colorBar: string;
  ring: string;
  current: number;
  max: number;
}

// Mock data structure for breakdown
const getMockBreakdown = (score: number): Record<string, CategoryConfig> => {
  const baseMultiplier = score / 100;

  return {
    commits: {
      label: "Commits & Contributions",
      icon: <CodeBracketIcon className="w-5 h-5" />,
      color: "text-emerald-400",
      colorBg: "bg-emerald-500/10",
      colorBar: "bg-emerald-500",
      ring: "border-emerald-500/40",
      current: Math.round(32 * baseMultiplier),
      max: 32,
    },
    projects: {
      label: "Projects",
      icon: <RocketIcon className="w-5 h-5" />,
      color: "text-sky-400",
      colorBg: "bg-sky-500/10",
      colorBar: "bg-sky-500",
      ring: "border-sky-500/40",
      current: Math.round(24 * baseMultiplier),
      max: 24,
    },
    community: {
      label: "Community",
      icon: <UsersIcon className="w-5 h-5" />,
      color: "text-violet-400",
      colorBg: "bg-violet-500/10",
      colorBar: "bg-violet-500",
      ring: "border-violet-500/40",
      current: Math.round(20 * baseMultiplier),
      max: 20,
    },
    consistency: {
      label: "Consistency",
      icon: <ClockIcon className="w-5 h-5" />,
      color: "text-amber-400",
      colorBg: "bg-amber-500/10",
      colorBar: "bg-amber-500",
      ring: "border-amber-500/40",
      current: Math.round(15 * baseMultiplier),
      max: 15,
    },
    quality: {
      label: "Quality",
      icon: <AwardIcon className="w-5 h-5" />,
      color: "text-rose-400",
      colorBg: "bg-rose-500/10",
      colorBar: "bg-rose-500",
      ring: "border-rose-500/40",
      current: Math.round(9 * baseMultiplier),
      max: 9,
    },
  };
};

// Mock activities for each category
const ACTIVITIES = {
  commits: [
    { label: "Commits pushed", count: 142, icon: "📝" },
    { label: "Pull requests merged", count: 28, icon: "✓" },
    { label: "Code reviews completed", count: 54, icon: "👁️" },
  ],
  projects: [
    { label: "Projects launched", count: 5, icon: "🚀" },
    { label: "Open source contributions", count: 23, icon: "🔓" },
  ],
  community: [
    { label: "Posts created", count: 12, icon: "📢" },
    { label: "Comments shared", count: 89, icon: "💬" },
    { label: "Helpful answers", count: 34, icon: "❓" },
  ],
  consistency: [
    { label: "Contribution streak", count: 47, icon: "🔥" },
    { label: "Active days this month", count: 28, icon: "📅" },
  ],
  quality: [
    { label: "Stars received", count: 412, icon: "⭐" },
    { label: "Endorsements", count: 89, icon: "👍" },
  ],
};

// Tips for improvement
const IMPROVEMENT_TIPS = [
  "Push commits regularly to maintain a strong contribution streak",
  "Request and conduct code reviews to boost collaboration",
  "Share knowledge through posts and answers in the community",
  "Launch and maintain projects to demonstrate shipping capability",
  "Focus on code quality and best practices for higher endorsements",
];

// Circular progress component
function CircularProgress({ score, percentile }: { score: number; percentile: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashOffset = circumference - (score / 100) * circumference;

  // Determine color based on score
  let colorClass = "text-zinc-400";
  if (score >= 70) colorClass = "text-emerald-400";
  else if (score >= 50) colorClass = "text-sky-400";
  else if (score >= 30) colorClass = "text-amber-400";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle cx="60" cy="60" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-800" />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className={`transition-all duration-700 ${colorClass}`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashOffset}
            strokeLinecap="round"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-3xl font-bold ${colorClass}`}>{score}</div>
          <div className="text-xs text-zinc-500">out of 100</div>
        </div>
      </div>

      {/* Percentile info */}
      <div className="text-center">
        <p className="text-sm font-semibold text-zinc-200">Top {percentile}%</p>
        <p className="text-xs text-zinc-500">of all developers</p>
      </div>
    </div>
  );
}

// Category breakdown section
function CategorySection({ name, config }: { name: string; config: CategoryConfig }) {
  const percentage = (config.current / config.max) * 100;
  const activities = ACTIVITIES[name as keyof typeof ACTIVITIES] || [];

  return (
    <div className={`rounded-lg border ${config.ring} ${config.colorBg} p-4`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`${config.color} opacity-75`}>{config.icon}</div>
          <div>
            <h4 className={`text-sm font-semibold ${config.color}`}>{config.label}</h4>
            <p className="text-xs text-zinc-500">{config.current} of {config.max} points</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.colorBar} rounded-full transition-all duration-700`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Activities list */}
      <div className="space-y-2">
        {activities.map((activity, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-sm">{activity.icon}</span>
              <span className="text-zinc-400">{activity.label}</span>
            </div>
            <span className={`font-semibold tabular-nums ${config.color}`}>{activity.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function POWDetailModal({
  isOpen,
  onClose,
  username,
  score,
  percentile,
}: POWDetailModalProps) {
  const breakdown = getMockBreakdown(score);
  const categories = Object.entries(breakdown);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl my-8">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                <SparklesIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-100">Proof-of-Work Score</h2>
                <p className="text-sm text-zinc-500">Detailed breakdown for @{username}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200"
              aria-label="Close modal"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Top section: Circular progress + categories grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
              {/* Left: Circular progress */}
              <div className="flex justify-center lg:justify-start">
                <CircularProgress score={score} percentile={percentile} />
              </div>

              {/* Right: Quick stats */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                    <div className="text-xs text-zinc-500 mb-1">Total Score</div>
                    <div className="text-2xl font-bold text-zinc-100">{score}/100</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                    <div className="text-xs text-zinc-500 mb-1">Percentile</div>
                    <div className="text-2xl font-bold text-emerald-400">Top {percentile}%</div>
                  </div>
                </div>

                {/* Category mini summary */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                    Category Breakdown
                  </h3>
                  {categories.map(([key, config]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`${config.color} flex-shrink-0`}>{config.icon}</span>
                        <span className="text-zinc-400 truncate">{config.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className={`h-full ${config.colorBar}`}
                            style={{ width: `${(config.current / config.max) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold tabular-nums ${config.color} flex-shrink-0`}>
                          {config.current}/{config.max}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Detailed category sections */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-4">Score Breakdown by Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(([key, config]) => (
                  <CategorySection key={key} name={key} config={config} />
                ))}
              </div>
            </div>

            {/* How to improve section */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AwardIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-amber-100 mb-2">How to Improve Your Score</h4>
                  <ul className="space-y-1.5">
                    {IMPROVEMENT_TIPS.map((tip, idx) => (
                      <li key={idx} className="text-sm text-amber-50/80 flex items-start gap-2">
                        <span className="text-amber-400 flex-shrink-0 mt-1">→</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="text-xs text-zinc-500 text-center py-2 border-t border-zinc-800 pt-4">
              <p>Score is calculated based on activity over the last 30 days. Last updated just now.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
