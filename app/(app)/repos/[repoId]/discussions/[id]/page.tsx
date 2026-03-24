"use client";

import { use } from "react";
import Link from "next/link";
import { useRepoContext } from "../../layout";
import { ArrowUturnLeftIcon, ChatBubbleLeftRightIcon, FolderPlusIcon } from "@heroicons/react/24/outline";

export default function DiscussionDetailPage({
  params,
}: {
  params: Promise<{ repoId: string; id: string }>;
}) {
  const { id } = use(params);
  const { repo } = useRepoContext();
  const attachedSpace = repo.attached_space;

  return (
    <div className="mx-auto max-w-[1000px] p-4 md:p-8">
      <div className="mb-8">
        <Link
          href={`/repos/${repo.id}/discussions`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-400 font-medium"
        >
          <ArrowUturnLeftIcon className="h-4 w-4" /> Back to discussions
        </Link>
        <h1 className="text-3xl font-bold text-white mb-3">Discussion #{id.slice(0, 6)} moved out of the repo</h1>
        <p className="text-sm text-zinc-400">
          Repository discussion threads are deprecated. Use the collaboration home below instead.
        </p>
      </div>

      {attachedSpace ? (
        <div className="rounded-3xl border border-sky-500/20 bg-sky-500/10 p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            Use Space discussions instead
          </div>
          <h2 className="mt-4 text-xl font-semibold text-white">{attachedSpace.name} is the active discussion home</h2>
          <p className="mt-2 text-sm leading-6 text-sky-100/90">
            Open the linked Space to ask questions, join public idea threads, track work, and collaborate with maintainers and contributors.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/spaces/${attachedSpace.id}/discussions`}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-sky-950 transition-colors hover:bg-sky-50"
            >
              Open Space Discussions
            </Link>
            <Link
              href={`/spaces/${attachedSpace.id}/work`}
              className="rounded-lg border border-sky-300/30 px-4 py-2 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-400/10"
            >
              View Work
            </Link>
            <Link
              href={`/spaces/${attachedSpace.id}`}
              className="rounded-lg border border-sky-300/30 px-4 py-2 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-400/10"
            >
              Open Space
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <FolderPlusIcon className="h-4 w-4" />
            No Space attached yet
          </div>
          <h2 className="mt-4 text-xl font-semibold text-white">Attach this repo to a Space to replace repo discussions</h2>
          <p className="mt-2 text-sm leading-6 text-amber-100/90">
            Spaces centralize discussion, updates, onboarding, and work tracking. Once attached, this repo will point contributors there automatically.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/repos/${repo.id}/settings`}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-50"
            >
              Attach Space
            </Link>
            <Link
              href="/spaces/create"
              className="rounded-lg border border-amber-300/30 px-4 py-2 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-400/10"
            >
              Create Space
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
