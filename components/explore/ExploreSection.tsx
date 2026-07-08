"use client";

import Link from "next/link";
import type { DiscoveryEntity, DiscoverySection as DiscoverySectionType } from "@/lib/types";
import BuilderCard from "./BuilderCard";
import LaunchCard from "./LaunchCard";
import SpaceCard from "./SpaceCard";
import QuestionCard from "./QuestionCard";
import FreelanceCard from "./FreelanceCard";

function DiscoveryCard({ item }: { item: DiscoveryEntity }) {
  switch (item.type) {
    case "builder":
      return <BuilderCard item={item} />;
    case "launch":
      return <LaunchCard item={item} />;
    case "space":
      return <SpaceCard item={item} />;
    case "question":
      return <QuestionCard item={item} />;
    case "freelance_project":
      return <FreelanceCard item={item} />;
    default:
      // Fallback in case of unexpected type
      return (
        <div className="rounded-2xl border border-border-default bg-surface/60 p-4">
          <h3 className="text-sm font-semibold text-text-primary">{item.title}</h3>
          <p className="mt-1 text-xs text-text-muted">{item.subtitle}</p>
        </div>
      );
  }
}

export default function ExploreSection({ section }: { section: DiscoverySectionType }) {
  // Use a 3-column grid on desktop for builders and launches, and 2-column for others
  const isGrid3Col = section.key === "builders" || section.key === "launches";
  const gridClasses = isGrid3Col
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    : "grid grid-cols-1 md:grid-cols-2 gap-4";

  return (
    <section className="px-4 py-5 space-y-3.5">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            {section.title}
            <span className="text-[10px] font-semibold text-text-disabled bg-surface border border-border-default px-2 py-0.5 rounded-full">
              {section.total}
            </span>
          </h2>
        </div>
        <Link href={section.see_all_href} className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors uppercase tracking-wider">
          See all
        </Link>
      </div>

      {/* Grid of cards */}
      {section.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-default bg-surface/10 px-4 py-8 text-center text-xs text-text-disabled animate-empty-pulse">
          {section.empty_copy}
        </div>
      ) : (
        <div className={gridClasses}>
          {section.items.map((item) => (
            <div key={`${section.key}:${item.id}`} className="animate-chat-fade-in">
              <DiscoveryCard item={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
