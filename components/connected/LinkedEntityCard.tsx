"use client";

import Link from "next/link";
import type { EntityRef } from "@/lib/types";

const LABELS: Record<string, string> = {
  launch: "Launch",
  space: "Space",
  question: "Question",
  freelance_project: "Freelance",
  builder: "Builder",
  post: "Post",
};

const TYPE_STYLES: Record<string, string> = {
  question: "text-sky-400",
  launch: "text-emerald-400",
  space: "text-violet-400",
};

export default function LinkedEntityCard({
  entity,
  compact = false,
}: {
  entity: EntityRef;
  compact?: boolean;
}) {
  const isQuestion = entity.type === "question";
  const labelStyle = TYPE_STYLES[entity.type] || "text-zinc-500";

  const content = (
    <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/60 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${labelStyle}`}>
          {LABELS[entity.type] || entity.type}
        </p>
        {isQuestion && entity.tags && entity.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entity.tags.slice(0, compact ? 2 : 4).map((tag) => (
              <span
                key={`${entity.id}:${tag}`}
                className="rounded-full border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="mt-1 text-sm font-semibold text-white">{entity.title}</p>
      {entity.subtitle && !isQuestion ? (
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">{entity.subtitle}</p>
      ) : null}
      {isQuestion && entity.subtitle ? (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400">{entity.subtitle}</p>
      ) : null}
      {!isQuestion && entity.tags && entity.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entity.tags.slice(0, compact ? 3 : 5).map((tag) => (
            <span
              key={`${entity.id}:${tag}`}
              className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (!entity.href) return content;

  return (
    <Link
      href={entity.href}
      onClick={(event) => event.stopPropagation()}
      className="block rounded-2xl transition-colors hover:bg-zinc-900/70"
    >
      {content}
    </Link>
  );
}
