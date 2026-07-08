"use client";

import { use, createContext, useContext, ReactNode, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRepo } from "@/lib/hooks/useRepos";
import * as reposApi from "@/lib/services/reposApi";
import * as cache from "@/lib/services/requestCache";
import { Repository } from "@/lib/types";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { FolderIcon } from "@/components/ui/Icons";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { CodeBracketIcon, ClockIcon, Cog6ToothIcon, StarIcon, ArrowsRightLeftIcon, TagIcon, QueueListIcon, ChartBarIcon, ShieldCheckIcon, ChatBubbleLeftRightIcon, ChevronDownIcon, PlayCircleIcon } from "@heroicons/react/24/outline";

interface RepoContextType {
  repo: Repository;
  refetch: () => void;
}

const RepoContext = createContext<RepoContextType | null>(null);

export function useRepoContext() {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error("useRepoContext must be used within a RepoLayout");
  return ctx;
}

export default function RepoLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);
  const pathname = usePathname();
  const router = useRouter();
  const { repo, loading, error, refetch } = useRepo(repoId);

  const [isStarring, setIsStarring] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [actionError, setActionError] = useState("");

  const [showSpaceMenu, setShowSpaceMenu] = useState(false);
  const spaceMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showSpaceMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (spaceMenuRef.current?.contains(event.target as Node)) return;
      setShowSpaceMenu(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSpaceMenu(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSpaceMenu]);

  const handleToggleStar = async () => {
    if (!repo || isStarring) return;
    setIsStarring(true);
    try {
      await reposApi.toggleStar(repo.id);
      // Star state lives on the repo overview AND the /repos listings (star
      // counts). Bust both so other tabs/pages stay in sync.
      cache.invalidateRepo(repo.id, "overview");
      cache.invalidateRepoListings();
      refetch();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to toggle star");
    } finally {
      setIsStarring(false);
    }
  };

  const handleFork = async () => {
    if (!repo || isForking) return;
    setIsForking(true);
    try {
      const res = await reposApi.forkRepository(repo.id);
      cache.invalidateRepo(repo.id, "forks");
      cache.invalidateRepo(repo.id, "overview");
      cache.invalidateRepoListings();
      router.push(`/repos/${res.repo.id}`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to fork repository");
    } finally {
      setIsForking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div className="p-8">
        <EmptyState
          icon={<FolderIcon className="h-10 w-10" />}
          title="Repository unavailable"
          description={error || "This repository is private or no longer exists."}
        />
      </div>
    );
  }

  const canManageSettings = Boolean(repo.can_manage_general || repo.can_manage_access || repo.can_manage_rules);

  const tabs = [
    { name: "Code", href: `/repos/${repo.id}`, icon: CodeBracketIcon },
    { name: "Commits", href: `/repos/${repo.id}/commits`, icon: ClockIcon },
    { name: "Pull Requests", href: `/repos/${repo.id}/pulls`, icon: QueueListIcon },
    { name: "Actions", href: `/repos/${repo.id}/actions`, icon: PlayCircleIcon },
    { name: "Releases", href: `/repos/${repo.id}/releases`, icon: TagIcon },
    { name: "Forks", href: `/repos/${repo.id}/forks`, icon: ArrowUturnLeftIcon },
    { name: "Insights", href: `/repos/${repo.id}/insights`, icon: ChartBarIcon },
    ...(canManageSettings ? [{ name: "Settings", href: `/repos/${repo.id}/settings`, icon: Cog6ToothIcon }] : []),
  ];

  return (
    <RepoContext.Provider value={{ repo, refetch }}>
      <div className="min-h-screen bg-app">
        {/* Repo Header */}
        <div className="border-b border-border-default bg-app pt-6">
          <div className="mx-auto max-w-[1280px] px-4 md:px-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xl text-text-secondary">
                <FolderIcon className="h-6 w-6 text-text-disabled" />
                <Link href={`/profile/${repo.owner?.username || repo.owner_id}`} className="hover:text-blue-500 hover:underline">
                  {repo.owner?.username}
                </Link>
                <span className="text-text-disabled">/</span>
                <Link href={`/repos/${repo.id}`} className="font-semibold text-text-primary hover:text-blue-500 hover:underline">
                  {repo.name}
                </Link>
                <span className="ml-2 rounded-full border border-border-strong px-2 py-0.5 text-xs font-medium capitalize text-text-muted">
                  {repo.visibility}
                </span>
                {repo.protected_default_branch ? (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                    <ShieldCheckIcon className="h-3.5 w-3.5" />
                    Protected {repo.default_branch}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                {repo.forked_from ? (
                  <Link
                    href={`/repos/${repo.forked_from.id}/pulls/new?head_repo_id=${encodeURIComponent(repo.id)}`}
                    className="rounded-md border border-emerald-400/20 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/10"
                  >
                    Contribute Upstream
                  </Link>
                ) : null}
                {repo.attached_space ? (
                  <div ref={spaceMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSpaceMenu((curr) => !curr)}
                      className="flex h-[28px] items-center gap-1.5 rounded-md border border-sky-400/20 px-3 text-xs font-medium text-sky-300 transition-colors hover:bg-sky-50/10"
                      aria-expanded={showSpaceMenu}
                      aria-haspopup="menu"
                    >
                      <span>Space: {repo.attached_space.name}</span>
                      <ChevronDownIcon className={`h-3 w-3 shrink-0 text-sky-400 transition-transform ${showSpaceMenu ? "rotate-180" : ""}`} />
                    </button>

                    {showSpaceMenu ? (
                      <div
                        className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-border-default bg-app shadow-2xl shadow-black/60"
                        role="menu"
                      >
                        <div className="border-b border-border-default px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-disabled">Space Collaboration</p>
                        </div>
                        <div className="py-1">
                          <Link
                            href={`/spaces/${repo.attached_space.id}`}
                            onClick={() => setShowSpaceMenu(false)}
                            role="menuitem"
                            className="flex items-center gap-2 px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
                          >
                            Open Space Home
                          </Link>
                          <Link
                            href={`/spaces/${repo.attached_space.id}/work`}
                            onClick={() => setShowSpaceMenu(false)}
                            role="menuitem"
                            className="flex items-center gap-2 px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
                          >
                            View Work Planning
                          </Link>
                          <Link
                            href={`/spaces/${repo.attached_space.id}/discussions`}
                            onClick={() => setShowSpaceMenu(false)}
                            role="menuitem"
                            className="flex items-center gap-2 px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
                          >
                            Space Discussions
                          </Link>
                          {repo.can_manage_general ? (
                            <Link
                              href={`/launches/new?spaceId=${encodeURIComponent(repo.attached_space.id)}&spaceName=${encodeURIComponent(repo.attached_space.name)}&repoId=${encodeURIComponent(repo.id)}&repoName=${encodeURIComponent(repo.name)}&repoDescription=${encodeURIComponent(repo.description || "")}`}
                              onClick={() => setShowSpaceMenu(false)}
                              role="menuitem"
                              className="flex items-center gap-2 border-t border-border-subtle px-3 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:bg-surface hover:text-emerald-300"
                            >
                              Launch Product
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {repo.attached_space ? (
                  <Link
                    href={`/spaces/${repo.attached_space.id}/discussions`}
                    className="flex h-[28px] items-center gap-1.5 rounded-md border border-border-strong bg-surface-hover px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-active hover:text-text-primary"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-text-muted" />
                    <span>Discussions</span>
                  </Link>
                ) : null}
                <div className="flex h-[28px] overflow-hidden rounded-md border border-border-strong bg-surface-hover text-xs font-medium text-text-secondary">
                  <button 
                    onClick={handleToggleStar}
                    disabled={isStarring}
                    className="flex items-center gap-1.5 border-r border-border-strong px-3 hover:bg-surface-active transition-colors disabled:opacity-50"
                  >
                    <StarIcon className={`h-4 w-4 ${repo.is_starred ? "fill-yellow-500 text-yellow-500" : ""}`} />
                    {repo.is_starred ? "Unstar" : "Star"}
                  </button>
                  <span className="flex items-center px-3 font-semibold bg-surface">
                    {repo.star_count || 0}
                  </span>
                </div>

                <div className="flex h-[28px] overflow-hidden rounded-md border border-border-strong bg-surface-hover text-xs font-medium text-text-secondary">
                  <button 
                    onClick={handleFork}
                    disabled={isForking}
                    className="flex items-center gap-1.5 border-r border-border-strong px-3 hover:bg-surface-active transition-colors disabled:opacity-50"
                  >
                    {isForking ? <Spinner size="sm" /> : <ArrowsRightLeftIcon className="h-4 w-4" />}
                    Fork
                  </button>
                  <Link href={`/repos/${repo.id}/forks`} className="flex items-center px-3 hover:bg-surface-active font-semibold bg-surface transition-colors">
                    {repo.fork_count || 0}
                  </Link>
                </div>
              </div>
            </div>

            {actionError && (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2">
                <p className="text-sm text-rose-400">{actionError}</p>
                <button type="button" onClick={() => setActionError("")} className="text-xs text-rose-400 hover:text-rose-300">Dismiss</button>
              </div>
            )}

            {/* Tabs */}
            <nav className="-mb-px flex gap-6 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`flex whitespace-nowrap items-center gap-2 border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-[#f78166] text-text-primary"
                        : "border-transparent text-text-muted hover:border-zinc-500 hover:text-text-secondary"
                    }`}
                  >
                    <tab.icon className={`h-4 w-4 ${isActive ? "text-[#f78166]" : "text-text-disabled"}`} />
                    {tab.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Action Content */}
        <main className="mx-auto max-w-[1280px] px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </RepoContext.Provider>
  );
}
