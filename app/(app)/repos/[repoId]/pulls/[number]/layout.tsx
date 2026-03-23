"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRepoContext } from "../../layout";
import { usePullRequest } from "@/lib/hooks/useRepos";
import Spinner from "@/components/ui/Spinner";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";

export default function PullRequestLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ repoId: string; number: string }>;
}) {
  const { number } = use(params);
  const { repo } = useRepoContext();
  const pathname = usePathname();
  const { pullRequest: pr, loading, error } = usePullRequest(repo.id, number);

  const tabs = useMemo(() => {
    if (!pr) return [];
    const base = `/repos/${repo.id}/pulls/${pr.number}`;
    return [
      { name: "Conversation", href: base, icon: ChatBubbleLeftRightIcon },
      { name: "Commits", href: `${base}/commits`, icon: ClockIcon, count: pr.commits_count },
      { name: "Files changed", href: `${base}/files`, icon: DocumentTextIcon, count: pr.stats?.files_changed },
    ];
  }, [repo.id, pr]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !pr) {
    return (
      <div className="mx-auto max-w-[1280px] p-4 md:p-8">
        <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-500 font-medium">
          Pull request not found or an error occurred.
        </div>
      </div>
    );
  }

  const isMerged = pr.status === "merged";
  const isClosed = pr.status === "closed";

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            {pr.title} <span className="font-light text-zinc-500">#{pr.number}</span>
          </h1>
        </div>
        {/* Actions like Edit or Close could go here */}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium text-white ${
            isMerged ? "bg-purple-600" : isClosed ? "bg-red-600" : pr.is_draft ? "bg-zinc-600" : "bg-green-600"
          }`}
        >
          {isMerged ? (
            <ArrowsRightLeftIcon className="h-4 w-4" />
          ) : isClosed ? (
            <CheckCircleIcon className="h-4 w-4" />
          ) : (
            <ExclamationCircleIcon className="h-4 w-4" />
          )}
          {isMerged ? "Merged" : isClosed ? "Closed" : pr.is_draft ? "Draft" : "Open"}
        </span>

        <p>
          <span className="font-semibold text-zinc-200">{pr.author?.username}</span> wants to merge{" "}
          {pr.commits_count || 0} commits into{" "}
          <span className="font-mono rounded bg-zinc-800 px-1.5 py-0.5 text-blue-400">{pr.target_branch}</span> from{" "}
          <span className="font-mono rounded bg-zinc-800 px-1.5 py-0.5 text-blue-400">{pr.source_branch}</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex overflow-x-auto border-b border-zinc-800">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => {
            // Active if exact match for conversation, or starts with href for others
            const isActive =
              tab.name === "Conversation" ? pathname === tab.href : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-blue-500 text-white"
                    : "border-transparent text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
                {tab.count !== undefined && (
                  <span className="ml-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                    {tab.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Subpage Content */}
      <div className="w-full">{children}</div>
    </div>
  );
}
