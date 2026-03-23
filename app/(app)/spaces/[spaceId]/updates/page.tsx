"use client";

import { use, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUpdates, useContributors } from "@/lib/hooks/useSpaces";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRepos } from "@/lib/hooks/useRepos";
import { useIssues } from "@/lib/hooks/useSpaces";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { contributors } = useContributors(spaceId);
  const { repos } = useRepos(spaceId);
  const { issues } = useIssues(spaceId, { page: 1, limit: 100, sort: "updated" });
  const isMember = contributors.some((c) => c.user_id === user?.id);
  const activeWorkItemId = searchParams.get("workItemId") || "";
  const composeRequested = searchParams.get("compose") === "true";
  const linkedWorkItem = useMemo(
    () => issues.find((issue) => issue.id === activeWorkItemId) ?? null,
    [issues, activeWorkItemId]
  );

  const [page, setPage] = useState(1);
  const { updates, total, loading, error, refetch } = useUpdates(spaceId, page, {
    work_item_id: activeWorkItemId || undefined,
  });

  // Compose state
  const [composerOpen, setComposerOpen] = useState(false);
  const [type, setType] = useState<UpdateType>("devlog");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [whatShipped, setWhatShipped] = useState("");
  const [nextUp, setNextUp] = useState("");
  const [blockers, setBlockers] = useState("");
  const [repoId, setRepoId] = useState("");
  const [evidenceLinks, setEvidenceLinks] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const showComposer = isMember && (composerOpen || composeRequested);

  function updateQuery(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function openComposer() {
    setComposerOpen(true);
    if (!composeRequested) updateQuery({ compose: "true" });
  }

  function closeComposer() {
    setComposerOpen(false);
    if (composeRequested) updateQuery({ compose: null });
  }

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
        repo_id: repoId || linkedWorkItem?.repo_id || undefined,
        work_item_id: activeWorkItemId || undefined,
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
      setRepoId("");
      setEvidenceLinks("");
      closeComposer();
      setPage(1);
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
              onClick={() => {
                if (showComposer) closeComposer();
                else openComposer();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-100 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              {showComposer ? "Close composer" : "Post Update"}
            </button>
          )
        }
      />

      {activeWorkItemId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/20 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">
              Showing updates for {linkedWorkItem?.title ?? "selected work item"}
            </p>
            <p className="text-xs text-zinc-500">
              New updates from the work detail page will land here automatically.
            </p>
          </div>
          <button
            onClick={() => {
              setPage(1);
              updateQuery({ workItemId: null });
            }}
            className="text-xs text-zinc-400 transition-colors hover:text-white"
          >
            Clear filter
          </button>
        </div>
      ) : null}

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
            <select
              value={repoId}
              onChange={(e) => setRepoId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-600"
            >
              <option value="">
                {linkedWorkItem?.repo ? `Use linked repo (${linkedWorkItem.repo.name})` : "No linked repo"}
              </option>
              {repos.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.name}
                </option>
              ))}
            </select>
            <select
              value={activeWorkItemId}
              onChange={(e) => {
                const nextWorkItemId = e.target.value;
                if (!repoId) {
                  const nextWorkItem = issues.find((issue) => issue.id === nextWorkItemId);
                  if (nextWorkItem?.repo_id) {
                    setRepoId(nextWorkItem.repo_id);
                  }
                }
                setPage(1);
                updateQuery({ workItemId: nextWorkItemId || null });
              }}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-600"
            >
              <option value="">No linked work item</option>
              {issues.slice(0, 50).map((issue) => (
                <option key={issue.id} value={issue.id}>
                  {issue.title}
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

          {linkedWorkItem ? (
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
              Posting into <span className="font-semibold">{linkedWorkItem.title}</span>
              {linkedWorkItem.repo ? ` and linking ${linkedWorkItem.repo.name}` : ""}.
            </div>
          ) : null}

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
              onClick={closeComposer}
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
