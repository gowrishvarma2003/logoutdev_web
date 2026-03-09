"use client";

import Link from "next/link";
import type { NextStepItem } from "@/lib/types";

export default function NextStepsPanel({
  items,
  title = "Next steps",
}: {
  items: NextStepItem[];
  title?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <div className="mt-3 space-y-3">
        {items
          .slice()
          .sort((left, right) => right.priority - left.priority)
          .map((item) => (
            <Link
              key={`${item.href}:${item.title}`}
              href={item.href}
              className="block rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 transition-colors hover:bg-zinc-900"
            >
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">{item.description}</p>
            </Link>
          ))}
      </div>
    </div>
  );
}
