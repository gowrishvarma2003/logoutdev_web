"use client";

import Link from "next/link";
import type { Launch } from "@/lib/types";
import { GlobeIcon, LockIcon, SparklesIcon } from "@/components/ui/Icons";

function humanize(v: string) {
  return v.replace(/-/g, " ");
}

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-500/20",
  draft: "bg-amber-500/12 text-amber-300 ring-1 ring-amber-500/20",
  archived: "bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700",
};

const STAGE_STYLES: Record<string, string> = {
  live: "bg-emerald-500/10 text-emerald-300",
  maintained: "bg-emerald-500/10 text-emerald-300",
  beta: "bg-sky-500/10 text-sky-300",
  mvp: "bg-sky-500/10 text-sky-300",
  prototype: "bg-zinc-800 text-zinc-300",
  paused: "bg-rose-500/10 text-rose-300",
};

export default function LaunchHero({ launch }: { launch: Launch }) {
  const banner = launch.screenshots?.[0]?.image_url;
  const statusStyle = STATUS_STYLES[launch.status] ?? "bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700";
  const stageStyle = STAGE_STYLES[launch.development_stage] ?? "bg-zinc-800 text-zinc-300";
  const heroStack = (launch.tech_stack ?? []).slice(0, 5);
  const hiddenStackCount = Math.max((launch.tech_stack ?? []).length - heroStack.length, 0);
  const hasLiveAccess = Boolean(launch.demo_url || launch.website_url);

  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/60 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
      <div className="relative h-40 bg-zinc-950 sm:h-48">
        {banner ? (
          <img src={banner} alt={launch.name} className="h-full w-full object-cover opacity-35" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-500/10 to-emerald-500/10">
            <SparklesIcon className="h-14 w-14 text-zinc-800" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/65 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex flex-wrap items-center justify-between gap-2 p-4 sm:p-5">
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusStyle}`}>
            {launch.status}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800/70 bg-zinc-950/70 px-3 py-1 text-[11px] font-medium text-zinc-300 backdrop-blur">
            {hasLiveAccess ? (
              <GlobeIcon className="h-3.5 w-3.5 text-sky-400" />
            ) : (
              <LockIcon className="h-3.5 w-3.5 text-zinc-500" />
            )}
            {hasLiveAccess ? "Live access" : "Private access"}
          </span>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-800/80 px-3 py-1 text-xs font-medium capitalize text-zinc-300">
              {humanize(launch.product_type)}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${stageStyle}`}>
              {humanize(launch.development_stage)}
            </span>

            {launch.builder && (
              <span className="min-w-0 text-xs text-zinc-500">
                Built by{" "}
                <Link
                  href={`/profile/${launch.builder.username || launch.builder.id}`}
                  className="font-medium text-sky-400 hover:text-sky-300 [overflow-wrap:anywhere]"
                >
                  {launch.builder.name}
                </Link>
              </span>
            )}
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white [overflow-wrap:anywhere] sm:text-3xl">
              {launch.name}
            </h1>

            {launch.tagline && (
              <p className="max-w-3xl text-sm leading-7 text-zinc-400 [overflow-wrap:anywhere] sm:text-[15px]">
                {launch.tagline}
              </p>
            )}
          </div>
        </div>

        {heroStack.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {heroStack.map((item) => (
              <span
                key={item.id}
                className="rounded-xl border border-sky-500/15 bg-sky-500/8 px-3 py-1.5 text-xs font-medium text-sky-300 [overflow-wrap:anywhere]"
              >
                {item.technology}
              </span>
            ))}

            {hiddenStackCount > 0 && (
              <span className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400">
                +{hiddenStackCount} more
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
