/**
 * StorageUsageBreakdown - Display storage usage breakdown with visual representation
 * Shows categorized storage usage (Images, Documents, Code, Other)
 * Displays a stacked progress bar with percentage breakdown and total usage
 */

"use client";

import { useMemo } from "react";

interface StorageUsageBreakdownProps {
  usage: {
    images: number; // bytes
    documents: number;
    code: number;
    other: number;
  };
  limit: number; // total bytes available
}

// Storage category configuration with colors and icons
const STORAGE_CATEGORIES = {
  images: {
    label: "Images",
    color: "bg-blue-500",
    borderColor: "border-blue-500/20",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-300",
    icon: "🖼️",
  },
  documents: {
    label: "Documents",
    color: "bg-purple-500",
    borderColor: "border-purple-500/20",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-300",
    icon: "📄",
  },
  code: {
    label: "Code",
    color: "bg-emerald-500",
    borderColor: "border-emerald-500/20",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-300",
    icon: "💻",
  },
  other: {
    label: "Other",
    color: "bg-zinc-500",
    borderColor: "border-zinc-500/20",
    bgColor: "bg-zinc-500/10",
    textColor: "text-zinc-300",
    icon: "📦",
  },
};

/**
 * Format bytes into human-readable format (KB, MB, GB)
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const divisor = 1024;
  let size = bytes;
  let unitIndex = 0;

  while (size >= divisor && unitIndex < units.length - 1) {
    size /= divisor;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function StorageUsageBreakdown({
  usage,
  limit,
}: StorageUsageBreakdownProps) {
  // Calculate total used and percentages
  const calculations = useMemo(() => {
    const totalUsed = usage.images + usage.documents + usage.code + usage.other;
    const usagePercentage = (totalUsed / limit) * 100;

    const categories = [
      { key: "images" as const, bytes: usage.images },
      { key: "documents" as const, bytes: usage.documents },
      { key: "code" as const, bytes: usage.code },
      { key: "other" as const, bytes: usage.other },
    ];

    // Calculate percentage of each category relative to total used
    const categoryPercentages = categories.map((cat) => ({
      ...cat,
      percentage: totalUsed > 0 ? (cat.bytes / totalUsed) * 100 : 0,
    }));

    return {
      totalUsed,
      usagePercentage: Math.min(usagePercentage, 100),
      categories: categoryPercentages,
    };
  }, [usage, limit]);

  const {
    totalUsed,
    usagePercentage,
    categories: categoryPercentages,
  } = calculations;

  // Determine progress bar color based on usage percentage
  const getProgressBarColor = (percentage: number): string => {
    if (percentage < 50) return "from-emerald-500 to-emerald-600";
    if (percentage < 80) return "from-yellow-500 to-yellow-600";
    if (percentage < 95) return "from-orange-500 to-orange-600";
    return "from-rose-500 to-rose-600";
  };

  const progressColor = getProgressBarColor(usagePercentage);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">Storage Usage</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Track your storage usage across different file types
        </p>
      </div>

      {/* Total usage display */}
      <div className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-950/50">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-zinc-400">Total Storage</p>
          <p className="text-sm font-semibold text-white">
            {formatBytes(totalUsed)} / {formatBytes(limit)}
          </p>
        </div>

        {/* Stacked progress bar */}
        <div className="h-4 w-full rounded-full bg-zinc-800 overflow-hidden flex">
          {categoryPercentages.map((cat) => (
            <div
              key={cat.key}
              className={`${
                STORAGE_CATEGORIES[cat.key].color
              } transition-all duration-300`}
              style={{
                width: `${
                  cat.bytes > 0 ? (cat.bytes / totalUsed) * 100 : 0
                }%`,
              }}
              title={`${cat.key}: ${formatBytes(cat.bytes)}`}
            />
          ))}
        </div>

        {/* Usage percentage */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {usagePercentage.toFixed(1)}% used
          </p>
          <p className="text-xs text-zinc-500">
            {formatBytes(limit - totalUsed)} available
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
          Breakdown by Category
        </p>

        {categoryPercentages.map((cat) => {
          const config = STORAGE_CATEGORIES[cat.key];
          const percentage =
            totalUsed > 0 ? (cat.bytes / totalUsed) * 100 : 0;

          return (
            <div
              key={cat.key}
              className={`p-3 rounded-lg border ${config.borderColor} ${config.bgColor}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-sm font-medium text-white">
                    {config.label}
                  </span>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${config.textColor}`}>
                    {formatBytes(cat.bytes)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Category mini progress bar */}
              <div className="h-1.5 w-full rounded-full bg-zinc-800/50 overflow-hidden">
                <div
                  className={`h-full ${config.color} transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Status indicator and tip */}
      <div className="mt-5 p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
        <div className="flex items-start gap-2">
          <span
            className={`text-lg flex-shrink-0 ${
              usagePercentage > 90
                ? "text-rose-400"
                : usagePercentage > 70
                  ? "text-yellow-400"
                  : "text-emerald-400"
            }`}
          >
            {usagePercentage > 90 ? "⚠️" : usagePercentage > 70 ? "📊" : "✓"}
          </span>
          <div className="flex-1">
            <p className="text-xs text-zinc-400">
              {usagePercentage > 90
                ? "Your storage is nearly full. Consider deleting old files or upgrading your plan."
                : usagePercentage > 70
                  ? "Your storage is getting full. You have about 30% capacity remaining."
                  : "Your storage usage is healthy. You have plenty of space available."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
