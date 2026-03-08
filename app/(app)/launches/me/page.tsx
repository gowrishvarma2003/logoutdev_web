"use client";

import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import { PlusIcon, SparklesIcon } from "@/components/ui/Icons";
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
  archived: { label: "Archived", classes: "text-zinc-400 bg-zinc-800" },
};

function LaunchManageRow({
  launch,
  onPublish,
  onArchive,
}: {
  launch: LaunchListItem;
  onPublish: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}) {
  const screenshot = launch.screenshots?.[0]?.image_url;
  const dot = STATUS_DOT[launch.status] ?? "bg-zinc-500";
  const badge = STATUS_LABEL[launch.status] ?? { label: launch.status, classes: "text-zinc-400 bg-zinc-800" };

  return (
    <div className="group flex items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700">
      {/* Thumbnail */}
      <div className="hidden h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-950 sm:block">
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
          <h3 className="text-sm font-semibold text-white truncate">{launch.name}</h3>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.classes}`}>
            {badge.label}
          </span>
        </div>
        <p className="text-xs text-zinc-500 line-clamp-1">{launch.tagline}</p>
        <div className="mt-1.5 text-[11px] text-zinc-600">
          {launch.upvote_count} upvotes · {launch.review_count} reviews · {launch.feedback_count} feedback
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link
          href={`/launches/${launch.id}`}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          View
        </Link>
        <Link
          href={`/launches/${launch.id}/edit`}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Edit
        </Link>
        {launch.status !== "published" && (
          <button
            onClick={() => onPublish(launch.id)}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-100 transition-colors"
          >
            Publish
          </button>
        )}
        {launch.status !== "archived" && (
          <button
            onClick={() => onArchive(launch.id)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-rose-400 transition-colors"
          >
            Archive
          </button>
        )}
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

  return (
    <div className="mx-auto max-w-4xl p-4">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">My Launches</h1>
          <p className="mt-1 text-xs text-zinc-500">
            Manage your products — publish drafts, track engagement, and archive old launches.
          </p>
        </div>
        <Link
          href="/launches/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 transition-colors"
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
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
          <SparklesIcon className="h-10 w-10 text-zinc-700" />
          <p className="text-sm font-medium text-zinc-400">You have not created any launches yet.</p>
          <Link
            href="/launches/new"
            className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-100"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Create your first launch
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {drafts.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Drafts · {drafts.length}
              </h2>
              <div className="space-y-3">
                {drafts.map((launch) => (
                  <LaunchManageRow
                    key={launch.id}
                    launch={launch}
                    onPublish={handlePublish}
                    onArchive={handleArchive}
                  />
                ))}
              </div>
            </div>
          )}

          {published.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Published · {published.length}
              </h2>
              <div className="space-y-3">
                {published.map((launch) => (
                  <LaunchManageRow
                    key={launch.id}
                    launch={launch}
                    onPublish={handlePublish}
                    onArchive={handleArchive}
                  />
                ))}
              </div>
            </div>
          )}

          {archived.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Archived · {archived.length}
              </h2>
              <div className="space-y-3">
                {archived.map((launch) => (
                  <LaunchManageRow
                    key={launch.id}
                    launch={launch}
                    onPublish={handlePublish}
                    onArchive={handleArchive}
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