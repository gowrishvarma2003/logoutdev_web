"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRepoContext } from "../layout";
import { useRepositoryBlob } from "@/lib/hooks/useRepos";
import * as reposApi from "@/lib/services/reposApi";
import Spinner from "@/components/ui/Spinner";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import { DocumentIcon } from "@heroicons/react/24/outline";

export default function EditFilePage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);
  const { repo } = useRepoContext();
  const searchParams = useSearchParams();
  const router = useRouter();

  const ref = searchParams.get("ref") || repo?.default_branch || "main";
  const filePath = searchParams.get("path");

  const { blob, loading, error: fetchError } = useRepositoryBlob(repoId, ref, filePath || undefined);

  const [content, setContent] = useState<string>("");
  const [commitMessage, setCommitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (blob && !blob.is_binary) {
      setContent(blob.content || "");
    }
  }, [blob]);

  if (!repo.can_push) {
    return (
      <EmptyState
        icon={<DocumentIcon className="h-10 w-10" />}
        title="Write access required"
        description="Editing files from the website requires write access to this repository."
      />
    );
  }

  if (!filePath) {
    return (
      <EmptyState
        icon={<DocumentIcon className="h-10 w-10" />}
        title="No file selected"
        description="A path parameter is required to edit a file."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (fetchError || !blob) {
    return (
      <EmptyState
        icon={<DocumentIcon className="h-10 w-10" />}
        title="File unavailable"
        description={fetchError || "The file does not exist or has been deleted."}
      />
    );
  }

  if (blob.is_binary) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <DocumentIcon className="h-12 w-12 text-zinc-600 mb-4" />
        <h2 className="text-xl font-semibold text-white">Cannot edit binary file</h2>
        <p className="mt-2 text-sm text-zinc-400">Binary representations are not supported in the web editor.</p>
        <Link
          href={`/repos/${repo.id}?ref=${encodeURIComponent(ref)}&path=${encodeURIComponent(filePath)}&view=blob`}
          className="mt-6 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Return to file
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePath.trim()) return;

    // Generate default commit message if empty
    const finalMessage = commitMessage.trim() || `Update ${filePath}`;

    setIsSubmitting(true);
    setError("");

    try {
      await reposApi.writeFileContent(repo.id, {
        branch: ref,
        path: filePath,
        content,
        message: finalMessage,
      });

      router.push(`/repos/${repo.id}?ref=${encodeURIComponent(ref)}&path=${encodeURIComponent(filePath)}&view=blob`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to commit changes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href={`/repos/${repo.id}?ref=${encodeURIComponent(ref)}`} className="text-blue-500 hover:underline">
          {repo.name}
        </Link>
        <span>/</span>
        <span className="font-semibold text-zinc-200">{filePath}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-2 font-mono text-sm text-white">
          <div className="flex gap-4">
            <span className="border-b-2 border-[#f78166] py-1 px-1">Edit file</span>
          </div>
        </div>
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[500px] w-full resize-y bg-transparent p-4 font-mono text-sm text-zinc-300 focus:outline-none"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Commit changes</h3>
        
        {error && (
          <div className="mb-4 rounded-md border border-rose-900/50 bg-rose-500/10 p-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder={`Update ${filePath}`}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-3 border-t border-zinc-800/50 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || content === blob.content}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? <Spinner size="sm" className="mr-2 inline" /> : null}
              Commit changes
            </button>
            <Link
              href={`/repos/${repo.id}?ref=${encodeURIComponent(ref)}&path=${encodeURIComponent(filePath)}&view=blob`}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
