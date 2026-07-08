"use client";

import Link from "next/link";
import type { TrustContext } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";

export default function TrustContextCard({ trust }: { trust: TrustContext }) {
  // Parse stat string (e.g. "4 spaces" -> value: "4", label: "spaces")
  const parseStat = (statStr: string) => {
    const match = statStr.trim().match(/^(\d+)\s+(.+)$/);
    if (match) {
      return { value: match[1], label: match[2] };
    }
    return { value: "", label: statStr };
  };

  const allStats = [...trust.primary_stats, ...trust.secondary_stats].map(parseStat);

  return (
    <div className="rounded-2xl border border-border-default bg-app/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-border-strong">
      {/* Header Label */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-disabled">
          {trust.label || "Asker Trust"}
        </span>
        {trust.open_to_collaborate && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Open to collab
          </span>
        )}
      </div>

      {/* Main Profile Info */}
      <div className="flex items-start gap-3">
        <Avatar user={trust.user as any} size="md" className="ring-2 ring-border-default/80" />
        <div className="min-w-0 flex-1">
          <Link
            href={trust.user.href}
            className="text-base font-bold text-text-primary transition-colors hover:text-sky-400"
          >
            {trust.user.name}
          </Link>
          {trust.user.username && (
            <p className="text-xs text-text-disabled">@{trust.user.username}</p>
          )}
          {trust.user.headline && (
            <p className="mt-1 text-xs leading-relaxed text-text-muted line-clamp-2">
              {trust.user.headline}
            </p>
          )}
        </div>
      </div>

      {/* Proof Score Badge */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-border-default/80 bg-surface/20 px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-disabled">Proof Band</p>
          <p className="text-xs font-semibold text-text-primary mt-0.5">{trust.proof_band}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-text-disabled">Score</p>
          <p className="text-lg font-bold text-sky-400 mt-0.5">{trust.proof_score}</p>
        </div>
      </div>

      {/* Stacks / Skills */}
      {trust.strongest_stacks.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wider text-text-disabled mb-2 font-medium">Top Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {trust.strongest_stacks.map((stack) => (
              <span
                key={`${trust.user.id}:${stack}`}
                className="rounded-lg border border-border-default bg-surface/30 px-2 py-0.5 text-xs text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              >
                {stack}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Accomplishments Stat Grid */}
      {allStats.length > 0 && (
        <div className="mt-5 border-t border-border-default/60 pt-4">
          <p className="text-[10px] uppercase tracking-wider text-text-disabled mb-3 font-medium">Platform Stats</p>
          <div className="grid grid-cols-3 gap-2">
            {allStats.map((stat, idx) => (
              <div
                key={`${trust.user.id}:stat:${idx}`}
                className="rounded-lg border border-border-subtle bg-surface/10 p-2.5 text-center transition-all hover:bg-surface/20"
              >
                {stat.value ? (
                  <>
                    <span className="block text-base font-bold text-text-primary">{stat.value}</span>
                    <span className="block text-[9px] uppercase tracking-wider text-text-disabled mt-0.5 truncate">
                      {stat.label}
                    </span>
                  </>
                ) : (
                  <span className="block text-xs font-medium text-text-secondary truncate">{stat.label}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Profile CTA */}
      <div className="mt-5">
        <Link
          href={trust.user.href}
          className="flex w-full items-center justify-center rounded-xl border border-border-default bg-surface/40 py-2.5 text-xs font-semibold text-text-secondary transition-all hover:bg-surface hover:text-text-primary hover:border-border-strong"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

