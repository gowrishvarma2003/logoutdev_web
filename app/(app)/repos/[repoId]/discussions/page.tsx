"use client";

import Link from "next/link";
import { useRepoContext } from "../layout";
import { useAuth } from "@/lib/hooks/useAuth";
import { ChatBubbleLeftRightIcon, FolderPlusIcon } from "@heroicons/react/24/outline";

export default function DiscussionsPage() {
  const { repo } = useRepoContext();
  const { user } = useAuth();
  const attachedSpace = repo.attached_space;
  const collaborationHome = repo.collaboration_home;
  const isRepoOwner = Boolean(user?.id && repo.owner_id === user.id);

  return (
    <div className="mx-auto max-w-[1280px] px-4 md:px-8 py-8 w-full">
      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Repository discussions moved</h1>
          <p className="text-zinc-400 max-w-2xl text-sm">
            Repositories are now code-first. Project discussion, Q&A, onboarding, and coordination happen in Spaces.
          </p>
        </div>
      </div>

      {attachedSpace ? (
        <div className="rounded-3xl border border-sky-500/20 bg-sky-500/10 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                Collaboration now lives in the attached Space
              </div>
              <h2 className="mt-4 text-xl font-semibold text-white">{attachedSpace.name} is the community home for this repo</h2>
              <p className="mt-2 text-sm leading-6 text-sky-100/90">
                Use the Space for discussions, contributor questions, planning, updates, and onboarding. Keep the repo focused on code, pull requests, releases, and maintenance.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/spaces/${attachedSpace.id}`}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-sky-950 transition-colors hover:bg-sky-50"
              >
                Open Space
              </Link>
              <Link
                href={`/spaces/${attachedSpace.id}/discussions`}
                className="rounded-lg border border-sky-300/30 px-4 py-2 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-400/10"
              >
                Go to Discussions
              </Link>
              <Link
                href={`/spaces/${attachedSpace.id}/work`}
                className="rounded-lg border border-sky-300/30 px-4 py-2 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-400/10"
              >
                View Work
              </Link>
            </div>
          </div>
          {collaborationHome?.can_start_discussion === false ? (
            <p className="mt-4 text-xs text-sky-100/70">
              You may need to sign in or join the Space before starting a discussion there.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <FolderPlusIcon className="h-4 w-4" />
            Attach a Space to unlock collaboration
          </div>
          <h2 className="mt-4 text-xl font-semibold text-white">This repo does not have a collaboration home yet</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-100/90">
            Attach the repo to a Space to centralize discussions, work tracking, updates, contribution guidance, and community onboarding.
          </p>
          {isRepoOwner ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/repos/${repo.id}/settings`}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-50"
              >
                Attach Existing Space
              </Link>
              <Link
                href="/spaces/create"
                className="rounded-lg border border-amber-300/30 px-4 py-2 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-400/10"
              >
                Create Space
              </Link>
            </div>
          ) : (
            <p className="mt-5 text-xs text-amber-100/75">Only the repository owner can attach this repo to a Space.</p>
          )}
        </div>
      )}
    </div>
  );
}
