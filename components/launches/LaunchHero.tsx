"use client";

import Link from "next/link";
import type { Launch } from "@/lib/types";
import { GlobeIcon, LockIcon, SparklesIcon, CalendarIcon } from "@/components/ui/Icons";
import ExternalImage from "@/components/ui/ExternalImage";

function humanize(v: string) {
  return v.replace(/-/g, " ");
}

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(value));
}

const PHASE_STYLES: Record<string, string> = {
  beta: "bg-sky-500 text-white",
  live: "bg-emerald-500 text-white",
};

const STAGE_STYLES: Record<string, string> = {
  live: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  maintained: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  beta: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  mvp: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  prototype: "bg-zinc-800 text-zinc-300 border-zinc-700",
  paused: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

export default function LaunchHero({ launch }: { launch: Launch }) {
  const banner = launch.screenshots?.[0]?.image_url;
  const phaseStyle = PHASE_STYLES[launch.launch_phase] ?? "bg-zinc-700 text-zinc-200";
  const stageStyle = STAGE_STYLES[launch.development_stage] ?? "bg-zinc-800 text-zinc-300 border-zinc-700";
  const hasLiveAccess = Boolean(launch.live_url || launch.demo_url || launch.website_url);
  const isBeta = launch.launch_phase === "beta";
  const launchDate = formatDate(
    isBeta
      ? (launch.beta_opened_at ?? launch.published_at ?? launch.created_at)
      : (launch.went_live_at ?? launch.published_at ?? launch.created_at)
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40">
      {/* Hero banner */}
      {banner && (
        <div className="relative h-48 sm:h-56">
          <ExternalImage
            src={banner}
            alt={launch.name}
            className="h-full w-full object-cover"
            fallbackClassName="h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className={`space-y-5 p-5 sm:p-6 ${banner ? "-mt-16 relative" : ""}`}>
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide shadow-sm ${phaseStyle}`}>
            {launch.launch_phase}
          </span>
          <span className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize ${stageStyle}`}>
            {humanize(launch.development_stage)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-400">
            {isBeta && !hasLiveAccess ? (
              <LockIcon className="h-3.5 w-3.5" />
            ) : (
              <GlobeIcon className="h-3.5 w-3.5" />
            )}
            {isBeta && !hasLiveAccess ? "Beta access" : "Public"}
          </span>
        </div>

        {/* Title + tagline */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {launch.name}
          </h1>
          {launch.tagline && (
            <p className="max-w-2xl text-base leading-relaxed text-zinc-400">
              {launch.tagline}
            </p>
          )}
        </div>

        {/* Meta line */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500">
          {launch.builder && (
            <span>
              By{" "}
              <Link
                href={`/profile/${launch.builder.username || launch.builder.id}`}
                className="font-medium text-zinc-300 hover:text-white transition-colors"
              >
                {launch.builder.name}
              </Link>
            </span>
          )}
          {launchDate && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-zinc-600" />
              {isBeta ? "Beta opened" : "Launched"} {launchDate}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
