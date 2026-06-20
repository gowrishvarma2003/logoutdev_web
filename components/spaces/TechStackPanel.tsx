"use client";

import type { StackEntry, StackCategory } from "@/lib/types";

const CATEGORY_LABEL_COLORS: Record<StackCategory, string> = {
  frontend: "text-sky-400 bg-sky-500/10 border-sky-500/10",
  backend: "text-violet-400 bg-violet-500/10 border-violet-500/10",
  database: "text-emerald-400 bg-emerald-500/10 border-emerald-500/10",
  infra: "text-orange-400 bg-orange-500/10 border-orange-500/10",
  tooling: "text-amber-400 bg-amber-500/10 border-amber-500/10",
  other: "text-zinc-400 bg-zinc-800 border-zinc-700/50",
};

/**
 * Displays the tech stack grouped by maturity status (In Use, Planned, Deprecated)
 * with inline category indicators on each tag.
 */
export default function TechStackPanel({ stack }: { stack: StackEntry[] }) {
  if (!stack.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/20">
        <p className="text-sm text-zinc-500">No tech stack defined yet.</p>
      </div>
    );
  }

  const inUse = stack.filter((e) => e.maturity === "in-use");
  const planned = stack.filter((e) => e.maturity === "planned");
  const deprecated = stack.filter((e) => e.maturity === "deprecated");

  const sections = [
    {
      key: "in-use",
      label: "In Use",
      items: inUse,
      dotColor: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
      bgColor: "bg-emerald-500/[0.02]",
      borderColor: "border-emerald-500/10",
      textColor: "text-emerald-400",
    },
    {
      key: "planned",
      label: "Planned",
      items: planned,
      dotColor: "bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]",
      bgColor: "bg-sky-500/[0.02]",
      borderColor: "border-sky-500/10",
      textColor: "text-sky-400",
    },
    {
      key: "deprecated",
      label: "Deprecated",
      items: deprecated,
      dotColor: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]",
      bgColor: "bg-rose-500/[0.02]",
      borderColor: "border-rose-500/10",
      textColor: "text-rose-450",
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map((sec) => {
        if (sec.items.length === 0) return null;
        return (
          <div
            key={sec.key}
            className={`rounded-xl border ${sec.borderColor} ${sec.bgColor} p-4 transition-all duration-200 hover:border-zinc-700/50`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${sec.dotColor}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${sec.textColor}`}>
                {sec.label}
              </span>
              <span className="text-[10px] text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-1.5 py-0.5 rounded-md">
                {sec.items.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {sec.items.map((entry) => {
                const catStyle = CATEGORY_LABEL_COLORS[entry.category] ?? CATEGORY_LABEL_COLORS.other;
                return (
                  <span
                    key={entry.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800/80 bg-zinc-950/40 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/40 hover:text-white transition-all duration-200"
                  >
                    <span>{entry.technology}</span>
                    <span className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase ${catStyle}`}>
                      {entry.category}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

