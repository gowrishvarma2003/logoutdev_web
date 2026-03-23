"use client";

import Link from "next/link";
import type { SpaceUpdate } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { LinkIcon, CodeBracketIcon, QuestionMarkCircleIcon } from "@/components/ui/Icons";
import RichText from "@/components/ui/RichText";

const TYPE_STYLES: Record<string, { label: string; icon: string; color: string }> = {
  milestone:       { label: "Milestone",      icon: "🏁", color: "text-emerald-400 bg-emerald-500/10" },
  devlog:          { label: "Devlog",          icon: "📝", color: "text-sky-400 bg-sky-500/10" },
  release:         { label: "Release",         icon: "🚀", color: "text-violet-400 bg-violet-500/10" },
  blocker:         { label: "Blocker",         icon: "🚧", color: "text-rose-400 bg-rose-500/10" },
  "weekly-summary": { label: "Weekly Summary", icon: "📊", color: "text-amber-400 bg-amber-500/10" },
};

/**
 * Renders a single progress update in a timeline style.
 */
export default function ProgressUpdateCard({ update }: { update: SpaceUpdate }) {
  const t = TYPE_STYLES[update.type] ?? TYPE_STYLES.devlog;

  return (
    <article className="relative px-4 py-4 border-b border-zinc-800/50 last:border-b-0">
      {/* Timeline dot */}
      <div className="absolute left-0 top-7 w-0.5 h-[calc(100%-28px)] bg-zinc-800 ml-[27px]" />

      <div className="flex gap-3">
        <Avatar user={update.author} size="sm" className="relative z-10" />

        <div className="flex-1 min-w-0">
          {/* Header: type badge + title */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${t.color}`}>
              {t.icon} {t.label}
            </span>
            <h3 className="text-sm font-semibold text-white truncate">
              {update.title}
            </h3>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
            <span>{update.author?.name ?? "Unknown"}</span>
            <span className="text-zinc-600">·</span>
            <span>{formatRelativeTime(update.created_at)}</span>
          </div>

          {/* Content */}
          <RichText text={update.content} className="mb-3 text-sm text-zinc-300 whitespace-pre-line" />

          {/* What shipped / Next up / Blockers */}
          <div className="space-y-2">
            {(update.repo || update.work_item) && (
              <div className="flex flex-wrap gap-2 text-xs">
                {update.repo ? (
                  <Link
                    href={`/repos/${update.repo.id}`}
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-1 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
                  >
                    <CodeBracketIcon className="w-3 h-3" />
                    {update.repo.name}
                  </Link>
                ) : null}
                {update.work_item ? (
                  <Link
                    href={`/spaces/${update.space_id}/work/${update.work_item.id}`}
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-1 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
                  >
                    <QuestionMarkCircleIcon className="w-3 h-3" />
                    {update.work_item.title}
                  </Link>
                ) : null}
              </div>
            )}
            {update.what_shipped && (
              <div className="flex gap-2 text-xs">
                <span className="text-emerald-400 font-semibold shrink-0">Shipped:</span>
                <RichText text={update.what_shipped} as="span" className="text-zinc-400" />
              </div>
            )}
            {update.next_up && (
              <div className="flex gap-2 text-xs">
                <span className="text-sky-400 font-semibold shrink-0">Next:</span>
                <RichText text={update.next_up} as="span" className="text-zinc-400" />
              </div>
            )}
            {update.blockers && (
              <div className="flex gap-2 text-xs">
                <span className="text-rose-400 font-semibold shrink-0">Blocked:</span>
                <RichText text={update.blockers} as="span" className="text-zinc-400" />
              </div>
            )}
          </div>

          {/* Evidence links */}
          {update.evidence_links && update.evidence_links.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {update.evidence_links.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] text-sky-400 hover:text-sky-300 hover:bg-zinc-700 transition-colors"
                >
                  <LinkIcon className="w-3 h-3" />
                  {(() => { try { return new URL(link).hostname; } catch { return link; } })()}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
