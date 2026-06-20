"use client";

import type { HealthScore } from "@/lib/types";
import { BoltIcon } from "@/components/ui/Icons";

const BAND_STYLES = {
  Excellent: {
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    bar: "bg-emerald-500",
  },
  Healthy: {
    border: "border-sky-500/20",
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    bar: "bg-sky-500",
  },
  "Needs Attention": {
    border: "border-amber-500/20",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    bar: "bg-amber-500",
  },
};

/** Returns a Tailwind bg class based on an individual factor's score. */
function factorBarColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

/**
 * Displays a project's collaboration health score as a compact banner
 * with prominent factor rows and activity metrics.
 */
export default function CollaborationHealthBadge({
  health,
  compact = false,
}: {
  health: HealthScore | null;
  compact?: boolean;
}) {
  if (!health) return null;

  const style = BAND_STYLES[health.band] ?? BAND_STYLES["Needs Attention"];

  /* ── Compact pill ── */
  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${style.border} ${style.bg} ${style.text}`}
        title={`Health: ${health.score}/100`}
      >
        <BoltIcon className="w-3.5 h-3.5 animate-pulse" />
        {health.band}
      </span>
    );
  }

  /* ── Full card ── */
  return (
    <div
      className={`rounded-xl border ${style.border} bg-zinc-900/20 p-4 transition-all duration-300 hover:border-zinc-700/80`}
    >
      {/* ── Header Row ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BoltIcon className={`w-3.5 h-3.5 ${style.text}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Collaboration Health
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-extrabold text-white`}>
            {health.score}
          </span>
          <span className="text-xs text-zinc-500">/100</span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}
          >
            {health.band}
          </span>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="h-1 w-full bg-zinc-800/80 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${style.bar}`}
          style={{ width: `${Math.min(health.score, 100)}%` }}
        />
      </div>

      {/* ── Health Factors ── */}
      {health.factors && Object.keys(health.factors).length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
            Health Factors
          </p>
          {Object.entries(health.factors).map(([key, val], index) => {
            const numVal =
              typeof val === "number" ? val : parseFloat(val) || 0;
            const clamped = Math.min(numVal, 100);
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 capitalize font-medium">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] font-bold text-white">
                    {numVal.toFixed(0)}
                  </span>
                </div>
                <div className="h-1 w-full bg-zinc-800/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${factorBarColor(numVal)}`}
                    style={{
                      width: `${clamped}%`,
                      transitionDelay: `${index * 80}ms`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Activity Metrics ── */}
      {health.metrics && Object.keys(health.metrics).length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-800/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
            Activity Metrics
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(health.metrics)
              .slice(0, 6)
              .map(([key, value]) => (
                <div
                  key={key}
                  className="px-2.5 py-2 rounded-lg bg-zinc-950/30"
                >
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {value}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
