/**
 * RateLimitStatus - Display API rate limit status with progress bar
 * Shows current usage vs limit with color-coded progress indicator
 * Includes tier-specific limits and reset time countdown
 */

"use client";

import { useState, useEffect } from "react";

interface RateLimitStatusProps {
  used: number;
  limit: number;
  resetAt: Date;
  tier: "free" | "pro" | "enterprise";
}

// Tier configurations with different limits
const TIER_LIMITS = {
  free: {
    limit: 1000,
    color: "text-blue-400",
    badge: "bg-blue-900/30 text-blue-400 border-blue-900/50",
    progressBar:
      "bg-gradient-to-r from-blue-500 to-blue-600",
    label: "Free Tier",
  },
  pro: {
    limit: 10000,
    color: "text-purple-400",
    badge: "bg-purple-900/30 text-purple-400 border-purple-900/50",
    progressBar:
      "bg-gradient-to-r from-purple-500 to-purple-600",
    label: "Pro Tier",
  },
  enterprise: {
    limit: 100000,
    color: "text-emerald-400",
    badge: "bg-emerald-900/30 text-emerald-400 border-emerald-900/50",
    progressBar:
      "bg-gradient-to-r from-emerald-500 to-emerald-600",
    label: "Enterprise Tier",
  },
};

export default function RateLimitStatus({
  used,
  limit,
  resetAt,
  tier,
}: RateLimitStatusProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const tierConfig = TIER_LIMITS[tier];
  const percentage = (used / limit) * 100;

  // Determine progress bar color based on usage percentage
  const getProgressColor = (pct: number): string => {
    if (pct < 70) return "bg-gradient-to-r from-green-500 to-green-600"; // Green - safe
    if (pct < 90) return "bg-gradient-to-r from-yellow-500 to-yellow-600"; // Yellow - caution
    return "bg-gradient-to-r from-red-500 to-red-600"; // Red - critical
  };

  // Format remaining time until reset
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = resetAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Resets now");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h remaining`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s remaining`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [resetAt]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white">API Rate Limit</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Monitor your API usage and rate limit status
          </p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${tierConfig.badge}`}
        >
          {tierConfig.label}
        </span>
      </div>

      {/* Usage stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Current Usage
          </p>
          <p className="mt-1.5 text-2xl font-bold text-white">{used}</p>
          <p className="mt-0.5 text-xs text-zinc-600">requests used</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Limit
          </p>
          <p className="mt-1.5 text-2xl font-bold text-white">{limit}</p>
          <p className="mt-0.5 text-xs text-zinc-600">requests allowed</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-zinc-300">Usage Progress</p>
          <p className="text-sm font-semibold text-white">
            {percentage.toFixed(1)}%
          </p>
        </div>
        <div className="h-3 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getProgressColor(
              percentage
            )}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Reset countdown and warnings */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
          <p className="text-sm text-zinc-400">
            <span className="text-zinc-300 font-medium">{timeLeft}</span>
          </p>
        </div>

        {/* Usage warning */}
        {percentage >= 90 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
            <svg
              className="w-4 h-4 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-medium text-red-400">Critical</span>
          </div>
        )}
        {percentage >= 70 && percentage < 90 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <svg
              className="w-4 h-4 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-medium text-yellow-400">Warning</span>
          </div>
        )}
      </div>

      {/* Helpful info */}
      <div className="mt-4 p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
        <p className="text-xs text-zinc-400">
          💡 <span className="text-zinc-300">Tip:</span> You can upgrade your plan
          to increase your rate limits. Contact support for enterprise options.
        </p>
      </div>
    </section>
  );
}
