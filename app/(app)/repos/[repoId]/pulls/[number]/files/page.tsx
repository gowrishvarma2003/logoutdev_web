"use client";

import { use } from "react";
import { useRepoContext } from "../../../layout";
import { usePullRequestDiff } from "@/lib/hooks/useRepos";
import Spinner from "@/components/ui/Spinner";
import { DocumentIcon } from "@heroicons/react/24/outline";

export default function PRFilesPage({
  params,
}: {
  params: Promise<{ repoId: string; number: string }>;
}) {
  const { number } = use(params);
  const { repo } = useRepoContext();
  const { diff, loading, error } = usePullRequestDiff(repo.id, number);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !diff) {
    return (
      <div className="rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
        Failed to load file diffs.
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Diff Stats */}
      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
        <p>
          Showing <span className="font-semibold text-white">{diff.stats.files_changed} changed files</span>{" "}
          with <span className="font-semibold text-green-500">{diff.stats.additions} additions</span> and{" "}
          <span className="font-semibold text-red-500">{diff.stats.deletions} deletions</span>.
        </p>
      </div>

      {/* Files List */}
      <div className="space-y-6">
        {diff.files.map((file) => (
          <div key={file.path} className="overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-2 text-sm">
              <div className="flex items-center gap-2">
                <DocumentIcon className="h-4 w-4 text-zinc-500" />
                <span className="font-mono text-zinc-300">{file.path}</span>
                <span className="ml-2 text-xs text-zinc-500">
                  {file.status === "added" && "New File"}
                  {file.status === "deleted" && "Deleted"}
                  {file.status === "renamed" && "Renamed"}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-green-500">+{file.additions}</span>
                <span className="text-red-500">-{file.deletions}</span>
              </div>
            </div>

            {/* Patch view - Simplified MVP */}
            <div className="overflow-x-auto bg-zinc-950 p-4 font-mono text-xs">
              {file.patch ? (
                <pre className="whitespace-pre">
                  {file.patch.split("\n").map((line: string, idx: number) => {
                    let colorClass = "text-zinc-300";
                    let bgClass = "bg-transparent";

                    if (line.startsWith("+")) {
                      colorClass = "text-green-400";
                      bgClass = "bg-green-500/10";
                    } else if (line.startsWith("-")) {
                      colorClass = "text-red-400";
                      bgClass = "bg-red-500/10";
                    } else if (line.startsWith("@@")) {
                      colorClass = "text-blue-400 text-opacity-80";
                      bgClass = "bg-blue-500/5";
                    }

                    return (
                      <div
                        key={idx}
                        className={`${bgClass} px-2 py-0.5 leading-relaxed`}
                      >
                        <span className={`${colorClass}`}>{line}</span>
                      </div>
                    );
                  })}
                </pre>
              ) : file.status === "added" ? (
                <div className="text-zinc-500 italic text-center p-4">File added (no patch returned)</div>
              ) : file.status === "deleted" ? (
                <div className="text-zinc-500 italic text-center p-4">File deleted</div>
              ) : (
                <div className="text-zinc-500 italic text-center p-4">Binary file not shown.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
