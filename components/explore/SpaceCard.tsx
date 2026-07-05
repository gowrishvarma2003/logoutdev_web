"use client";

import Link from "next/link";
import type { DiscoveryEntity } from "@/lib/types";
import { FolderIcon, UsersIcon } from "@/components/ui/Icons";
import { formatRelativeTime } from "@/lib/utils";

interface SpaceCardProps {
  item: DiscoveryEntity;
}

export default function SpaceCard({ item }: SpaceCardProps) {
  // Parse member count from stats: "X members"
  const statsText = item.meta.stats || "";
  const membersMatch = statsText.match(/^(\d+)\s+members/);
  const memberCount = membersMatch ? parseInt(membersMatch[1], 10) : 0;

  // Determine space status badge colors
  const status = item.meta.status_label || "building";
  const statusStyles = {
    shipping: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    building: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    idea: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    paused: "bg-zinc-800/60 text-zinc-400 border-zinc-700/20",
    archived: "bg-zinc-800/80 text-zinc-500 border-zinc-700/30",
  }[status.toLowerCase()] || "bg-zinc-800/40 text-zinc-400 border-zinc-700/30";

  return (
    <div className="group flex h-full flex-col justify-between rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700/60 hover:bg-zinc-900/60">
      <div>
        {/* Header Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/40 text-zinc-400 group-hover:text-sky-400 transition-colors">
              <FolderIcon className="h-4 w-4" />
            </div>
            <Link href={item.href} className="text-sm font-semibold text-zinc-200 hover:text-sky-300 group-hover:text-white transition-colors line-clamp-1">
              {item.title}
            </Link>
          </div>
          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${statusStyles}`}>
            {status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Space Description */}
        <Link href={item.href} className="mt-3 block text-xs leading-relaxed text-zinc-400 line-clamp-2 hover:text-zinc-300">
          {item.subtitle || "No description provided."}
        </Link>
      </div>

      {/* Footer Content */}
      <div className="mt-5">
        {/* Stack Tags */}
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
          <div className="flex items-center gap-1.5">
            <UsersIcon className="h-3.5 w-3.5 text-zinc-500" />
            <span>
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
          </div>
          {item.meta.updated_at ? (
            <span>Updated {formatRelativeTime(item.meta.updated_at)}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
