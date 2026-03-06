"use client";

import type { DecisionEntry } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import { CheckCircleIcon } from "@/components/ui/Icons";

/**
 * Compact card showing a recorded project decision.
 */
export default function DecisionLedgerCard({ decision }: { decision: DecisionEntry }) {
  return (
    <div className="flex gap-3 px-4 py-3 border-b border-zinc-800/50 last:border-b-0">
      <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white mb-0.5 truncate">
          {decision.title}
        </h4>
        <p className="text-xs text-zinc-400 line-clamp-2 mb-1.5">
          {decision.decision_summary}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span>{decision.author?.name ?? "Team"}</span>
          <span className="text-zinc-600">·</span>
          <span>{formatRelativeTime(decision.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
