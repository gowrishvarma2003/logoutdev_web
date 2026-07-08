"use client";

import Link from "next/link";
import type { DiscoveryEntity } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";
import FollowButton from "@/components/profile/FollowButton";
import { formatRelativeTime } from "@/lib/utils";

interface BuilderCardProps {
  item: DiscoveryEntity;
}

export default function BuilderCard({ item }: BuilderCardProps) {
  const proofBand = item.rank_explanation?.proof_of_work_band || item.meta.proof_of_work_band || "Early";
  const user = {
    id: item.id,
    name: item.title,
    avatar_url: null, // Avatar handles placeholder colors if no image is loaded
  };

  // Determine styles for the Proof-of-Work status
  const badgeStyles = {
    Strong: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.06)]",
    Growing: "bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-[0_0_12px_rgba(14,165,233,0.06)]",
    Early: "bg-surface-hover/40 text-text-muted border-border-strong/30",
  }[proofBand as "Strong" | "Growing" | "Early"] || "bg-surface-hover/40 text-text-muted border-border-strong/30";

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-border-default/60 bg-surface/30 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong/60 hover:bg-surface/60">
      {/* Header Profile Row */}
      <div className="flex items-start justify-between gap-3">
        <Link href={item.href} className="flex min-w-0 items-center gap-3">
          <Avatar user={user} size="md" className="ring-2 ring-border-default/40 transition-transform group-hover:scale-105" />
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-sm font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
              {item.title}
            </h3>
            {item.meta.byline ? (
              <p className="line-clamp-1 text-xs text-text-disabled">
                {item.meta.byline}
              </p>
            ) : null}
          </div>
        </Link>
        {item.meta.can_follow !== false ? (
          <FollowButton
            userId={item.id}
            initialFollowing={Boolean(item.meta.is_following)}
            initialFollowerCount={item.meta.follower_count ?? 0}
            size="sm"
          />
        ) : null}
      </div>

      {/* Proof of Work Indicator */}
      <div className="mt-3.5 flex">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeStyles}`}>
          {proofBand} Builder
        </span>
      </div>

      {/* Headline / Bio */}
      <Link href={item.href} className="mt-3.5 block flex-1 text-xs leading-relaxed text-text-muted transition-colors hover:text-text-secondary line-clamp-2">
        {item.subtitle || "No headline provided yet."}
      </Link>

      {/* Skill Tags */}
      {item.tags && item.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.tags.slice(0, 4).map((tag) => (
            <span
              key={`${item.id}:tag:${tag}`}
              className="rounded-lg border border-border-default/80 bg-surface-hover/30 px-2 py-0.5 text-[10px] font-medium text-text-secondary transition-colors hover:bg-surface-hover/60"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {/* Collaboration / Match reasoning */}
      {item.meta.collaboration_label || item.rank_explanation?.reasons?.[0] ? (
        <div className="mt-4 flex flex-col gap-1 border-t border-border-default/40 pt-3">
          {item.meta.collaboration_label ? (
            <p className="text-[11px] font-medium text-sky-400">
              {item.meta.collaboration_label}
            </p>
          ) : null}
          {item.rank_explanation?.reasons?.[0] ? (
            <p className="text-[10px] text-text-disabled">
              {item.rank_explanation.reasons[0]}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Stats Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-border-default/40 pt-3 text-[10px] text-text-disabled">
        <span>{item.meta.stats || "Active Builder"}</span>
        {item.meta.updated_at ? (
          <span>Updated {formatRelativeTime(item.meta.updated_at)}</span>
        ) : null}
      </div>
    </div>
  );
}
