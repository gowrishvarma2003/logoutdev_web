"use client";

import Link from "next/link";
import type { DiscoveryEntity } from "@/lib/types";
import { BriefcaseIcon, ClockIcon } from "@/components/ui/Icons";

interface FreelanceCardProps {
  item: DiscoveryEntity;
}

export default function FreelanceCard({ item }: FreelanceCardProps) {
  // Parse pricing model and engagement from stats: "pricing_model • engagement_type"
  const statsText = item.meta.stats || "";
  const parts = statsText.split(" • ");
  const pricingModel = parts[0] || "Contract";
  const engagement = parts[1] || "Project Basis";

  const isOpen = item.meta.status_label === "open";

  // Determine styles for the freelance status
  const statusStyles = isOpen
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : "bg-zinc-800/40 text-zinc-500 border-zinc-700/20";

  return (
    <div className="group flex h-full flex-col justify-between rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700/60 hover:bg-zinc-900/60">
      <div>
        {/* Header Budget and Status Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/40 text-zinc-400 group-hover:text-sky-400 transition-colors">
              <BriefcaseIcon className="h-4 w-4" />
            </div>
            {/* Display pricing model highlighted */}
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full capitalize">
              {pricingModel.replace(/_/g, " ")}
            </span>
          </div>
          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${statusStyles}`}>
            {item.meta.status_label ? item.meta.status_label.replace(/_/g, " ") : "open"}
          </span>
        </div>

        {/* Project Title */}
        <Link href={item.href} className="mt-3.5 block text-sm font-semibold text-zinc-200 hover:text-sky-300 group-hover:text-white transition-colors line-clamp-1">
          {item.title}
        </Link>

        {/* Project Requirements Description */}
        <Link href={item.href} className="mt-2 block text-xs leading-relaxed text-zinc-400 line-clamp-2 hover:text-zinc-300">
          {item.subtitle || "No description details provided."}
        </Link>
      </div>

      {/* Footer Content */}
      <div className="mt-5">
        {/* Skill tags */}
        {item.tags && item.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 mb-4">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded bg-zinc-800/40 border border-zinc-800/60 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {/* Space Stats Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800/40 pt-3 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1">
            <ClockIcon className="h-3.5 w-3.5 text-zinc-500" />
            <span className="capitalize">{engagement.replace(/_/g, " ")}</span>
          </div>
          <span className="max-w-[120px] truncate">{item.meta.byline}</span>
        </div>
      </div>
    </div>
  );
}
