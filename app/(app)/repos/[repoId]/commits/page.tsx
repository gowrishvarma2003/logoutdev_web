"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRepoContext } from "../layout";
import { useBranches, useRepositoryCommits } from "@/lib/hooks/useRepos";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { CheckIcon, ChevronDownIcon, ClockIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

function getAuthorName(name?: string | null) {
  const normalized = name?.trim();
  return normalized ? normalized : "Unknown author";
}

export default function RepoCommitsPage() {
  const { repo } = useRepoContext();
  const searchParams = useSearchParams();
  const defaultBranch = repo.default_branch || "main";
  const activeRef = searchParams.get("ref") || defaultBranch;
  const author = searchParams.get("author");
  const authorFilter = author ?? "";
  const queryKey = `${activeRef}\0${authorFilter}`;
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const branchMenuRef = useRef<HTMLDivElement | null>(null);
  
  const [pagination, setPagination] = useState({ queryKey, page: 1 });
  const page = pagination.queryKey === queryKey ? pagination.page : 1;
  const { commits, loading, error } = useRepositoryCommits(repo.id, activeRef, undefined, page);
  const { branches } = useBranches(repo.id);

  const branchOptions = useMemo(() => {
    const uniqueBranches = new Map(branches.map((branch) => [branch.name, branch]));

    if (!uniqueBranches.has(activeRef)) {
      uniqueBranches.set(activeRef, {
        name: activeRef,
        oid: "",
        is_default: activeRef === defaultBranch,
        is_head: false,
      });
    }

    return [...uniqueBranches.values()].sort((a, b) => {
      if (a.name === activeRef) return -1;
      if (b.name === activeRef) return 1;
      if (a.name === defaultBranch) return -1;
      if (b.name === defaultBranch) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [activeRef, branches, defaultBranch]);

  useEffect(() => {
    if (!showBranchMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (branchMenuRef.current?.contains(event.target as Node)) return;
      setShowBranchMenu(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowBranchMenu(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showBranchMenu]);

  const branchHref = (branchName: string) => {
    const params = new URLSearchParams();
    params.set("ref", branchName);
    if (author) params.set("author", author);
    return `/repos/${repo.id}/commits?${params.toString()}`;
  };

  const authorHref = (authorName: string) => {
    const params = new URLSearchParams();
    params.set("ref", activeRef);
    params.set("author", authorName);
    return `/repos/${repo.id}/commits?${params.toString()}`;
  };

  const setPage = (nextPage: number | ((current: number) => number)) => {
    setPagination((current) => {
      const currentPage = current.queryKey === queryKey ? current.page : 1;
      const resolvedPage = typeof nextPage === "function" ? nextPage(currentPage) : nextPage;
      return { queryKey, page: resolvedPage };
    });
  };

  const groupedCommits: { date: string; commits: typeof commits }[] = [];
  const normalizedAuthor = authorFilter.toLowerCase();
  const filteredCommits = normalizedAuthor
    ? commits.filter((commit) => getAuthorName(commit.author_name).toLowerCase().includes(normalizedAuthor))
    : commits;

  filteredCommits.forEach((commit) => {
    const date = new Date(commit.authored_at);
    const dateString = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const lastGroup = groupedCommits[groupedCommits.length - 1];
    if (lastGroup && lastGroup.date === dateString) {
      lastGroup.commits.push(commit);
    } else {
      groupedCommits.push({ date: dateString, commits: [commit] });
    }
  });

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
  };

  return (
    <div className="space-y-6">
      {/* Branch selector & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div ref={branchMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setShowBranchMenu((current) => !current)}
            className="flex min-w-0 items-center gap-2 rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
            aria-expanded={showBranchMenu}
            aria-haspopup="menu"
          >
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="shrink-0 fill-current text-zinc-400">
              <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0Z"></path>
            </svg>
            <span className="max-w-[150px] truncate">{activeRef}</span>
            <ChevronDownIcon className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${showBranchMenu ? "rotate-180" : ""}`} />
          </button>

          {showBranchMenu ? (
            <div
              className="absolute left-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40"
              role="menu"
            >
              <div className="border-b border-zinc-800 px-3 py-2">
                <p className="text-xs font-semibold text-zinc-300">Switch branches</p>
              </div>
              <div className="max-h-80 overflow-y-auto py-1">
                {branchOptions.map((branch) => {
                  const isActive = branch.name === activeRef;
                  const isDefault = branch.name === defaultBranch;

                  return (
                    <Link
                      key={branch.name}
                      href={branchHref(branch.name)}
                      onClick={() => setShowBranchMenu(false)}
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
                    >
                      <CheckIcon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-400" : "text-transparent"}`} />
                      <span className="min-w-0 flex-1 truncate">{branch.name}</span>
                      {isDefault ? (
                        <span className="shrink-0 rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                          Default
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {author && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Author: <strong className="text-white">{author}</strong></span>
            <Link href={`/repos/${repo.id}/commits?ref=${encodeURIComponent(activeRef)}`} className="rounded-md bg-zinc-800 p-1 text-zinc-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {loading && !commits.length ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : null}

      {!loading && error ? <p className="px-4 py-10 text-center text-sm text-rose-400">{error}</p> : null}

      {!loading && !error && filteredCommits.length === 0 ? (
        <EmptyState
          icon={<ClockIcon className="h-10 w-10" />}
          title="No commits yet"
          description={author ? "No commits found for this author." : "Push the first commit to populate repository history."}
        />
      ) : null}

      {!loading && !error && filteredCommits.length > 0 ? (
        <div className="space-y-6">
          {groupedCommits.map((group) => (
            <div key={group.date}>
              <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500">
                <ClockIcon className="h-4 w-4" />
                <span>Commits on {group.date}</span>
              </div>
              
              <div className="relative border-l border-zinc-800 ml-2 space-y-4 pb-2">
                {group.commits.map((commit) => (
                  <div key={commit.oid} className="relative pl-6">
                    {/* Timeline dot */}
                    <div className="absolute left-[-5px] top-6 h-2 w-2 rounded-full border border-zinc-500 bg-zinc-950" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 hover:bg-zinc-900/80 transition-colors">
                      <div className="min-w-0 flex-1">
                        <Link 
                          href={`/repos/${repo.id}/commits/${commit.oid}`} 
                          className="text-sm font-semibold text-zinc-100 hover:text-blue-500 hover:underline break-words"
                        >
                          {commit.message}
                        </Link>
                        
                        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                          <Link href={authorHref(getAuthorName(commit.author_name))} className="flex items-center gap-1.5 hover:text-blue-400">
                            <div className="h-4 w-4 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-400 text-[9px]">
                              {getAuthorName(commit.author_name).charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-zinc-300">{getAuthorName(commit.author_name)}</span>
                          </Link>
                          <span>committed</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex overflow-hidden rounded-md border border-zinc-700 bg-zinc-800 text-xs text-zinc-300">
                          <button 
                            onClick={() => handleCopyHash(commit.oid)}
                            className="border-r border-zinc-700 px-2 py-1 hover:bg-zinc-700" 
                            title="Copy full SHA"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                          <Link 
                            href={`/repos/${repo.id}/commits/${commit.oid}`}
                            className="px-2.5 py-1 hover:bg-zinc-700 hover:text-blue-400 font-mono transition-colors"
                          >
                            {commit.short_oid}
                          </Link>
                        </div>
                        <Link
                          href={`/repos/${repo.id}?ref=${commit.oid}`}
                          className="rounded-md border border-zinc-700 p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                          title="Browse files at this point in history"
                        >
                          <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-current">
                            <path d="M11.28 3.22 4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L13.94 8l-3.72-3.72a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215Zm-6.56 0a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L2.06 8l3.72 3.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L.47 8.53a.75.75 0 0 1 0-1.06Z"></path>
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 text-sm font-medium text-blue-500 hover:bg-zinc-800 disabled:text-zinc-500 disabled:hover:bg-transparent transition-colors"
              >
                Newer
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={commits.length < 20}
                className="border-l border-zinc-800 px-4 py-2 text-sm font-medium text-blue-500 hover:bg-zinc-800 disabled:text-zinc-500 disabled:hover:bg-transparent transition-colors"
              >
                Older
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
