"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRepoContext } from "../layout";
import * as reposApi from "@/lib/services/reposApi";
import Spinner from "@/components/ui/Spinner";

export default function NewFilePage() {
  const { repo } = useRepoContext();
  const searchParams = useSearchParams();
  const router = useRouter();

  const ref = searchParams.get("ref") || repo.default_branch || "main";
  const initialPath = searchParams.get("path") || "";

  const [filename, setFilename] = useState("");
  const [content, setContent] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!repo.can_push) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-lg font-semibold text-white">Write access required</h2>
        <p className="mt-2 text-sm text-zinc-400">
          You can browse this repository, but adding files from the website requires write access.
        </p>
        <Link
          href={`/repos/${repo.id}?ref=${encodeURIComponent(ref)}&path=${encodeURIComponent(initialPath)}`}
          className="mt-4 inline-flex rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Back to repository
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename.trim()) return;

    // Combine current directory path with new filename
    const fullPath = initialPath ? `${initialPath}/${filename}` : filename;

    // Generate default commit message if empty
    const finalMessage = commitMessage.trim() || `Create ${fullPath}`;

    setIsSubmitting(true);
    setError("");

    try {
      await reposApi.writeFileContent(repo.id, {
        branch: ref,
        path: fullPath,
        content,
        message: finalMessage,
      });

      router.push(`/repos/${repo.id}?ref=${encodeURIComponent(ref)}&path=${encodeURIComponent(fullPath)}&view=blob`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to commit new file.");
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
        {initialPath && (
          <>
            <span className="font-mono">{initialPath}</span>
            <span>/</span>
          </>
        )}
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="Name your file..."
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-2 font-mono text-sm text-white">
          <div className="flex gap-4">
            <span className="border-b-2 border-[#f78166] py-1">Edit new file</span>
          </div>
        </div>
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-[400px] w-full resize-y bg-transparent p-4 font-mono text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
            placeholder="Enter file contents here"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Commit new file</h3>
        
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
              placeholder={`Create ${initialPath ? `${initialPath}/` : ""}${filename || "new_file"}`}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-3 border-t border-zinc-800/50 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !filename.trim()}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? <Spinner size="sm" className="mr-2 inline" /> : null}
              Commit changes
            </button>
            <Link
              href={`/repos/${repo.id}?ref=${encodeURIComponent(ref)}&path=${encodeURIComponent(initialPath)}`}
              className="text-sm font-medium text-blue-500 hover:underline"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
