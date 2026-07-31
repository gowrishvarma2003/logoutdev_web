"use client";

import { useMemo } from "react";
import { GitHubIcon, CalendarIcon } from "@/components/ui/Icons";
import type { GithubProfileSnapshot } from "@/lib/types";

const LEVELS = ["bg-surface-hover/50", "bg-violet-950", "bg-violet-800", "bg-violet-600", "bg-violet-400"];

function levelFor(count: number, max: number) {
  if (count <= 0) return 0;
  if (max <= 1) return 1;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
}

function cellTitle(date: string, count: number) {
  const formatted = new Date(`${date}T00:00:00Z`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${count} GitHub ${count === 1 ? "contribution" : "contributions"} on ${formatted}`;
}

export default function GithubContributionCard({ snapshot }: { snapshot: GithubProfileSnapshot }) {
  const contributions = useMemo(
    () => [...snapshot.daily_contributions].sort((left, right) => left.date.localeCompare(right.date)),
    [snapshot.daily_contributions]
  );
  const total = contributions.reduce((sum, entry) => sum + entry.count, 0);
  const max = Math.max(...contributions.map((entry) => entry.count), 0);

  return (
    <section className="rounded-2xl border border-border-default bg-surface/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitHubIcon className="h-4 w-4 text-text-secondary" />
          <h2 className="text-sm font-semibold text-text-primary">GitHub activity</h2>
          <a
            href={`https://github.com/${encodeURIComponent(snapshot.github_username)}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-violet-300 hover:text-violet-200"
          >
            @{snapshot.github_username}
          </a>
        </div>
        <span className="rounded-lg border border-border-default bg-surface/60 px-2.5 py-1 text-xs text-text-secondary tabular-nums">
          {snapshot.public_repos_count.toLocaleString()} public repos
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-disabled">
        <span>{total.toLocaleString()} contributions from GitHub&apos;s public calendar</span>
        <span className="inline-flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> Updated {new Date(snapshot.fetched_at).toLocaleDateString()}</span>
      </div>

      <div className="mt-4 overflow-x-auto pb-1" aria-label="GitHub daily contribution calendar">
        <div className="grid w-max grid-flow-col grid-rows-7 gap-[3px]" role="grid">
          {contributions.map((entry) => (
            <div
              key={entry.date}
              role="gridcell"
              title={cellTitle(entry.date, entry.count)}
              aria-label={cellTitle(entry.date, entry.count)}
              className={`h-3 w-3 rounded-sm ${LEVELS[levelFor(entry.count, max)]}`}
            />
          ))}
        </div>
      </div>
      <p className="mt-3 text-[11px] text-text-disabled">GitHub reports public contributions; this is not a commits-only count.</p>
    </section>
  );
}
