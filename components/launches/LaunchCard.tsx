"use client";

import Link from "next/link";
import type { LaunchListItem } from "@/lib/types";
import { SparklesIcon, HeartIcon, ChatBubbleIcon } from "@/components/ui/Icons";

function humanize(v: string) {
  return v.replace(/-/g, " ");
}

const STATUS_DOT: Record<string, string> = {
  published: "bg-emerald-400",
  draft: "bg-amber-400",
  archived: "bg-zinc-500",
};

const STAGE_BADGE: Record<string, string> = {
  live: "text-emerald-300 bg-emerald-500/10",
  maintained: "text-emerald-300 bg-emerald-500/10",
  beta: "text-sky-300 bg-sky-500/10",
  mvp: "text-sky-300 bg-sky-500/10",
  prototype: "text-zinc-300 bg-zinc-800",
  paused: "text-rose-300 bg-rose-500/10",
};

export default function LaunchCard({ launch }: { launch: LaunchListItem }) {
  const screenshot = launch.screenshots?.[0]?.image_url;
  const dotClass = STATUS_DOT[launch.status] ?? "bg-zinc-500";
  const stageClass = STAGE_BADGE[launch.development_stage] ?? "text-zinc-300 bg-zinc-800";

  return (
    <Link
      href={`/launches/${launch.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-all duration-200 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20"
    >
      {/* Thumbnail */}
      <div className="aspect-[16/9] w-full shrink-0 overflow-hidden bg-zinc-950">
        {screenshot ? (
          <img
            src={screenshot}
            alt={launch.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950">
            <SparklesIcon className="h-10 w-10 text-zinc-700" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Name + status dot */}
        <div className="mb-1.5 flex items-start gap-2">
          <h3 className="flex-1 truncate text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-sky-300">
            {launch.name}
          </h3>
          <span
            className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${dotClass}`}
            title={launch.status}
          />
        </div>

        {/* Tagline */}
        <p className="mb-3 line-clamp-2 text-[13px] leading-relaxed text-zinc-400">{launch.tagline}</p>

        {/* Type + stage */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium capitalize text-zinc-300">
            {humanize(launch.product_type)}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${stageClass}`}>
            {humanize(launch.development_stage)}
          </span>
        </div>

        {/* Tech stack pills */}
        {(launch.tech_stack ?? []).length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(launch.tech_stack ?? []).slice(0, 3).map((item) => (
              <span
                key={item.id}
                className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-300"
              >
                {item.technology}
              </span>
            ))}
            {(launch.tech_stack ?? []).length > 3 && (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-500">
                +{(launch.tech_stack ?? []).length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mt-auto flex items-center gap-4 border-t border-zinc-800 pt-3 text-[12px] text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <HeartIcon className="h-3.5 w-3.5 text-rose-400" />
            {launch.upvote_count}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ChatBubbleIcon className="h-3.5 w-3.5" />
            {launch.review_count}
          </span>
          <span className="ml-auto text-zinc-600">{launch.feedback_count} feedback</span>
        </div>
      </div>
    </Link>
  );
}