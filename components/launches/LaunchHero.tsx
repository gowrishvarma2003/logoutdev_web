"use client";

import Link from "next/link";
import type { Launch } from "@/lib/types";
import { GlobeIcon, LockIcon, CalendarIcon, SparklesIcon, CodeBracketIcon } from "@/components/ui/Icons";
import ExternalImage from "@/components/ui/ExternalImage";

function humanize(v: string) {
  return v.replace(/-/g, " ");
}

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(value));
}

const STAGE_STYLES: Record<string, string> = {
  live: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  maintained: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  beta: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  mvp: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  prototype: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  paused: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default function LaunchHero({ launch }: { launch: Launch }) {
  const banner = launch.screenshots?.[0]?.image_url;
  const hasLiveAccess = Boolean(launch.live_url || launch.demo_url || launch.website_url);
  const isBeta = launch.launch_phase === "beta";
  const launchDate = formatDate(
    isBeta
      ? (launch.beta_opened_at ?? launch.published_at ?? launch.created_at)
      : (launch.went_live_at ?? launch.published_at ?? launch.created_at)
  );

  const stageStyle = STAGE_STYLES[launch.development_stage] ?? "bg-zinc-800/80 text-zinc-300 border-zinc-700/80";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/60 to-zinc-950/60 backdrop-blur-md">
      {/* Visual background accents */}
      <div className="absolute top-0 right-0 -z-10 h-72 w-72 rounded-full bg-sky-500/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl" />
      
      {/* Hero banner */}
      {banner && (
        <div className="relative h-56 sm:h-64 w-full overflow-hidden">
          <ExternalImage
            src={banner}
            alt={launch.name}
            className="h-full w-full object-cover opacity-85 transition-transform duration-700 hover:scale-105"
            fallbackClassName="h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className={`space-y-6 p-6 sm:p-8 ${banner ? "-mt-24 relative z-10" : ""}`}>
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-semibold uppercase tracking-wider shadow-sm border ${
            isBeta ? "bg-sky-500/10 text-sky-400 border-sky-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}>
            <SparklesIcon className="h-3 w-3" />
            {launch.launch_phase}
          </span>
          <span className={`rounded-xl border px-3 py-1 text-xs font-medium capitalize ${stageStyle}`}>
            {humanize(launch.development_stage)}
          </span>
          {launch.is_open_source ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
              <CodeBracketIcon className="h-3 w-3" />
              Open Source
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400">
            {isBeta && !hasLiveAccess ? (
              <LockIcon className="h-3 w-3 text-zinc-500" />
            ) : (
              <GlobeIcon className="h-3 w-3 text-zinc-500" />
            )}
            {isBeta && !hasLiveAccess ? "Beta Access Only" : "Publicly Available"}
          </span>
        </div>

        {/* Title + tagline */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {launch.name}
          </h1>
          {launch.tagline && (
            <p className="max-w-3xl text-lg leading-relaxed text-zinc-300 font-light">
              {launch.tagline}
            </p>
          )}
        </div>

        {/* Meta line */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-zinc-800/60 pt-4 text-sm text-zinc-500">
          {launch.builder && (
            <span className="flex items-center gap-1.5">
              <span>By</span>
              <Link
                href={`/profile/${launch.builder.username || launch.builder.id}`}
                className="font-semibold text-zinc-300 hover:text-white transition-colors underline decoration-zinc-700 hover:decoration-white"
              >
                {launch.builder.name}
              </Link>
            </span>
          )}
          {launchDate && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-zinc-600" />
              <span>{isBeta ? "Beta Opened" : "Launched"} {launchDate}</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
