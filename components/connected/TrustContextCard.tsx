"use client";

import Link from "next/link";
import type { TrustContext } from "@/lib/types";

export default function TrustContextCard({ trust }: { trust: TrustContext }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {trust.label}
      </p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <Link href={trust.user.href} className="text-base font-semibold text-white hover:text-sky-300">
            {trust.user.name}
          </Link>
          {trust.user.headline ? (
            <p className="mt-1 text-sm leading-6 text-zinc-400">{trust.user.headline}</p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-right">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Proof</p>
          <p className="text-lg font-semibold text-white">{trust.proof_score}</p>
          <p className="text-xs text-zinc-400">{trust.proof_band}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {trust.strongest_stacks.map((stack) => (
          <span
            key={`${trust.user.id}:${stack}`}
            className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-300"
          >
            {stack}
          </span>
        ))}
      </div>
      <div className="mt-4 space-y-1 text-xs text-zinc-400">
        {trust.primary_stats.map((item) => (
          <p key={`${trust.user.id}:${item}`}>{item}</p>
        ))}
        {trust.secondary_stats.map((item) => (
          <p key={`${trust.user.id}:secondary:${item}`}>{item}</p>
        ))}
      </div>
    </div>
  );
}
