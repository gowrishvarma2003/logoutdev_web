"use client";

import { use, useMemo, useState } from "react";
import { useRepoContext } from "../../../layout";
import { usePullRequestComments, usePullRequestDiff } from "@/lib/hooks/useRepos";
import { addPullRequestComment, resolvePullRequestThread } from "@/lib/services/reposApi";
import * as cache from "@/lib/services/requestCache";
import type { PullRequestComment } from "@/lib/types";
import Spinner from "@/components/ui/Spinner";
import { DocumentIcon } from "@heroicons/react/24/outline";

function buildCommentTree(comments: PullRequestComment[]) {
  const byId = new Map<string, PullRequestComment & { replies: PullRequestComment[] }>();
  const roots: Array<PullRequestComment & { replies: PullRequestComment[] }> = [];

  for (const comment of comments) {
    byId.set(comment.id, { ...comment, replies: [] });
  }

  for (const comment of byId.values()) {
    if (comment.parent_comment_id && byId.has(comment.parent_comment_id)) {
      byId.get(comment.parent_comment_id)?.replies.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return roots;
}

function ThreadCard({
  thread,
  onReply,
  onResolve,
  canResolve,
}: {
  thread: PullRequestComment & { replies?: PullRequestComment[] };
  onReply: (commentId: string, body: string, path?: string | null, position?: number | null) => Promise<void>;
  onResolve: (commentId: string) => Promise<void>;
  canResolve: boolean;
}) {
  const [replyBody, setReplyBody] = useState("");
  const [showReply, setShowReply] = useState(false);
  const replies = thread.replies || [];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{thread.author?.username || thread.author_id}</p>
          <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">{thread.body}</p>
        </div>
        <div className="flex items-center gap-2">
          {!thread.is_resolved && canResolve ? (
            <button
              type="button"
              onClick={() => onResolve(thread.id)}
              className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              Resolve
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setShowReply((current) => !current)}
            className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            Reply
          </button>
        </div>
      </div>

      {replies.length > 0 ? (
        <div className="mt-3 space-y-2 border-l border-zinc-800 pl-3">
          {replies.map((reply) => (
            <div key={reply.id} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
              <p className="text-sm font-medium text-white">{reply.author?.username || reply.author_id}</p>
              <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">{reply.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      {showReply ? (
        <div className="mt-3 space-y-2">
          <textarea
            rows={3}
            value={replyBody}
            onChange={(event) => setReplyBody(event.target.value)}
            placeholder="Reply to this thread"
            className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
          <button
            type="button"
            disabled={!replyBody.trim()}
            onClick={async () => {
              await onReply(thread.id, replyBody.trim(), thread.path, thread.position);
              setReplyBody("");
              setShowReply(false);
            }}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            Reply
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function PRFilesPage({
  params,
}: {
  params: Promise<{ repoId: string; number: string }>;
}) {
  const { number } = use(params);
  const { repo } = useRepoContext();
  const { diff, loading, error } = usePullRequestDiff(repo.id, number);
  const { comments, refetch: refetchComments } = usePullRequestComments(repo.id, number);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [activeLine, setActiveLine] = useState<Record<string, number | null>>({});
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);

  const commentsByFile = useMemo(() => {
    const map = new Map<string, PullRequestComment[]>();
    for (const comment of comments) {
      if (!comment.path) continue;
      const existing = map.get(comment.path) || [];
      existing.push(comment);
      map.set(comment.path, existing);
    }
    return map;
  }, [comments]);

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

  async function submitInlineComment(path: string, position: number | null, body: string, parentCommentId?: string) {
    const key = `${path}:${position || "file"}`;
    setSubmittingKey(key);
    try {
      await addPullRequestComment(repo.id, number, {
        body,
        path,
        position: position || undefined,
        parent_comment_id: parentCommentId,
      });
      cache.invalidateRepo(repo.id, "pulls");
      setDrafts((current) => ({ ...current, [key]: "" }));
      setActiveLine((current) => ({ ...current, [path]: null }));
      refetchComments();
    } finally {
      setSubmittingKey(null);
    }
  }

  async function resolveThread(commentId: string) {
    await resolvePullRequestThread(repo.id, number, commentId);
    cache.invalidateRepo(repo.id, "pulls");
    refetchComments();
  }

  return (
    <div className="mb-8">
      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
        <p>
          Showing <span className="font-semibold text-white">{diff.stats.files_changed} changed files</span>{" "}
          with <span className="font-semibold text-green-500">{diff.stats.additions} additions</span> and{" "}
          <span className="font-semibold text-red-500">{diff.stats.deletions} deletions</span>.
        </p>
      </div>

      <div className="space-y-6">
        {diff.files.map((file) => {
          const fileComments = commentsByFile.get(file.path) || [];
          const threadsByPosition = new Map<string, PullRequestComment[]>();
          for (const comment of fileComments) {
            const key = String(comment.position || "file");
            const existing = threadsByPosition.get(key) || [];
            existing.push(comment);
            threadsByPosition.set(key, existing);
          }

          return (
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

              <div className="overflow-x-auto bg-zinc-950 p-4 font-mono text-xs">
                {file.patch ? (
                  <pre className="whitespace-pre">
                    {file.patch.split("\n").map((line: string, idx: number) => {
                      const lineNumber = idx + 1;
                      const threadKey = `${file.path}:${lineNumber}`;
                      const lineThreads = buildCommentTree(threadsByPosition.get(String(lineNumber)) || []);
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
                        <div key={lineNumber}>
                          <div className={`${bgClass} group flex items-start justify-between gap-3 px-2 py-0.5 leading-relaxed`}>
                            <span className={colorClass}>{line}</span>
                            <button
                              type="button"
                              onClick={() => setActiveLine((current) => ({ ...current, [file.path]: current[file.path] === lineNumber ? null : lineNumber }))}
                              className="opacity-0 transition-opacity group-hover:opacity-100 text-[10px] text-zinc-500 hover:text-zinc-200"
                            >
                              Comment
                            </button>
                          </div>

                          {activeLine[file.path] === lineNumber ? (
                            <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
                              <textarea
                                rows={3}
                                value={drafts[threadKey] || ""}
                                onChange={(event) => setDrafts((current) => ({ ...current, [threadKey]: event.target.value }))}
                                placeholder={`Comment on ${file.path}:${lineNumber}`}
                                className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
                              />
                              <button
                                type="button"
                                disabled={!drafts[threadKey]?.trim() || submittingKey === threadKey}
                                onClick={() => submitInlineComment(file.path, lineNumber, drafts[threadKey].trim())}
                                className="mt-3 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                              >
                                Add inline comment
                              </button>
                            </div>
                          ) : null}

                          {lineThreads.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              {lineThreads.map((thread) => (
                                <ThreadCard
                                  key={thread.id}
                                  thread={thread}
                                  canResolve={Boolean(repo.can_review)}
                                  onResolve={resolveThread}
                                  onReply={(commentId, body, path, position) => submitInlineComment(path || file.path, position || lineNumber, body, commentId)}
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </pre>
                ) : (
                  <div className="text-zinc-500 italic text-center p-4">Binary file not shown.</div>
                )}

                {threadsByPosition.get("file")?.length ? (
                  <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">File threads</p>
                    {buildCommentTree(threadsByPosition.get("file") || []).map((thread) => (
                      <ThreadCard
                        key={thread.id}
                        thread={thread}
                        canResolve={Boolean(repo.can_review)}
                        onResolve={resolveThread}
                        onReply={(commentId, body, path, position) => submitInlineComment(path || file.path, position || null, body, commentId)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
