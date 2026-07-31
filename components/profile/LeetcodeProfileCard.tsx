"use client";

import { BarChartIcon, CodeBracketIcon } from "@/components/ui/Icons";
import type { LeetcodeProfileSnapshot } from "@/lib/types";

function Stat({ label, value, tone = "text-text-primary" }: { label: string; value: string | number; tone?: string }) {
  return <div className="rounded-xl border border-border-default bg-surface/60 px-3 py-2.5"><p className="text-[10px] font-medium uppercase tracking-wide text-text-disabled">{label}</p><p className={`mt-0.5 text-base font-semibold tabular-nums ${tone}`}>{value}</p></div>;
}

export default function LeetcodeProfileCard({ snapshot }: { snapshot: LeetcodeProfileSnapshot }) {
  return (
    <section className="rounded-2xl border border-amber-500/20 bg-surface/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10"><CodeBracketIcon className="h-4 w-4 text-amber-400" /></span>
          <div><h2 className="text-sm font-semibold text-text-primary">LeetCode</h2><a href={`https://leetcode.com/u/${encodeURIComponent(snapshot.leetcode_username)}/`} target="_blank" rel="noreferrer" className="text-xs text-amber-300 hover:text-amber-200">@{snapshot.leetcode_username}</a></div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-lg border border-border-default bg-surface/60 px-2.5 py-1 text-xs text-text-secondary"><BarChartIcon className="h-3 w-3" /> Updated {new Date(snapshot.fetched_at).toLocaleDateString()}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Solved" value={snapshot.total_solved.toLocaleString()} tone="text-amber-300" />
        <Stat label="Contest rating" value={snapshot.contest_rating?.toFixed(0) ?? "—"} />
        <Stat label="LeetCode rank" value={snapshot.profile_ranking ? `#${snapshot.profile_ranking.toLocaleString()}` : "—"} />
        <Stat label="Contest rank" value={snapshot.contest_global_ranking ? `#${snapshot.contest_global_ranking.toLocaleString()}` : "—"} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-emerald-500/10 px-2 py-2 text-emerald-300"><span className="block text-base font-semibold tabular-nums">{snapshot.easy_solved}</span>Easy</div>
        <div className="rounded-lg bg-amber-500/10 px-2 py-2 text-amber-300"><span className="block text-base font-semibold tabular-nums">{snapshot.medium_solved}</span>Medium</div>
        <div className="rounded-lg bg-rose-500/10 px-2 py-2 text-rose-300"><span className="block text-base font-semibold tabular-nums">{snapshot.hard_solved}</span>Hard</div>
      </div>
      <p className="mt-3 text-[11px] text-text-disabled">{snapshot.attended_contests_count.toLocaleString()} contests attended{snapshot.contest_top_percentage !== null ? ` · top ${snapshot.contest_top_percentage}%` : ""}</p>
    </section>
  );
}
