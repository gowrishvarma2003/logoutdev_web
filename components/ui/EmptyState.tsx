"use client";

import type { ReactNode } from "react";

type EmptyStateTone = "default" | "project" | "feed" | "question" | "space" | "repo";
type EmptyStateSize = "sm" | "md" | "lg";

const TONE_STYLES: Record<EmptyStateTone, { glow: string; ring: string; icon: string; dot: string }> = {
  default: {
    glow: "from-sky-500/20 via-violet-500/10 to-emerald-500/10",
    ring: "border-sky-400/20 bg-sky-400/10",
    icon: "text-sky-200",
    dot: "bg-sky-300",
  },
  project: {
    glow: "from-emerald-500/20 via-sky-500/10 to-violet-500/10",
    ring: "border-emerald-400/20 bg-emerald-400/10",
    icon: "text-emerald-200",
    dot: "bg-emerald-300",
  },
  feed: {
    glow: "from-amber-500/20 via-rose-500/10 to-sky-500/10",
    ring: "border-amber-400/20 bg-amber-400/10",
    icon: "text-amber-200",
    dot: "bg-amber-300",
  },
  question: {
    glow: "from-violet-500/20 via-sky-500/10 to-emerald-500/10",
    ring: "border-violet-400/20 bg-violet-400/10",
    icon: "text-violet-200",
    dot: "bg-violet-300",
  },
  space: {
    glow: "from-cyan-500/20 via-emerald-500/10 to-amber-500/10",
    ring: "border-cyan-400/20 bg-cyan-400/10",
    icon: "text-cyan-200",
    dot: "bg-cyan-300",
  },
  repo: {
    glow: "from-blue-500/20 via-zinc-500/10 to-emerald-500/10",
    ring: "border-blue-400/20 bg-blue-400/10",
    icon: "text-blue-200",
    dot: "bg-blue-300",
  },
};

const SIZE_STYLES: Record<EmptyStateSize, { wrap: string; visual: string; title: string; desc: string }> = {
  sm: {
    wrap: "px-4 py-8",
    visual: "h-14 w-14",
    title: "text-sm",
    desc: "text-xs",
  },
  md: {
    wrap: "px-5 py-12",
    visual: "h-16 w-16",
    title: "text-base",
    desc: "text-sm",
  },
  lg: {
    wrap: "px-6 py-16",
    visual: "h-20 w-20",
    title: "text-lg",
    desc: "text-sm",
  },
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  tone = "default",
  size = "md",
  className = "",
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: EmptyStateTone;
  size?: EmptyStateSize;
  className?: string;
}) {
  const toneStyle = TONE_STYLES[tone];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/35 text-center ${sizeStyle.wrap} ${className}`}>
      <div className={`pointer-events-none absolute inset-x-8 top-6 h-20 rounded-full bg-gradient-to-r ${toneStyle.glow} blur-3xl`} />
      <div className="relative mx-auto flex max-w-md flex-col items-center">
        <div className={`relative ${sizeStyle.visual} animate-empty-float`}>
          <div className={`absolute inset-0 rounded-2xl border ${toneStyle.ring} shadow-[0_0_28px_rgba(255,255,255,0.04)]`} />
          <div className="absolute inset-2 rounded-xl border border-white/5 bg-zinc-950/80" />
          <div className={`relative z-10 flex h-full w-full items-center justify-center ${toneStyle.icon}`}>
            {icon ?? <span className="text-2xl font-black">+</span>}
          </div>
          <span className={`absolute -right-1 top-2 h-2.5 w-2.5 rounded-full ${toneStyle.dot} shadow-[0_0_14px_currentColor] animate-empty-pulse`} />
          <span className="absolute -left-1 bottom-3 h-2 w-2 rounded-full bg-white/35 animate-empty-pulse-delayed" />
        </div>

        <h3 className={`mt-5 font-semibold text-zinc-100 ${sizeStyle.title}`}>{title}</h3>
        {description ? (
          <p className={`mt-2 max-w-sm leading-relaxed text-zinc-500 ${sizeStyle.desc}`}>{description}</p>
        ) : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
