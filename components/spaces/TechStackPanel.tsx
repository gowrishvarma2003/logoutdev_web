"use client";

import type { StackEntry, StackCategory } from "@/lib/types";

const CATEGORY_COLORS: Record<StackCategory, { bg: string; text: string; border: string }> = {
  frontend: { bg: "bg-sky-500/10",     text: "text-sky-400",     border: "border-sky-500/20" },
  backend:  { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/20" },
  database: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  infra:    { bg: "bg-orange-500/10",  text: "text-orange-400",  border: "border-orange-500/20" },
  tooling:  { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20" },
  other:    { bg: "bg-zinc-500/10",    text: "text-zinc-400",    border: "border-zinc-500/20" },
};

const MATURITY_LABELS = {
  planned:    "Planned",
  "in-use":   "In Use",
  deprecated: "Deprecated",
};

/**
 * Displays the tech stack grouped by category with maturity indicators.
 */
export default function TechStackPanel({ stack }: { stack: StackEntry[] }) {
  if (!stack.length) {
    return (
      <p className="text-sm text-zinc-500 py-4 px-4">No tech stack defined yet.</p>
    );
  }

  // Group by category
  const grouped = stack.reduce<Record<string, StackEntry[]>>((acc, entry) => {
    const cat = entry.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-4 p-4">
      {Object.entries(grouped).map(([category, entries]) => {
        const style = CATEGORY_COLORS[category as StackCategory] ?? CATEGORY_COLORS.other;
        return (
          <div key={category}>
            <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${style.text}`}>
              {category}
            </h4>
            <div className="flex flex-wrap gap-2">
              {entries.map((entry) => (
                <span
                  key={entry.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
                  title={`${entry.technology} — ${MATURITY_LABELS[entry.maturity] ?? entry.maturity}`}
                >
                  {entry.technology}
                  {entry.maturity === "deprecated" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Deprecated" />
                  )}
                  {entry.maturity === "planned" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" title="Planned" />
                  )}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
