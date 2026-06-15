"use client";

import Link from "next/link";
import { useState } from "react";
import { useRepositoryList } from "@/lib/hooks/useRepos";
import Spinner from "@/components/ui/Spinner";
import { SearchIcon, FolderIcon } from "@/components/ui/Icons";
import { StarIcon } from "@primer/octicons-react";
import { formatRelativeTime } from "@/lib/utils";
import CreateRepoModal from "./CreateRepoModal";

const LANGUAGE_COLORS: Record<string, string> = {
  "C#": "#178600",
  "C++": "#f34b7d",
  C: "#555555",
  CSS: "#563d7c",
  Dart: "#00B4AB",
  Dockerfile: "#384d54",
  Go: "#00ADD8",
  HTML: "#e34c26",
  Java: "#b07219",
  JavaScript: "#f1e05a",
  Kotlin: "#A97BFF",
  Makefile: "#427819",
  PHP: "#4F5D95",
  Python: "#3572A5",
  Ruby: "#701516",
  Rust: "#dea584",
  SCSS: "#c6538c",
  SQL: "#e38c00",
  Shell: "#89e051",
  Swift: "#F05138",
  TypeScript: "#3178c6",
  Vue: "#41b883",
};

export default function RepositoriesPage() {
  const [scope, setScope] = useState<"all" | "mine" | "shared" | "public">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { repos, loading, error, refetch } = useRepositoryList({
    scope,
    q: query || undefined,
    page,
    limit: 30,
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="border-b border-zinc-800 bg-zinc-950 px-4 md:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex items-center justify-between py-5">
            <h1 className="text-xl font-semibold text-white">Repositories</h1>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <FolderIcon className="h-4 w-4" />
              New
            </button>
          </div>

          <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 md:max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Find a repository..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value as "all" | "mine" | "shared" | "public");
                  setPage(1);
                }}
                className="rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-3 pr-8 text-sm text-zinc-300 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="public">Public</option>
                <option value="mine">Owned</option>
                <option value="shared">Shared</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] p-4 md:px-8 md:py-6">
        {loading && !repos.length ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : null}

        {error ? <p className="py-12 text-center text-sm text-rose-400">{error}</p> : null}

        {!loading && !error && repos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 border-dashed py-24">
            {query || scope !== "all" ? (
              <>
                <h3 className="mb-2 text-lg font-semibold text-white">No repositories match that criteria.</h3>
                <button
                  onClick={() => {
                    setQuery("");
                    setScope("all");
                  }}
                  className="text-sm font-medium text-blue-500 hover:underline"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <FolderIcon className="mb-4 h-12 w-12 text-zinc-700" />
                <h3 className="mb-2 text-lg font-semibold text-white">You don&apos;t have any repositories</h3>
                <p className="mb-6 text-sm text-zinc-400">Repositories contain all your project files and revision history.</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  Create a repository
                </button>
              </>
            )}
          </div>
        ) : null}

        {!loading && !error && repos.length > 0 ? (
          <div className="divide-y divide-zinc-800 border-t border-zinc-800">
            {repos.map((repo) => (
              <div key={repo.id} className="py-5 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Link
                      href={`/repos/${repo.id}`}
                      className="text-lg font-semibold text-blue-500 hover:underline break-words"
                    >
                      {repo.owner?.username ? `${repo.owner.username}/` : ""}{repo.name}
                    </Link>
                    <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-400 capitalize">
                      {repo.visibility}
                    </span>
                  </div>

                  {repo.forked_from ? (
                    <p className="mb-2 text-xs text-zinc-500">
                      Forked from <Link href={`/repos/${repo.forked_from.id}`} className="hover:text-blue-500 hover:underline">{repo.forked_from.owner?.username}/{repo.forked_from.name}</Link>
                    </p>
                  ) : null}

                  {repo.description ? (
                    <p className="mb-3 text-sm text-zinc-400 pr-4 line-clamp-2 md:w-3/4">
                      {repo.description}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                    {repo.language ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || "#8b949e" }}
                        />
                        <span>{repo.language}</span>
                      </div>
                    ) : null}

                    {(repo.star_count || 0) > 0 ? (
                      <span className="flex items-center gap-1">
                        <StarIcon size={14} />
                        <span>{repo.star_count}</span>
                      </span>
                    ) : null}

                    {(repo.fork_count || 0) > 0 ? (
                      <Link href={`/repos/${repo.id}/forks`} className="flex items-center gap-1 hover:text-blue-500">
                        <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M5 3.254V3.25v.005a.75.75 0 1 1-1.5 0V2.75C3.5 1.784 4.284 1 5.25 1h5.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 10.75 15h-5.5A1.75 1.75 0 0 1 3.5 13.25V8.75a.75.75 0 0 1 1.5 0v4.5c0 .138.112.25.25.25h5.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25h-5.5a.25.25 0 0 0-.25.25v.504Z"></path></svg>
                        <span>{repo.fork_count}</span>
                      </Link>
                    ) : null}

                    <span>Updated {formatRelativeTime(repo.updated_at)}</span>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-end shrink-0 gap-2">
                  <div className="h-[28px] flex overflow-hidden rounded-md border border-zinc-700 bg-zinc-800 font-medium text-xs text-zinc-300">
                    <button className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-zinc-700 border-r border-zinc-700">
                      <StarIcon size={14} className="text-zinc-400" />
                      Star
                    </button>
                    <button className="flex items-center px-2 py-1 hover:bg-zinc-700">
                      <span className="font-semibold px-0.5">{repo.star_count || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {page > 1 || repos.length >= 30 ? (
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 text-sm font-medium text-blue-500 hover:bg-zinc-800 disabled:text-zinc-500 disabled:hover:bg-transparent"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={repos.length < 30}
                className="border-l border-zinc-800 px-4 py-2 text-sm font-medium text-blue-500 hover:bg-zinc-800 disabled:text-zinc-500 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <CreateRepoModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
          setPage(1);
          setQuery("");
          setScope("all");
        }}
      />
    </div>
  );
}
