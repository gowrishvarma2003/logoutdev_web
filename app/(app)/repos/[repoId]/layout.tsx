"use client";

import { use, createContext, useContext, ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRepo } from "@/lib/hooks/useRepos";
import * as reposApi from "@/lib/services/reposApi";
import { Repository } from "@/lib/types";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { FolderIcon } from "@/components/ui/Icons";
import RepoCollaborationBanner from "@/components/repos/RepoCollaborationBanner";
import RepoAiDocBanner from "@/components/repos/RepoAiDocBanner";
import { CodeBracketIcon, ClockIcon, Cog6ToothIcon, StarIcon, ArrowsRightLeftIcon, TagIcon, QueueListIcon, ChartBarIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

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

  const handleToggleStar = async () => {
    if (!repo || isStarring) return;
    setIsStarring(true);
    try {
      await reposApi.toggleStar(repo.id);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle star");
    } finally {
      setIsStarring(false);
    }
  };

  const handleFork = async () => {
    if (!repo || isForking) return;
    setIsForking(true);
    try {
      const res = await reposApi.forkRepository(repo.id);
      router.push(`/repos/${res.repo.id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to fork repository");
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
    { name: "Branches", href: `/repos/${repo.id}/branches`, icon: ArrowsRightLeftIcon },
    { name: "Pull Requests", href: `/repos/${repo.id}/pulls`, icon: QueueListIcon },
    { name: "Releases", href: `/repos/${repo.id}/releases`, icon: TagIcon },
    { name: "Forks", href: `/repos/${repo.id}/forks`, icon: ArrowsRightLeftIcon },
    { name: "Insights", href: `/repos/${repo.id}/insights`, icon: ChartBarIcon },
    ...(canManageSettings ? [{ name: "Settings", href: `/repos/${repo.id}/settings`, icon: Cog6ToothIcon }] : []),
  ];

  return (
    <RepoContext.Provider value={{ repo, refetch }}>
      <div className="min-h-screen bg-zinc-950">
        {/* Repo Header */}
        <div className="border-b border-zinc-800 bg-zinc-950 pt-6">
          <div className="mx-auto max-w-[1280px] px-4 md:px-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xl text-zinc-300">
                <FolderIcon className="h-6 w-6 text-zinc-500" />
                <Link href={`/`} className="hover:text-blue-500 hover:underline">
                  {repo.owner?.username}
                </Link>
                <span className="text-zinc-500">/</span>
                <Link href={`/repos/${repo.id}`} className="font-semibold text-white hover:text-blue-500 hover:underline">
                  {repo.name}
                </Link>
                <span className="ml-2 rounded-full border border-zinc-700 px-2 py-0.5 text-xs font-medium capitalize text-zinc-400">
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
                  <Link
                    href={`/spaces/${repo.attached_space.id}`}
                    className="rounded-md border border-sky-400/20 px-3 py-1.5 text-xs font-medium text-sky-300 transition-colors hover:bg-sky-500/10"
                  >
                    Open Space
                  </Link>
                ) : null}
                <div className="flex h-[28px] overflow-hidden rounded-md border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-300">
                  <button 
                    onClick={handleToggleStar}
                    disabled={isStarring}
                    className="flex items-center gap-1.5 border-r border-zinc-700 px-3 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    <StarIcon className={`h-4 w-4 ${repo.is_starred ? "fill-yellow-500 text-yellow-500" : ""}`} />
                    {repo.is_starred ? "Unstar" : "Star"}
                  </button>
                  <span className="flex items-center px-3 font-semibold bg-zinc-900">
                    {repo.star_count || 0}
                  </span>
                </div>

                <div className="flex h-[28px] overflow-hidden rounded-md border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-300">
                  <button 
                    onClick={handleFork}
                    disabled={isForking}
                    className="flex items-center gap-1.5 border-r border-zinc-700 px-3 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    {isForking ? <Spinner size="sm" /> : <ArrowsRightLeftIcon className="h-4 w-4" />}
                    Fork
                  </button>
                  <Link href={`/repos/${repo.id}/forks`} className="flex items-center px-3 hover:bg-zinc-700 font-semibold bg-zinc-900 transition-colors">
                    {repo.fork_count || 0}
                  </Link>
                </div>
              </div>
            </div>

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
                        ? "border-[#f78166] text-white"
                        : "border-transparent text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    <tab.icon className={`h-4 w-4 ${isActive ? "text-[#f78166]" : "text-zinc-500"}`} />
                    {tab.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Action Content */}
        <main className="mx-auto max-w-[1280px] px-4 py-6 md:px-8">
          <div className="mb-6">
            <RepoCollaborationBanner repo={repo} />
          </div>
          <div className="mb-6">
            <RepoAiDocBanner repo={repo} />
          </div>
          {children}
        </main>
      </div>
    </RepoContext.Provider>
  );
}
