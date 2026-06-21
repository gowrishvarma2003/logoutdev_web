"use client";

import Link from "next/link";
import type { RelatedEntityRef } from "@/lib/types";
import { RocketIcon, FolderIcon, ChevronRightIcon, GlobeIcon } from "@/components/ui/Icons";

const TYPE_CONFIG: Record<string, { label: string; icon: any; colorClass: string }> = {
  launch: {
    label: "Launch",
    icon: RocketIcon,
    colorClass: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  space: {
    label: "Space",
    icon: FolderIcon,
    colorClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
};

export default function RelatedEntitiesPanel({
  items,
  title = "Related Workspaces",
}: {
  items: RelatedEntityRef[];
  title?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">{title}</h3>
      <div className="space-y-3.5">
        {items.map((item) => {
          const config = TYPE_CONFIG[item.type] || {
            label: item.type,
            icon: GlobeIcon,
            colorClass: "bg-zinc-800 text-zinc-400 border-zinc-700",
          };
          const Icon = config.icon;

          const cardContent = (
            <div className="group relative flex flex-col rounded-xl border border-zinc-900 bg-zinc-900/10 p-3.5 transition-all duration-300 hover:border-zinc-800 hover:bg-zinc-900/30">
              {/* Type Badge & Link Arrow */}
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${config.colorClass}`}>
                  <Icon className="h-3 w-3" />
                  {config.label}
                </span>
                {item.href && (
                  <ChevronRightIcon className="h-4 w-4 text-zinc-600 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-zinc-400" />
                )}
              </div>

              {/* Title & Subtitle */}
              <h4 className="text-sm font-bold text-white transition-colors group-hover:text-sky-400">
                {item.title}
              </h4>
              {item.subtitle && (
                <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {item.subtitle}
                </p>
              )}

              {/* Relevance Reason */}
              {item.reason && (
                <p className="mt-3 rounded bg-zinc-950/60 border border-zinc-800/40 px-2 py-1.5 text-[11px] text-zinc-500 leading-normal">
                  {item.reason}
                </p>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span
                      key={`${item.id}:${tag}`}
                      className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-500"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );

          if (!item.href) {
            return <div key={`${item.type}:${item.id}`}>{cardContent}</div>;
          }

          return (
            <Link key={`${item.type}:${item.id}`} href={item.href} className="block">
              {cardContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

