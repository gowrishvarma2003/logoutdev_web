"use client";

import Link from "next/link";
import type { LaunchListItem } from "@/lib/types";
import { SparklesIcon, HeartIcon, ChatBubbleIcon } from "@/components/ui/Icons";
import ExternalImage from "@/components/ui/ExternalImage";

const PHASE_BADGE: Record<string, string> = {
  beta: "bg-sky-500 text-text-primary",
  live: "bg-emerald-500 text-text-primary",
};

export default function LaunchCard({ launch }: { launch: LaunchListItem }) {
  const screenshot = launch.screenshots?.[0]?.image_url;
  const phaseClass = PHASE_BADGE[launch.launch_phase] ?? "bg-surface-active text-text-secondary";
  const techStack = launch.tech_stack ?? [];
  const visibleTech = techStack.slice(0, 2);
  const hiddenTechCount = Math.max(techStack.length - 2, 0);
  const builderName = launch.builder?.name ?? launch.builder?.username;
  const reviewCount = launch.review_count;

  return (
    <Link
      href={`/launches/${launch.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border-default/60 bg-surface/50 transition-all duration-200 hover:border-border-strong hover:bg-surface"
    >
      {/* Thumbnail with phase badge overlay */}
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-app">
        {screenshot ? (
          <ExternalImage
            src={screenshot}
            alt={launch.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            fallbackClassName="h-full w-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950">
            <SparklesIcon className="h-12 w-12 text-text-disabled" />
          </div>
        )}
        
        {/* Phase badge on thumbnail */}
        <span className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-lg ${phaseClass}`}>
          {launch.launch_phase}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-4 py-4">
        {/* Name */}
        <h3 className="mb-1 text-base font-semibold leading-snug text-text-primary transition-colors group-hover:text-sky-300">
          {launch.name}
        </h3>

        {/* Tagline */}
        <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-text-muted">
          {launch.tagline}
        </p>

        {/* Builder + Tech stack inline */}
        <p className="mb-4 text-[13px] text-text-disabled">
          {builderName && (
            <span className="text-text-muted">By {builderName}</span>
          )}
          {builderName && visibleTech.length > 0 && (
            <span className="mx-1.5 text-zinc-700">•</span>
          )}
          {visibleTech.length > 0 && (
            <span className="text-text-disabled">
              {visibleTech.map((t) => t.technology).join(", ")}
              {hiddenTechCount > 0 && ` +${hiddenTechCount}`}
            </span>
          )}
        </p>

        {/* Stats row */}
        <div className="mt-auto flex items-center gap-4 text-[13px] text-text-disabled">
          <span className="inline-flex items-center gap-1.5">
            <HeartIcon className="h-4 w-4 text-rose-400/80" />
            <span className="tabular-nums">{launch.upvote_count}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ChatBubbleIcon className="h-4 w-4 text-text-disabled" />
            <span className="tabular-nums">{reviewCount}</span>
            <span className="text-text-disabled">reviews</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
