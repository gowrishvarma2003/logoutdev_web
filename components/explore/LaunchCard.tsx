"use client";

import Link from "next/link";
import type { DiscoveryEntity } from "@/lib/types";
import { ArrowUpIcon } from "@/components/ui/Icons";

interface LaunchCardProps {
  item: DiscoveryEntity;
}

export default function LaunchCard({ item }: LaunchCardProps) {
  // Parse upvote and review counts from stats: "X upvotes • Y reviews"
  const statsText = item.meta.stats || "";
  const upvotesMatch = statsText.match(/^(\d+)\s+upvotes/);
  const upvotes = upvotesMatch ? parseInt(upvotesMatch[1], 10) : 0;
  const reviewsMatch = statsText.match(/(\d+)\s+reviews/);
  const reviews = reviewsMatch ? parseInt(reviewsMatch[1], 10) : 0;

  // Generate a premium colored circular placeholder for the launch icon based on the title
  const firstLetter = item.title ? item.title.charAt(0).toUpperCase() : "?";
  const iconBg = {
    A: "bg-red-500/10 text-red-400 border-red-500/20",
    B: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    C: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    D: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    E: "bg-lime-500/10 text-lime-400 border-lime-500/20",
    F: "bg-green-500/10 text-green-400 border-green-500/20",
    G: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    H: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    I: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    J: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    K: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    L: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    M: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    N: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    O: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
    P: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    Q: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  }[firstLetter] || "bg-zinc-800/50 text-zinc-300 border-zinc-700/30";

  // Determine stage badge styles
  const stage = item.meta.status_label || "alpha";
  const stageStyles = {
    production: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    beta: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    alpha: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  }[stage.toLowerCase()] || "bg-zinc-800/40 text-zinc-400 border-zinc-700/30";

  return (
    <div className="group flex h-full items-stretch justify-between gap-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700/60 hover:bg-zinc-900/60">
      <div className="flex min-w-0 flex-1 gap-4">
        {/* Project Thumbnail Icon */}
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-lg font-bold ${iconBg}`}>
          {firstLetter}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={item.href} className="text-sm font-semibold text-zinc-200 hover:text-sky-300 group-hover:text-white transition-colors line-clamp-1">
                {item.title}
              </Link>
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${stageStyles}`}>
                {stage.replace(/_/g, " ")}
              </span>
            </div>
            <Link href={item.href} className="mt-1 block text-xs text-zinc-400 line-clamp-2 leading-relaxed hover:text-zinc-300">
              {item.subtitle}
            </Link>
          </div>

          {/* Stacks & Creator */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-zinc-500">
            {item.meta.byline ? (
              <span className="font-medium text-zinc-400">{item.meta.byline}</span>
            ) : null}
            {item.tags && item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-zinc-500 bg-zinc-800/20 px-1 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Upvote & Reviews Count column */}
      <div className="flex flex-col items-center justify-between border-l border-zinc-800/40 pl-4 min-w-[65px]">
        {/* Vote container */}
        <Link
          href={item.href}
          className="flex w-full flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/40 py-2 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80 group/vote"
        >
          <ArrowUpIcon className="h-4 w-4 text-zinc-400 group-hover/vote:text-sky-400 transition-colors" />
          <span className="mt-1 text-xs font-bold text-zinc-200 group-hover/vote:text-white">
            {upvotes}
          </span>
        </Link>
        <span className="text-[9px] font-medium text-zinc-600 uppercase tracking-wider mt-2">
          {reviews} {reviews === 1 ? "review" : "reviews"}
        </span>
      </div>
    </div>
  );
}
