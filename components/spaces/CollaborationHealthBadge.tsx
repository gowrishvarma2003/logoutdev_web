"use client";

import type { HealthScore } from "@/lib/types";
import { BoltIcon } from "@/components/ui/Icons";

const BAND_STYLES = {
  Excellent:        { ring: "ring-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-400", bar: "bg-emerald-500" },
  Healthy:          { ring: "ring-sky-500/30",     bg: "bg-sky-500/10",     text: "text-sky-400",     bar: "bg-sky-500" },
  "Needs Attention": { ring: "ring-amber-500/30",  bg: "bg-amber-500/10",   text: "text-amber-400",   bar: "bg-amber-500" },
};

/**
 * Displays a project's collaboration health score as a visual badge
 * with an animated progress bar and label.
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

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${style.ring} ${style.bg} ${style.text}`}
        title={`Health: ${health.score}/100`}
      >
        <BoltIcon className="w-3.5 h-3.5" />
        {health.band}
      </span>
    );
  }

  return (
    <div className={`rounded-xl p-4 ring-1 ${style.ring} ${style.bg}`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BoltIcon className={`w-4 h-4 ${style.text}`} />
          <span className={`text-sm font-semibold ${style.text}`}>
            Collaboration Health
          </span>
        </div>
        <span className={`text-2xl font-bold ${style.text}`}>
          {health.score}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${style.bar}`}
          style={{ width: `${Math.min(health.score, 100)}%` }}
        />
      </div>

      {/* Band label */}
      <p className={`text-xs font-medium ${style.text}`}>{health.band}</p>

      {/* Factor breakdown */}
      {health.factors && Object.keys(health.factors).length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-800/50 grid grid-cols-2 gap-y-1.5 gap-x-4">
          {Object.entries(health.factors).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 capitalize">
                {key.replace(/_/g, " ")}
              </span>
              <span className={`text-[11px] font-medium ${style.text}`}>
                {typeof val === "number" ? val.toFixed(0) : val}
              </span>
            </div>
          ))}
        </div>
      )}

      {health.metrics && Object.keys(health.metrics).length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
          {Object.entries(health.metrics).slice(0, 6).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">{key.replace(/_/g, " ")}</p>
              <p className={`mt-1 text-sm font-semibold ${style.text}`}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
