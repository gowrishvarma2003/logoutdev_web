"use client";

/**
 * ProofOfWorkScoreBadge — displays the proof-of-work score, band, and factor breakdown.
 * Band colors: Strong=emerald, Growing=sky, Early=zinc.
 */

import { useState } from "react";
import type { ProofOfWorkSignals } from "@/lib/types";
import { SparklesIcon, ChevronDownIcon } from "@/components/ui/Icons";

interface ProofOfWorkScoreBadgeProps {
  signals: ProofOfWorkSignals;
}

const BAND_CONFIG: Record<
  string,
  { label: string; ring: string; bg: string; text: string; bar: string }
> = {
  Strong: {
    label: "Strong",
    ring: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    bar: "bg-emerald-500",
  },
  Growing: {
    label: "Growing",
    ring: "border-sky-500/40",
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    bar: "bg-sky-500",
  },
  Early: {
    label: "Early",
    ring: "border-zinc-600",
    bg: "bg-zinc-800/60",
    text: "text-zinc-400",
    bar: "bg-zinc-500",
  },
};

const FACTOR_LABELS: Record<string, string> = {
  project_participation: "Project Participation",
  update_consistency: "Update Consistency",
  discussion_engagement: "Discussion Engagement",
  feed_consistency: "Feed Activity",
};

// Maximum score per factor for the progress bar
const FACTOR_MAX: Record<string, number> = {
  project_participation: 30,
  update_consistency: 25,
  discussion_engagement: 25,
  feed_consistency: 20,
};

export default function ProofOfWorkScoreBadge({ signals }: ProofOfWorkScoreBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const config = BAND_CONFIG[signals.band] ?? BAND_CONFIG.Early;

  return (
    <div
      className={`rounded-2xl border ${config.ring} ${config.bg} p-4 transition-all`}
    >
      {/* ── Header row ── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full group"
        aria-label="Toggle proof-of-work details"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5">
          <SparklesIcon className={`w-4 h-4 shrink-0 ${config.text}`} />
          <div className="text-left">
            <p className="text-xs text-zinc-500 font-medium">Proof-of-Work</p>
            <p className={`text-sm font-bold ${config.text} leading-tight`}>
              {config.label}{" "}
              <span className="text-zinc-400 font-normal">· {signals.score}/100</span>
            </p>
          </div>
        </div>

        {/* Score ring */}
        <div className="flex items-center gap-2">
          <div
            className={`w-10 h-10 rounded-full border-2 ${config.ring} flex items-center justify-center`}
          >
            <span className={`text-sm font-bold ${config.text}`}>{signals.score}</span>
          </div>
          <ChevronDownIcon
            className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* ── Expanded factor breakdown ── */}
      {expanded && (
        <div className="mt-4 space-y-3 border-t border-zinc-700/50 pt-4">
          {Object.entries(signals.factors).map(([key, value]) => {
            const max = FACTOR_MAX[key] ?? 25;
            const pct = Math.min((value / max) * 100, 100);
            return (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">{FACTOR_LABELS[key] ?? key}</span>
                  <span className="text-zinc-400 tabular-nums">{value}/{max}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${config.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          <p className="text-[11px] text-zinc-600 mt-1">
            Score computed from last 30 days of activity.
          </p>
        </div>
      )}
    </div>
  );
}
