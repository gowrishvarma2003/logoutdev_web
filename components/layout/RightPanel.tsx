"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTrendingHashtags } from "@/lib/api";
import type { HashtagSuggestion, User } from "@/lib/types";
import { emailToHandle } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";

interface RightPanelProps {
  currentUser: User;
}

export default function RightPanel({ currentUser }: RightPanelProps) {
  const [trending, setTrending] = useState<HashtagSuggestion[]>([]);

  useEffect(() => {
    let cancelled = false;

    getTrendingHashtags(6)
      .then((res) => {
        if (!cancelled) {
          setTrending(res.hashtags);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTrending([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handle = currentUser.username || emailToHandle(currentUser.email);

  return (
    <div className="flex flex-col gap-6 p-4 pt-6">
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
        <Avatar user={currentUser} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{currentUser.name}</p>
          <p className="truncate text-xs text-zinc-500">@{handle}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Trending topics
        </h2>
        <ul className="flex flex-col gap-0.5">
          {trending.length === 0 ? (
            <li className="px-3 py-2 text-xs text-zinc-600">No hashtag activity yet.</li>
          ) : (
            trending.map(({ normalized_tag, tag, recent_post_count, usage_count }) => (
              <li key={normalized_tag}>
                <Link
                  href={`/hashtags/${normalized_tag}`}
                  className="group block rounded-xl px-3 py-2 text-left transition-colors hover:bg-zinc-800/60"
                >
                  <p className="text-sm font-medium text-sky-400 group-hover:text-sky-300">
                    #{tag}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {recent_post_count || usage_count} posts
                  </p>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <p className="mt-auto px-1 text-[11px] text-zinc-600">
        &copy; {new Date().getFullYear()} LogoutDev
      </p>
    </div>
  );
}
