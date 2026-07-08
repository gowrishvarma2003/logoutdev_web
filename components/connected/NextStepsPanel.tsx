"use client";

import Link from "next/link";
import type { NextStepItem } from "@/lib/types";
import {
  PencilSquareIcon,
  RocketIcon,
  ShareIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from "@/components/ui/Icons";

const getStepIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("answer") || t.includes("write") || t.includes("vote")) {
    return PencilSquareIcon;
  }
  if (t.includes("space") || t.includes("collaborate") || t.includes("workspace")) {
    return RocketIcon;
  }
  if (t.includes("share")) {
    return ShareIcon;
  }
  return CheckCircleIcon;
};

export default function NextStepsPanel({
  items,
  title = "Next Steps",
}: {
  items: NextStepItem[];
  title?: string;
}) {
  if (items.length === 0) return null;

  const sortedItems = items
    .slice()
    .sort((left, right) => right.priority - left.priority);

  return (
    <div className="rounded-2xl border border-border-default bg-app/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-border-strong">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-disabled mb-4">{title}</h3>
      <div className="space-y-3">
        {sortedItems.map((item, idx) => {
          const Icon = getStepIcon(item.title);
          const isPrimary = idx === 0;

          return (
            <Link
              key={`${item.href}:${item.title}`}
              href={item.href}
              className={`group flex items-start gap-3.5 rounded-xl border p-3.5 transition-all duration-300 ${
                isPrimary
                  ? "border-sky-500/20 bg-sky-500/5 hover:border-sky-500/40 hover:bg-sky-500/10"
                  : "border-border-subtle bg-surface/10 hover:border-border-default hover:bg-surface/30"
              }`}
            >
              {/* Icon Container */}
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                isPrimary
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-400 group-hover:border-sky-500/50"
                  : "border-border-default bg-app text-text-muted group-hover:border-border-strong group-hover:text-text-primary"
              }`}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Text Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-text-primary transition-colors group-hover:text-sky-400">
                    {item.title}
                  </p>
                  {isPrimary && (
                    <span className="rounded bg-sky-500/10 px-1 py-px text-[9px] font-semibold text-sky-400">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-text-muted leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Chevron Arrow */}
              <div className="self-center pl-1">
                <ChevronRightIcon className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 ${
                  isPrimary ? "text-sky-500/50 group-hover:text-sky-400" : "text-text-disabled group-hover:text-text-muted"
                }`} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

