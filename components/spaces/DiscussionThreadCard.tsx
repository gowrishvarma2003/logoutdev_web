"use client";

import type { Discussion } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { PinIcon, ChatIcon } from "@/components/ui/Icons";
import Link from "next/link";
import RichText from "@/components/ui/RichText";

const CATEGORY_STYLES: Record<string, string> = {
  idea: "bg-violet-500/10 text-violet-400",
  decision: "bg-emerald-500/10 text-emerald-400",
  question: "bg-sky-500/10 text-sky-400",
  blocked: "bg-rose-500/10 text-rose-400",
  retrospective: "bg-amber-500/10 text-amber-400",
};

/**
 * Feed card for a top-level discussion post.
 * Replies are intentionally NOT shown here; user clicks card to open thread page.
 */
export default function DiscussionThreadCard({
  discussion,
  spaceId,
}: {
  discussion: Discussion;
  spaceId: string;
}) {
  const replyCount = discussion.replies?.length ?? discussion.replyCount ?? 0;
  const categoryStyle = CATEGORY_STYLES[discussion.category] ?? CATEGORY_STYLES.idea;

  return (
    <Link
      href={`/spaces/${spaceId}/discussions/${discussion.id}`}
      className="group block border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors"
    >
      <div className="px-5 py-4">
        <div className="flex gap-3">
          <Avatar user={discussion.author} size="sm" className="mt-0.5" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-xs mb-2">
              <span className="font-semibold text-white">
                {discussion.author?.name ?? "Unknown"}
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-500">{formatRelativeTime(discussion.created_at)}</span>
              <span className="text-zinc-700">·</span>
              <span className={`px-2 py-0.5 rounded-full font-medium ${categoryStyle}`}>
                {discussion.category}
              </span>
              {discussion.is_pinned && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <PinIcon className="w-2.5 h-2.5" />
                  Pinned
                </span>
              )}
            </div>

            <h3 className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors mb-1.5 leading-snug">
              {discussion.title}
            </h3>

            {discussion.body && (
              <RichText text={discussion.body} className="text-sm text-zinc-400 leading-relaxed line-clamp-3 whitespace-pre-line" />
            )}

            <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1 group-hover:text-zinc-300 transition-colors">
                <ChatIcon className="w-3.5 h-3.5" />
                {replyCount} {replyCount === 1 ? "reply" : "replies"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
