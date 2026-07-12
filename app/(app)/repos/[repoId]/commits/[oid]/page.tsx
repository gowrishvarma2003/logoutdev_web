"use client";

import { use } from "react";
import Link from "next/link";
import { useRepoContext } from "../../layout";
import { useCommitDetail } from "@/lib/hooks/useRepos";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { formatRelativeTime } from "@/lib/utils";
import { DocumentIcon, CodeBracketIcon } from "@heroicons/react/24/outline";
import ProductivityContextAction from "@/components/productivity/ProductivityContextAction";

export default function RepoCommitDetailPage({
  params,
}: {
  params: Promise<{ repoId: string; oid: string }>;
}) {
  const { oid } = use(params);
  const { repo } = useRepoContext();
  const { commit, loading, error } = useCommitDetail(repo.id, oid);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !commit) {
    return (
      <EmptyState
        icon={<CodeBracketIcon className="h-10 w-10" />}
        title="Commit not found"
        description={error || "This commit does not exist in the repository."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border-default bg-surface/50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-text-primary break-words">{commit.message}</h2>
            {commit.body && (
              <pre className="mt-4 whitespace-pre-wrap font-sans text-sm text-text-secondary">
                {commit.body}
              </pre>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <ProductivityContextAction title={commit.message} description={`Commit ${commit.oid}${commit.body ? `\n\n${commit.body}` : ""}`} relation={{ target_type: "repository", target_id: repo.id }} variant="outline" />
            <Link
              href={`/repos/${repo.id}?ref=${commit.oid}`}
              className="rounded-lg border border-border-strong bg-surface-hover px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-active hover:text-text-primary"
            >
              Browse files
            </Link>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3 border-t border-border-default/50 pt-4 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-bold text-blue-400">
              {commit.author_name.charAt(0).toUpperCase()}
            </div>
            <strong className="text-text-secondary">{commit.author_name}</strong>
          </div>
          <span>committed {formatRelativeTime(commit.authored_at)}</span>

          <div className="flex-1" />

          {/* Parents */}
          <div className="flex items-center gap-2 font-mono text-text-disabled">
            <span>{commit.parent_oids.length > 1 ? "parents" : "parent"}</span>
            {commit.parent_oids.map((p) => (
              <Link key={p} href={`/repos/${repo.id}/commits/${p}`} className="text-blue-500 hover:underline">
                {p.substring(0, 7)}
              </Link>
            ))}
          </div>

          <span className="font-mono text-text-disabled">commit {commit.short_oid}</span>
        </div>
      </div>

      <div className="flex items-center gap-8 pl-2">
        <div className="flex items-center gap-2 text-sm text-text-secondary font-medium">
          <DocumentIcon className="h-4 w-4 text-text-disabled" />
          Showing {commit.stats.files_changed} changed {commit.stats.files_changed === 1 ? 'file' : 'files'}
        </div>
        <div className="flex items-center gap-3 text-sm font-medium">
          <span className="text-green-500">+{commit.stats.additions} additions</span>
          <span className="text-red-500">-{commit.stats.deletions} deletions</span>
        </div>
      </div>

      <div className="space-y-6">
        {commit.files.map((file) => (
          <div key={file.path} className="overflow-hidden rounded-xl border border-border-default bg-app">
            <div className="flex items-center justify-between border-b border-border-default bg-surface/50 px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-4">
                <span className="text-xs font-mono text-text-disabled">
                  <span className="text-green-500">+{file.additions}</span>{" "}
                  <span className="text-red-500">-{file.deletions}</span>
                </span>
                <span className="truncate text-sm font-medium text-text-secondary">
                  {file.path}
                </span>
                {file.status !== "modified" && (
                  <span className="rounded-full border border-border-strong px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-disabled">
                    {file.status}
                  </span>
                )}
              </div>
              <Link
                href={`/repos/${repo.id}?ref=${commit.oid}&path=${encodeURIComponent(file.path)}&view=blob`}
                className="rounded-md border border-border-strong bg-surface-hover px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-active"
              >
                View
              </Link>
            </div>
            
            {file.patch ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs text-text-secondary border-spacing-0">
                  <tbody className="divide-y divide-border-default/20">
                    {file.patch.split("\n").map((line, idx) => {
                      if (!line && idx === file.patch!.split("\n").length - 1) return null;
                      
                      const isAdded = line.startsWith("+") && !line.startsWith("+++");
                      const isDeleted = line.startsWith("-") && !line.startsWith("---");
                      const isHeader = line.startsWith("@@");

                      let lineClass = "hover:bg-surface-hover/50 transition-colors";
                      if (isAdded) lineClass = "bg-[#2ea043]/10 text-green-400";
                      else if (isDeleted) lineClass = "bg-[#da3633]/10 text-red-400";
                      else if (isHeader) lineClass = "bg-blue-500/10 text-blue-400 font-medium";

                      return (
                        <tr key={idx} className={lineClass}>
                          <td className="w-10 select-none border-r border-border-default/50 px-2 text-right text-[10px] text-text-disabled">
                            {isAdded ? "" : idx} 
                          </td>
                          <td className="w-10 select-none border-r border-border-default/50 px-2 text-right text-[10px] text-text-disabled">
                            {isDeleted ? "" : idx}
                          </td>
                          <td className="whitespace-pre px-4 py-0.5">
                            {line}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-text-disabled">
                Binary or empty file not previewed.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
