"use client";

import { use, useState } from "react";
import { useUpdates, useContributors } from "@/lib/hooks/useSpaces";
import { useAuth } from "@/lib/hooks/useAuth";
import ProgressUpdateCard from "@/components/spaces/ProgressUpdateCard";
import { SectionHeader, EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { ClockIcon, PlusIcon } from "@/components/ui/Icons";
import * as api from "@/lib/services/spacesApi";
import type { UpdateType } from "@/lib/types";
import RichComposer from "@/components/ui/RichComposer";

const UPDATE_TYPES: Array<{ value: UpdateType; label: string }> = [
  { value: "devlog",          label: "📝 Devlog" },
  { value: "milestone",       label: "🏁 Milestone" },
  { value: "release",         label: "🚀 Release" },
  { value: "blocker",         label: "🚧 Blocker" },
  { value: "weekly-summary",  label: "📊 Weekly Summary" },
];

/**
 * /spaces/[spaceId]/updates — Timeline of progress updates.
 */
export default function UpdatesPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);
  const { user } = useAuth();
  const { contributors } = useContributors(spaceId);
  const isMember = contributors.some((c) => c.user_id === user?.id);

  const [page, setPage] = useState(1);
  const { updates, total, loading, error, refetch } = useUpdates(spaceId, page);

  // Compose state
  const [showComposer, setShowComposer] = useState(false);
  const [type, setType] = useState<UpdateType>("devlog");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [whatShipped, setWhatShipped] = useState("");
  const [nextUp, setNextUp] = useState("");
  const [blockers, setBlockers] = useState("");
  const [evidenceLinks, setEvidenceLinks] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setPosting(true);
    setPostError("");
    try {
      const links = evidenceLinks
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      await api.createUpdate(spaceId, {
        type,
        title: title.trim(),
        content: content.trim(),
        what_shipped: whatShipped.trim() || undefined,
        next_up: nextUp.trim() || undefined,
        blockers: blockers.trim() || undefined,
        evidence_links: links.length ? links : undefined,
      });

      // Reset
      setTitle("");
      setContent("");
      setWhatShipped("");
      setNextUp("");
      setBlockers("");
      setEvidenceLinks("");
      setShowComposer(false);
      refetch();
    } catch (err: unknown) {
      setPostError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      <SectionHeader
        title="Progress Updates"
        count={total}
        action={
          isMember && (
            <button
              onClick={() => setShowComposer((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-100 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Post Update
            </button>
          )
        }
      />

      {/* ── Composer ──────────────────────────────────────────────────────── */}
      {showComposer && (
        <form onSubmit={handlePost} className="px-4 py-4 border-b border-zinc-800 space-y-3 bg-zinc-900/30">
          <div className="flex gap-2 flex-wrap">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as UpdateType)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-600"
            >
              {UPDATE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Update title"
            maxLength={180}
            className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />

          <RichComposer
            value={content}
            onChange={(value) => setContent(value)}
            placeholder="What happened?"
            rows={3}
            previewClassName="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm leading-relaxed text-white"
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm leading-relaxed text-transparent caret-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors selection:bg-[#1d9bf0]/30"
          />

          {/* Structured fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={whatShipped}
              onChange={(e) => setWhatShipped(e.target.value)}
              placeholder="What shipped"
              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
            <input
              type="text"
              value={nextUp}
              onChange={(e) => setNextUp(e.target.value)}
              placeholder="What's next"
              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
            <input
              type="text"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Blockers"
              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          <textarea
            value={evidenceLinks}
            onChange={(e) => setEvidenceLinks(e.target.value)}
            placeholder="Evidence links (one per line)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none transition-colors"
          />

          <div className="flex items-center gap-2 justify-end">
            {postError && (
              <span className="text-xs text-rose-400 mr-auto">{postError}</span>
            )}
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={posting || !title.trim() || !content.trim()}
              className="px-4 py-1.5 rounded-lg bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {posting ? "Posting…" : "Publish"}
            </button>
          </div>
        </form>
      )}

      {/* ── Timeline ──────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {error && (
        <p className="text-sm text-rose-400 text-center py-8">{error}</p>
      )}

      {!loading && !error && updates.length === 0 && (
        <EmptyState
          icon={<ClockIcon className="w-10 h-10" />}
          title="No updates yet"
          description={isMember ? "Share your first progress update!" : "No progress updates have been posted."}
        />
      )}

      {!loading && !error && updates.length > 0 && (
        <div>
          {updates.map((u) => (
            <ProgressUpdateCard key={u.id} update={u} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(page > 1 || updates.length >= 20) && (
        <div className="flex items-center justify-center gap-3 py-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-zinc-400 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-zinc-500">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={updates.length < 20}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-zinc-400 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
