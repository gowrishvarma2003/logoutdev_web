"use client";

import Link from "next/link";
import type { DiscoveryEntity, DiscoverySection as DiscoverySectionType } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import FollowButton from "@/components/profile/FollowButton";

function DiscoveryCard({ item }: { item: DiscoveryEntity }) {
  const isBuilder = item.type === "builder";

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <Link href={item.href} className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {item.meta.eyebrow}
          </p>
          <h3 className="mt-1 line-clamp-1 text-base font-semibold text-white group-hover:text-sky-300">
            {item.title}
          </h3>
          {item.meta.byline ? <p className="mt-1 text-xs text-zinc-500">{item.meta.byline}</p> : null}
        </Link>
        {isBuilder ? (
          <FollowButton
            userId={item.id}
            initialFollowing={Boolean(item.meta.is_following)}
            initialFollowerCount={item.meta.follower_count ?? 0}
            size="sm"
          />
        ) : item.meta.status_label ? (
          <span className="rounded-full bg-zinc-800 px-2 py-1 text-[11px] font-medium capitalize text-zinc-300">
            {item.meta.status_label.replace(/_/g, " ")}
          </span>
        ) : null}
      </div>

      <Link href={item.href} className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-400 hover:text-zinc-300">
        {item.subtitle}
      </Link>

      {item.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.slice(0, 4).map((tag) => (
            <span
              key={`${item.id}:${tag}`}
              className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto pt-4">
        {item.meta.collaboration_label ? <p className="mb-2 text-xs font-medium text-sky-300">{item.meta.collaboration_label}</p> : null}
        {item.meta.stats ? <p className="text-xs text-zinc-500">{item.meta.stats}</p> : null}
        <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-600">
          <span>{item.rank_explanation.reasons[0] || item.rank_explanation.proof_of_work_band}</span>
          {item.meta.updated_at ? <span>Updated {formatRelativeTime(item.meta.updated_at)}</span> : null}
        </div>
      </div>
    </div>
  );
}

export default function ExploreSection({ section }: { section: DiscoverySectionType }) {
  return (
    <section className="px-4 py-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{section.title}</h2>
          <p className="text-xs text-zinc-500">{section.total} matches</p>
        </div>
        <Link href={section.see_all_href} className="text-sm font-medium text-sky-300 hover:text-sky-200">
          See all
        </Link>
      </div>

      {section.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-4 py-8 text-sm text-zinc-500">
          {section.empty_copy}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {section.items.map((item) => (
            <DiscoveryCard key={`${section.key}:${item.id}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
