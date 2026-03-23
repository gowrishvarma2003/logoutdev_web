"use client";

import { useState } from "react";
import Link from "next/link";
import { useRepoContext } from "../layout";
import { useRepoReleases, useTags } from "@/lib/hooks/useRepos";
import * as reposApi from "@/lib/services/reposApi";
import type { RepoRelease } from "@/lib/types";
import Spinner from "@/components/ui/Spinner";
import { formatRelativeTime } from "@/lib/utils";
import { TagIcon, PlusIcon, CubeIcon } from "@heroicons/react/24/outline";

export default function RepoReleasesPage() {
  const { repo } = useRepoContext();
  const { releases, loading, error, refetch } = useRepoReleases(repo.id);
  const { tags } = useTags(repo.id);

  const [isCreating, setIsCreating] = useState(false);
  const [tagName, setTagName] = useState("");
  const [customTag, setCustomTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [targetBranch, setTargetBranch] = useState(repo.default_branch || "main");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPrerelease, setIsPrerelease] = useState(false);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTag = customTag ? newTagName : tagName;
    if (!finalTag.trim() || !title.trim()) return;

    setActionLoading(true);
    setActionError("");
    try {
      // First, if custom tag, we need to ensure the tag exists.
      if (customTag) {
        await reposApi.createTag(repo.id, {
          name: newTagName,
          ref: targetBranch,
          message: title,
        });
      }

      await reposApi.createRelease(repo.id, {
        tag_name: finalTag,
        title,
        body,
        is_prerelease: isPrerelease,
        is_draft: false,
      });

      setIsCreating(false);
      setTagName("");
      setNewTagName("");
      setCustomTag(false);
      setTitle("");
      setBody("");
      setIsPrerelease(false);
      refetch();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to create release");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Releases</h2>
          <p className="text-sm text-zinc-400">Track and publish software versions.</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            <PlusIcon className="h-4 w-4" />
            Draft a new release
          </button>
        )}
      </div>

      {isCreating && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
          <form onSubmit={handleCreateRelease} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-200">Choose a tag</label>
                  {!customTag ? (
                    <div className="flex flex-col gap-2">
                      <select
                        value={tagName}
                        onChange={(e) => setTagName(e.target.value)}
                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select an existing tag...</option>
                        {tags.map((t) => (
                          <option key={t.name} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomTag(true);
                          setTagName("");
                        }}
                        className="text-left text-xs font-medium text-blue-500 hover:underline"
                      >
                        + Create a new tag
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="e.g. v1.0.0"
                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-blue-500 focus:outline-none"
                      />
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-400">Target branch</label>
                        <input
                          type="text"
                          value={targetBranch}
                          onChange={(e) => setTargetBranch(e.target.value)}
                          placeholder="e.g. main"
                          className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomTag(false);
                          setNewTagName("");
                        }}
                        className="text-xs font-medium text-zinc-500 hover:text-white hover:underline"
                      >
                        Cancel new tag
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:w-2/3 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-200">Release title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Initial public release"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-200">Describe this release</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="min-h-[200px] w-full resize-y rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-300 focus:border-blue-500 focus:outline-none"
                    placeholder="Describe the changes in this release..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="prerelease"
                    checked={isPrerelease}
                    onChange={(e) => setIsPrerelease(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-green-600 focus:ring-green-600"
                  />
                  <label htmlFor="prerelease" className="text-sm text-zinc-200">Set as a pre-release</label>
                </div>
                <p className="pl-6 text-xs text-zinc-500">
                  We&apos;ll point out that this release is not production ready.
                </p>

                {actionError && (
                  <p className="text-sm text-rose-400">{actionError}</p>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="submit"
                    disabled={actionLoading || (!tagName && (!customTag || !newTagName)) || !title.trim()}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading ? <Spinner size="sm" className="mr-2 inline" /> : null}
                    Publish release
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading && !releases.length ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : null}

      {!loading && error ? <p className="px-4 py-10 text-center text-sm text-rose-400">{error}</p> : null}

      {!loading && !error && releases.length === 0 && !isCreating ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 border-dashed py-24">
          <TagIcon className="mb-4 h-12 w-12 text-zinc-700" />
          <h3 className="mb-2 text-lg font-semibold text-white">There aren&apos;t any releases here</h3>
          <p className="mb-6 text-sm text-zinc-400">Releases are published iterations of your software.</p>
          <button
            onClick={() => setIsCreating(true)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            Create a new release
          </button>
        </div>
      ) : null}

      {!loading && !error && releases.length > 0 ? (
        <div className="space-y-12">
          {releases.map((release: RepoRelease) => (
            <div key={release.id} className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/4 shrink-0">
                <div className="sticky top-20 flex flex-col gap-1">
                  <h3 className="text-lg font-semibold text-white break-words">{release.title}</h3>
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                    <TagIcon className="h-4 w-4" />
                    <span>{release.tag_name}</span>
                  </div>
                  {release.is_prerelease && (
                    <span className="mt-2 inline-flex w-fit rounded-full border border-yellow-500/50 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-500">
                      Pre-release
                    </span>
                  )}
                  {release.is_draft && (
                    <span className="mt-2 inline-flex w-fit rounded-full border border-zinc-600 bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-400">
                      Draft
                    </span>
                  )}
                </div>
              </div>
              
              <div className="md:w-3/4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
                  <div className="border-b border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-bold text-blue-400">
                        {release.author?.name?.charAt(0).toUpperCase() || "A"}
                      </div>
                      <strong className="text-zinc-200">{release.author?.name}</strong> released this {formatRelativeTime(release.published_at || release.created_at)}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {release.body ? (
                      <article className="prose prose-invert max-w-none prose-sm text-zinc-300">
                        <pre className="font-sans whitespace-pre-wrap">{release.body}</pre>
                      </article>
                    ) : (
                      <p className="text-sm italic text-zinc-500">No description provided.</p>
                    )}
                  </div>
                  
                  <div className="border-t border-zinc-800 bg-zinc-900/30 p-4">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Assets</h4>
                    <div className="flex flex-col gap-2">
                       <Link
                          href={`/repos/${repo.id}/releases/${release.id}/download/source.zip`}
                          className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-4 py-3 hover:bg-zinc-800"
                        >
                          <div className="flex items-center gap-3">
                            <CubeIcon className="h-5 w-5 text-zinc-400" />
                            <span className="text-sm font-medium text-blue-500">Source code (zip)</span>
                          </div>
                        </Link>
                        <Link
                          href={`/repos/${repo.id}/releases/${release.id}/download/source.tar.gz`}
                          className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-4 py-3 hover:bg-zinc-800"
                        >
                          <div className="flex items-center gap-3">
                            <CubeIcon className="h-5 w-5 text-zinc-400" />
                            <span className="text-sm font-medium text-blue-500">Source code (tar.gz)</span>
                          </div>
                        </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
