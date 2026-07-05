"use client";

import Link from "next/link";
import type { DiscoveryEntity } from "@/lib/types";
import { ChatBubbleIcon } from "@/components/ui/Icons";
import { formatRelativeTime } from "@/lib/utils";

interface QuestionCardProps {
  item: DiscoveryEntity;
}

export default function QuestionCard({ item }: QuestionCardProps) {
  // Parse answer and participant count from stats: "X answers • Y participants"
  const statsText = item.meta.stats || "";
  const answersMatch = statsText.match(/^(\d+)\s+answers/);
  const answersCount = answersMatch ? parseInt(answersMatch[1], 10) : 0;
  const participantsMatch = statsText.match(/(\d+)\s+participants/);
  const participantCount = participantsMatch ? parseInt(participantsMatch[1], 10) : 0;

  const isClosed = item.meta.status_label === "closed";

  // Determine styles for the answer count container
  let answerBubbleStyles = "border border-zinc-800 bg-zinc-950/20 text-zinc-400";
  if (isClosed) {
    answerBubbleStyles = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  } else if (answersCount > 0) {
    answerBubbleStyles = "bg-sky-500/10 text-sky-400 border border-sky-500/20";
  }

  return (
    <div className="group flex h-full items-stretch gap-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700/60 hover:bg-zinc-900/60">
      {/* Answer counts block */}
      <div className="flex flex-col items-center justify-center">
        <div className={`flex h-11 w-12 flex-col items-center justify-center rounded-xl font-semibold ${answerBubbleStyles}`}>
          <span className="text-xs font-bold leading-none">{answersCount}</span>
          <span className="text-[8px] uppercase tracking-wider mt-0.5 font-medium opacity-80">
            {answersCount === 1 ? "ans" : "ans"}
          </span>
        </div>
      </div>

      {/* Main Details */}
      <div className="min-w-0 flex-1 flex flex-col justify-between">
        <div>
          <Link href={item.href} className="text-sm font-semibold text-zinc-200 hover:text-sky-300 group-hover:text-white transition-colors line-clamp-1">
            {item.title}
          </Link>
          <Link href={item.href} className="mt-1 block text-xs text-zinc-400 line-clamp-2 leading-relaxed hover:text-zinc-300">
            {item.subtitle}
          </Link>
        </div>

        {/* Tags & Footer Metadata */}
        <div className="mt-4">
          {item.tags && item.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-zinc-850 px-1.5 py-0.5 text-[9px] font-semibold text-sky-300/80 border border-zinc-800/40"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-zinc-800/40 pt-3 text-[10px] text-zinc-500">
            <span className="truncate">{item.meta.byline || "Anonymous"}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <ChatBubbleIcon className="h-3 w-3 text-zinc-500" />
                {participantCount}
              </span>
              {item.meta.updated_at ? (
                <span>Active {formatRelativeTime(item.meta.updated_at)}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
