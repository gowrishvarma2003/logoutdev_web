"use client";

import Link from "next/link";
import { useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { DotsIcon, PlusIcon, SparklesIcon } from "@/components/ui/Icons";
import { useMyLaunches } from "@/lib/hooks/useLaunches";
import * as launchesApi from "@/lib/services/launchesApi";
import type { LaunchListItem } from "@/lib/types";

const STATUS_DOT: Record<string, string> = {
  published: "bg-emerald-400",
  draft: "bg-amber-400",
  archived: "bg-zinc-500",
};

const STATUS_LABEL: Record<string, { label: string; classes: string }> = {
  published: { label: "Published", classes: "text-emerald-300 bg-emerald-500/10" },
  draft: { label: "Draft", classes: "text-amber-300 bg-amber-500/10" },
  archived: { label: "Archived", classes: "text-text-muted bg-surface-hover" },
};

function LaunchManageRow({
  launch,
  onPublish,
  onArchive,
  onDelete,
}: {
  launch: LaunchListItem;
  onPublish: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const screenshot = launch.screenshots?.[0]?.image_url;
  const dot = STATUS_DOT[launch.status] ?? "bg-zinc-500";
  const badge = STATUS_LABEL[launch.status] ?? { label: launch.status, classes: "text-text-muted bg-surface-hover" };
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  async function runAction(action: () => Promise<void>) {
    if (actionLoading) return;

    setActionLoading(true);
    try {
      await action();
      setMenuOpen(false);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="group flex items-start gap-4 rounded-2xl border border-border-default bg-surface/60 p-4 transition-colors hover:border-border-strong">
      {/* Thumbnail */}
      <div className="hidden h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-app sm:block">
        {screenshot ? (
          <img src={screenshot} alt={launch.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <SparklesIcon className="h-6 w-6 text-zinc-700" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
          <h3 className="text-sm font-semibold text-text-primary truncate">{launch.name}</h3>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.classes}`}>
            {badge.label}
          </span>
        </div>
        <p className="text-xs text-text-disabled line-clamp-1">{launch.tagline}</p>
        <div className="mt-1.5 text-[11px] text-text-disabled">
          {launch.upvote_count} upvotes · {launch.review_count} reviews · {launch.feedback_count} feedback
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link
          href={`/launches/${launch.id}`}
          className="rounded-lg border border-border-strong px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover transition-colors"
        >
          View
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-hover"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Launch settings"
          >
            <DotsIcon className="h-3.5 w-3.5" />
            Settings
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10 cursor-pointer" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-20 min-w-44 overflow-hidden rounded-xl border border-border-strong bg-surface shadow-2xl">
                <Link
                  href={`/launches/${launch.id}/edit`}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover"
                >
                  Edit launch
                </Link>

                {launch.status !== "published" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => runAction(() => onPublish(launch.id))}
                    className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-60"
                  >
                    Publish launch
                  </button>
                )}

                {launch.status !== "archived" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => runAction(() => onArchive(launch.id))}
                    className="block w-full px-4 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-60"
                  >
                    Archive launch
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => runAction(() => onDelete(launch.id))}
                  className="block w-full border-t border-border-default px-4 py-2.5 text-left text-sm text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-60"
                >
                  Delete launch
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyLaunchesPage() {
  const { launches, loading, error, refetch } = useMyLaunches();

  const drafts = launches.filter((l) => l.status === "draft");
  const published = launches.filter((l) => l.status === "published");
  const archived = launches.filter((l) => l.status === "archived");

  async function handlePublish(launchId: string) {
    await launchesApi.publishLaunch(launchId);
    await refetch();
  }

  async function handleArchive(launchId: string) {
    await launchesApi.archiveLaunch(launchId);
    await refetch();
  }

  async function handleDelete(launchId: string) {
    if (!window.confirm("Delete this launch permanently? This cannot be undone.")) {
      return;
    }

    await launchesApi.deleteLaunch(launchId);
    await refetch();
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">My Launches</h1>
          <p className="mt-1 text-xs text-text-disabled">
            Manage your products — publish drafts, track engagement, and archive old launches.
          </p>
        </div>
        <Link
          href="/launches/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          New launch
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{error}</p>
      ) : launches.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-default py-16 text-center">
          <SparklesIcon className="h-10 w-10 text-zinc-700" />
          <p className="text-sm font-medium text-text-muted">You have not created any launches yet.</p>
          <Link
            href="/launches/new"
            className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Create your first launch
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {drafts.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-disabled">
                Drafts · {drafts.length}
              </h2>
              <div className="space-y-3">
                {drafts.map((launch) => (
                  <LaunchManageRow
                    key={launch.id}
                    launch={launch}
                    onPublish={handlePublish}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {published.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-disabled">
                Published · {published.length}
              </h2>
              <div className="space-y-3">
                {published.map((launch) => (
                  <LaunchManageRow
                    key={launch.id}
                    launch={launch}
                    onPublish={handlePublish}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {archived.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-disabled">
                Archived · {archived.length}
              </h2>
              <div className="space-y-3">
                {archived.map((launch) => (
                  <LaunchManageRow
                    key={launch.id}
                    launch={launch}
                    onPublish={handlePublish}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
