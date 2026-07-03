"use client";

/**
 * ActivityHeatmap — GitHub-style calendar grid showing platform-wide activity
 * (posts, PRs, launches, discussions, chat, calls, freelance, ...) per day.
 * Aggregation lives on the backend; this component only renders buckets.
 */

import { useMemo } from "react";
import type { HeatmapBucket, ProfileHeatmap } from "@/lib/types";
import {
  CalendarIcon,
  TrendingUpIcon,
  BoltIcon,
} from "@/components/ui/Icons";

interface ActivityHeatmapProps {
  heatmap: ProfileHeatmap | null;
  loading?: boolean;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Emerald intensity ramp (matches the "Strong" proof-of-work band).
const LEVELS = [
  "bg-zinc-800/50",
  "bg-emerald-950",
  "bg-emerald-800",
  "bg-emerald-600",
  "bg-emerald-400",
];

const TYPE_COLORS: Record<string, string> = {
  post: "bg-violet-400",
  discussion: "bg-sky-400",
  update: "bg-emerald-400",
  launch: "bg-amber-300",
  launch_review: "bg-sky-300",
  launch_feedback: "bg-amber-400",
  launch_feedback_comment: "bg-amber-300",
  question: "bg-emerald-300",
  answer: "bg-emerald-400",
  question_comment: "bg-emerald-300",
  pr_opened: "bg-teal-400",
  pr_review: "bg-teal-300",
  pr_comment: "bg-teal-300",
  release: "bg-emerald-500",
  repo_discussion: "bg-sky-400",
  repo_discussion_comment: "bg-sky-300",
  issue_created: "bg-fuchsia-400",
  issue_comment: "bg-fuchsia-300",
  milestone: "bg-amber-400",
  freelance_win: "bg-emerald-400",
  message: "bg-violet-300",
  call_joined: "bg-rose-300",
};

const TYPE_LABELS: Record<string, string> = {
  post: "Posts",
  discussion: "Discussions",
  update: "Updates",
  launch: "Launches",
  launch_review: "Launch reviews",
  launch_feedback: "Launch feedback",
  launch_feedback_comment: "Feedback replies",
  question: "Questions",
  answer: "Answers",
  question_comment: "Q&A comments",
  pr_opened: "Pull requests",
  pr_review: "PR reviews",
  pr_comment: "PR comments",
  release: "Releases",
  repo_discussion: "Repo discussions",
  repo_discussion_comment: "Repo comments",
  issue_created: "Issues",
  issue_comment: "Issue comments",
  milestone: "Milestones",
  freelance_win: "Freelance wins",
  message: "Messages",
  call_joined: "Calls joined",
};

function levelFor(count: number, max: number): number {
  if (count <= 0) return 0;
  if (max <= 0) return 1;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

interface Week {
  cells: (HeatmapBucket | null)[];
  labelMonth: number | null;
}

function buildWeeks(buckets: HeatmapBucket[]): Week[] {
  if (buckets.length === 0) return [];
  const byDate = new Map(buckets.map((b) => [b.date, b]));
  const start = new Date(buckets[0].date + "T00:00:00Z");
  const end = new Date(buckets[buckets.length - 1].date + "T00:00:00Z");

  const gridStart = new Date(start);
  gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());

  const weeks: Week[] = [];
  const cursor = new Date(gridStart);
  let lastMonth: number | null = null;

  while (cursor <= end) {
    const cells: (HeatmapBucket | null)[] = [];
    let firstInRangeMonth: number | null = null;
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().slice(0, 10);
      if (cursor < start || cursor > end) {
        cells.push(null);
      } else {
        const bucket = byDate.get(dateStr) ?? { date: dateStr, total: 0, by_type: {} };
        cells.push(bucket);
        if (firstInRangeMonth === null) firstInRangeMonth = cursor.getUTCMonth();
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    const labelMonth: number | null = firstInRangeMonth !== null && firstInRangeMonth !== lastMonth ? firstInRangeMonth : null;
    if (labelMonth !== null) lastMonth = labelMonth;
    weeks.push({ cells, labelMonth });
  }
  return weeks;
}

function formatCellTitle(bucket: HeatmapBucket): string {
  const d = new Date(bucket.date + "T00:00:00Z");
  const weekday = WEEKDAYS[d.getUTCDay()];
  const month = MONTHS[d.getUTCMonth()];
  const contributions = bucket.total === 1 ? "1 contribution" : `${bucket.total} contributions`;
  return `${contributions} on ${weekday}, ${month} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5">
      <span className="text-zinc-500">{icon}</span>
      <div className="leading-none">
        <p className="text-[10px] uppercase tracking-wide text-zinc-600">{label}</p>
        <p className="text-xs font-semibold text-zinc-200 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export default function ActivityHeatmap({ heatmap, loading = false }: ActivityHeatmapProps) {
  const weeks = useMemo(() => (heatmap ? buildWeeks(heatmap.buckets) : []), [heatmap]);
  const topTypes = useMemo(() => {
    if (!heatmap) return [];
    return Object.entries(heatmap.totals)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [heatmap]);

  const totalContributions = heatmap ? heatmap.buckets.reduce((sum, b) => sum + b.total, 0) : 0;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <CalendarIcon className="w-4 h-4 text-emerald-400" />
        <h2 className="text-sm font-semibold text-white">Activity</h2>
        {heatmap ? (
          <span className="text-xs text-zinc-500">
            {totalContributions.toLocaleString()} contributions in the last {heatmap.days} days
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="flex gap-[3px] overflow-hidden">
            {Array.from({ length: 53 }).map((_, w) => (
              <div key={w} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((_, d) => (
                  <div key={d} className="w-3 h-3 rounded-sm bg-zinc-800/50 animate-pulse" />
                ))}
              </div>
            ))}
          </div>
          <div className="h-8 bg-zinc-800/40 rounded-lg animate-pulse" />
        </div>
      ) : !heatmap || weeks.length === 0 ? (
        <div className="py-10 text-center">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-2">
            <CalendarIcon className="w-5 h-5 text-zinc-600" />
          </div>
          <p className="text-sm text-zinc-500">No activity yet</p>
          <p className="text-xs text-zinc-600 mt-0.5">
            Posts, pull requests, launches, and discussions will light up here.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Stat icon={<CalendarIcon className="w-3 h-3" />} label="Active days" value={heatmap.active_days} />
            <Stat icon={<BoltIcon className="w-3 h-3" />} label="Current streak" value={`${heatmap.current_streak}d`} />
            <Stat icon={<TrendingUpIcon className="w-3 h-3" />} label="Longest streak" value={`${heatmap.longest_streak}d`} />
          </div>

          {/* Calendar grid */}
          <div className="overflow-x-auto scrollbar-none pb-1">
            <div className="flex gap-[3px] min-w-max">
              {/* Weekday labels */}
              <div className="flex flex-col gap-[3px] mr-1 pt-4">
                {WEEKDAYS.map((day, i) => (
                  <div key={day} className="h-3 text-[9px] leading-3 text-zinc-600">
                    {i % 2 === 1 ? day : ""}
                  </div>
                ))}
              </div>

              <div>
                {/* Month labels */}
                <div className="flex gap-[3px] mb-1 h-3">
                  {weeks.map((week, i) => (
                    <div key={i} className="w-3 text-[9px] leading-3 text-zinc-600">
                      {week.labelMonth !== null ? MONTHS[week.labelMonth] : ""}
                    </div>
                  ))}
                </div>
                {/* Weeks */}
                <div className="flex gap-[3px]">
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[3px]">
                      {week.cells.map((cell, di) => {
                        if (!cell) {
                          return <div key={di} className="w-3 h-3 rounded-sm bg-transparent" />;
                        }
                        const level = levelFor(cell.total, heatmap.max_day_count);
                        return (
                          <div
                            key={di}
                            className={`w-3 h-3 rounded-sm transition-colors ${LEVELS[level]}`}
                            title={formatCellTitle(cell)}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Legend + type breakdown */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-600">Less</span>
              {LEVELS.map((cls, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
              ))}
              <span className="text-[10px] text-zinc-600">More</span>
            </div>

            {topTypes.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {topTypes.map(([type, count]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${TYPE_COLORS[type] ?? "bg-zinc-500"}`} />
                    <span className="text-[10px] text-zinc-500">
                      {TYPE_LABELS[type] ?? type} · {count}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
