"use client";

import { useState } from "react";
import type { ProofOfWorkSignals } from "@/lib/types";
import { SparklesIcon, ChevronDownIcon } from "@/components/ui/Icons";

interface ProofOfWorkScoreBadgeProps {
  signals: ProofOfWorkSignals;
}

const BAND_CONFIG: Record<
  string,
  { ring: string; bg: string; text: string; bar: string }
> = {
  Strong: {
    ring: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    bar: "bg-emerald-500",
  },
  Growing: {
    ring: "border-sky-500/40",
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    bar: "bg-sky-500",
  },
  Early: {
    ring: "border-border-strong",
    bg: "bg-surface-hover/60",
    text: "text-text-muted",
    bar: "bg-zinc-500",
  },
};

const FACTOR_LABELS: Record<string, string> = {
  code_delivery: "Code Delivery",
  project_execution: "Project Execution",
  collaboration: "Collaboration",
  knowledge_sharing: "Knowledge Sharing",
  reliability_outcomes: "Reliability & Outcomes",
  community_contribution: "Community Contribution",
};

function formatScore(value: number): string {
  if (value >= 10000) return `${(value / 1000).toFixed(1)}k`;
  return value.toLocaleString();
}

function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toLocaleString()}`;
}

function sumPenaltyValues(penalties: Record<string, number> | undefined): number {
  if (!penalties) return 0;
  return Object.values(penalties).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
}

export default function ProofOfWorkScoreBadge({ signals }: ProofOfWorkScoreBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const config = BAND_CONFIG[signals.band] ?? BAND_CONFIG.Early;
  const badge = signals.badge || signals.band || "New Builder";
  const peakBadge = signals.peak_badge || badge;
  const categories = signals.category_totals || signals.factors;
  const maxCategory = Math.max(1, ...Object.values(categories));
  const next = signals.next_badge;
  const progress = next
    ? Math.min(100, Math.max(0, (signals.score / Math.max(1, next.threshold)) * 100))
    : 100;
  const ownerLedgers = signals.owner_details?.recent_daily_ledgers ?? [];

  return (
    <div className={`rounded-2xl border ${config.ring} ${config.bg} p-4 transition-all`}>
      <button
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4"
        aria-label="Toggle proof-of-work details"
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <SparklesIcon className={`h-4 w-4 shrink-0 ${config.text}`} />
          <div className="min-w-0 text-left">
            <p className="text-xs font-medium text-text-disabled">Proof-of-Work</p>
            <p className={`truncate text-sm font-bold leading-tight ${config.text}`}>
              {badge}
              <span className="font-normal text-text-muted"> · {formatScore(signals.score)} XP</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className={`flex h-10 min-w-10 items-center justify-center rounded-full border-2 px-2 ${config.ring}`}>
            <span className={`text-sm font-bold tabular-nums ${config.text}`}>{formatScore(signals.score)}</span>
          </div>
          <ChevronDownIcon
            className={`h-3.5 w-3.5 text-text-disabled transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {next ? (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="text-text-disabled">Next: {next.name}</span>
            <span className="tabular-nums text-text-muted">{formatScore(next.points_needed)} XP needed</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
            <div className={`h-full rounded-full ${config.bar}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-text-disabled">Peak badge reached · {peakBadge}</p>
      )}

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-border-strong/50 pt-4">
          <p className="text-xs text-text-disabled">Updates daily at 00:05 IST</p>

          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <div>
              <p className="text-text-disabled">Current</p>
              <p className={`font-semibold ${config.text}`}>{badge}</p>
            </div>
            <div>
              <p className="text-text-disabled">Peak</p>
              <p className="font-semibold text-text-secondary">{peakBadge}</p>
            </div>
            <div>
              <p className="text-text-disabled">Updated</p>
              <p className="font-semibold text-text-secondary">{signals.last_scored_date || "Daily IST"}</p>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(categories).map(([key, value]) => {
              const pct = Math.min((value / maxCategory) * 100, 100);
              return (
                <div key={key}>
                  <div className="mb-1 flex justify-between gap-3 text-xs">
                    <span className="text-text-muted">{FACTOR_LABELS[key] ?? key}</span>
                    <span className="tabular-nums text-text-muted">{formatScore(value)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
                    <div className={`h-full rounded-full ${config.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {next?.blockers && next.blockers.length > 0 ? (
            <div className="rounded-lg border border-border-default bg-surface/70 p-3 text-xs text-text-muted">
              {next.blockers.map((blocker, index) => (
                <p key={`${blocker.type}-${index}`}>
                  {blocker.type === "category_diversity"
                    ? `${blocker.categories_needed ?? 0} more categories need ${blocker.gate_points ?? 0}+ XP`
                    : `${blocker.points_needed ?? 0} XP to ${next.name}`}
                </p>
              ))}
            </div>
          ) : null}

          {ownerLedgers.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-disabled">Recent ledger</p>
              {ownerLedgers.slice(0, 5).map((ledger) => (
                <div key={ledger.score_date} className="rounded-lg border border-border-default bg-surface/60 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text-muted">{ledger.score_date}</span>
                    <span className={ledger.final_points >= 0 ? "text-emerald-400" : "text-rose-400"}>
                      {formatSigned(ledger.final_points)}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <p className="text-text-disabled">Raw</p>
                      <p className="tabular-nums text-text-muted">{ledger.raw_points}</p>
                    </div>
                    <div>
                      <p className="text-text-disabled">Capped</p>
                      <p className="tabular-nums text-text-muted">{ledger.capped_points}</p>
                    </div>
                    <div>
                      <p className="text-text-disabled">Caps</p>
                      <p className="tabular-nums text-text-muted">-{Math.max(0, ledger.raw_points - ledger.positive_points)}</p>
                    </div>
                    <div>
                      <p className="text-text-disabled">Penalty</p>
                      <p className="tabular-nums text-text-muted">-{sumPenaltyValues(ledger.penalties)}</p>
                    </div>
                  </div>
                  {sumPenaltyValues(ledger.penalties) > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(ledger.penalties).map(([key, value]) => (
                        Number(value) > 0 ? (
                          <span key={key} className="rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] text-rose-300">
                            {key}: -{value}
                          </span>
                        ) : null
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
