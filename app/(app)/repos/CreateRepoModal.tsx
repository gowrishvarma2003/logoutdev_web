"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Repository, RepositoryVisibility } from "@/lib/types";
import * as reposApi from "@/lib/services/reposApi";
import * as cache from "@/lib/services/requestCache";
import Spinner from "@/components/ui/Spinner";

export default function CreateRepoModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (repo: Repository) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<RepositoryVisibility>("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await reposApi.createRepository({
        name,
        description,
        visibility,
        default_branch: "main",
      });
      cache.invalidateRepoListings();
      onSuccess(res.repo);
      onClose();
      router.push(`/repos/${res.repo.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create repository");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 cursor-pointer bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border-default bg-app shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-default p-4">
          <h2 className="text-lg font-semibold text-text-primary">Create a new repository</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <p className="mb-6 text-sm text-text-muted">
            A repository contains all project files, including the revision history.
          </p>

          <div className="space-y-5">
            <div>
              <label htmlFor="repo-name" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Repository name <span className="text-red-500">*</span>
              </label>
              <input
                id="repo-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. hello-world"
                className="w-full rounded-lg border border-border-default bg-surface/50 px-3 py-2 text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
                autoFocus
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="repo-description" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Description <span className="text-text-disabled">(optional)</span>
              </label>
              <input
                id="repo-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-surface/50 px-3 py-2 text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                maxLength={200}
              />
            </div>

            <div className="border-t border-border-default pt-5">
              <label className="mb-3 block text-sm font-medium text-text-secondary">Visibility</label>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <div className="flex h-5 items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={visibility === "public"}
                      onChange={(e) => setVisibility(e.target.value as RepositoryVisibility)}
                      className="h-4 w-4 border-border-strong bg-surface text-blue-600 focus:ring-blue-600 focus:ring-offset-surface"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">Public</div>
                    <div className="text-xs text-text-muted">Anyone on the internet can see this repository. You choose who can commit.</div>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3">
                  <div className="flex h-5 items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={visibility === "private"}
                      onChange={(e) => setVisibility(e.target.value as RepositoryVisibility)}
                      className="h-4 w-4 border-border-strong bg-surface text-blue-600 focus:ring-blue-600 focus:ring-offset-surface"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">Private</div>
                    <div className="text-xs text-text-muted">You choose who can see and commit to this repository.</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-md bg-red-900/30 p-3 text-sm text-red-400 border border-red-900/50">
              {error}
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-border-default pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-text-primary hover:bg-green-700 disabled:opacity-50"
            >
               {loading ? <Spinner size="sm" className="text-text-primary" /> : null}
              Create repository
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
