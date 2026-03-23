"use client";

import { useState } from "react";
import Link from "next/link";
import { useRepoContext } from "../../layout";
import { useRepoDiscussion } from "@/lib/hooks/useRepos";
import { addRepoDiscussionComment, markRepoDiscussionAnswer } from "@/lib/services/reposApi";
import { formatRelativeTime } from "@/lib/utils";
import Spinner from "@/components/ui/Spinner";
import { CheckCircleIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";

export default function DiscussionDetailPage({
  params,
}: {
  params: { repoId: string; id: string };
}) {
  const { repo } = useRepoContext();
  const { discussion, loading, error, refetch } = useRepoDiscussion(params.repoId, params.id);

  const [replyBody, setReplyBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const handleCreateComment = async (parentId?: string) => {
    if (!replyBody.trim()) return;
    setIsSubmitting(true);
    try {
      await addRepoDiscussionComment(repo.id, params.id, {
        body: replyBody,
        parent_comment_id: parentId,
      });
      setReplyBody("");
      setActiveReplyId(null);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAnswer = async (commentId: string) => {
    try {
      await markRepoDiscussionAnswer(repo.id, params.id, commentId);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to mark as answer");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="mx-auto max-w-[1000px] p-8">
        <div className="rounded border border-red-500/20 bg-red-500/10 p-4 text-red-500">
          Failed to load discussion: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1000px] p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/repos/${repo.id}/discussions`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-400 font-medium"
        >
          <ArrowUturnLeftIcon className="h-4 w-4" /> Back to discussions
        </Link>
        <h1 className="text-3xl font-bold text-white mb-3">
          {discussion.title} <span className="text-zinc-500 font-normal">#{discussion.id.slice(0, 4)}</span>
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
          {discussion.is_answered && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-semibold text-green-400">
              <CheckCircleIcon className="h-4 w-4" /> Answered
            </span>
          )}
          {!discussion.is_answered && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-300 border border-zinc-700">
              <ChatBubbleLeftRightIcon className="h-4 w-4" /> Open
            </span>
          )}
          <span>
            <strong className="text-zinc-200 font-semibold">{discussion.author?.username}</strong> started this discussion{" "}
            {formatRelativeTime(discussion.created_at)}
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 uppercase text-xs tracking-wide">
            {discussion.category}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* OP Post */}
        <div className="rounded-md border border-zinc-700 bg-zinc-900 shadow-sm relative">
          <div className="border-b border-zinc-800 bg-zinc-800/40 px-4 py-3 text-sm text-zinc-400">
            <span className="font-semibold text-zinc-200">{discussion.author?.name}</span> commented{" "}
            {formatRelativeTime(discussion.created_at)}
          </div>
          <div className="p-4 md:p-6 text-white whitespace-pre-wrap font-sans leading-relaxed">
            {discussion.body}
          </div>
        </div>

        {/* Answers/Comments Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-6 border-b border-zinc-800 pb-2">
            Comments ({discussion.comments?.length || 0})
          </h2>

          <div className="space-y-6 mb-12">
            {discussion.comments?.map((comment) => {
              const isAnswer = discussion.answer_comment_id === comment.id;

              return (
                <div
                  key={comment.id}
                  className={`rounded-md border ${
                    isAnswer ? "border-green-500/50 bg-green-900/10" : "border-zinc-800 bg-zinc-900/50"
                  }`}
                >
                  <div className={`border-b px-4 py-3 flex items-center justify-between text-sm ${
                    isAnswer ? "border-green-500/20 bg-green-900/20 text-green-100" : "border-zinc-800 bg-zinc-800/20 text-zinc-400"
                  }`}>
                    <div>
                      <span className="font-semibold text-zinc-200">{comment.author?.name}</span> commented{" "}
                      {formatRelativeTime(comment.created_at)}
                    </div>
                    {isAnswer ? (
                      <span className="flex items-center gap-1 font-semibold text-green-400">
                        <CheckCircleIcon className="h-5 w-5" /> Provider Answer
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkAnswer(comment.id)}
                        className="flex items-center gap-1 text-zinc-500 hover:text-green-400 transition-colors font-medium border border-transparent hover:border-green-500/30 rounded px-2 py-1"
                      >
                        <CheckCircleIcon className="h-4 w-4" /> Mark as answer
                      </button>
                    )}
                  </div>
                  
                  <div className="p-4 md:p-6 text-zinc-200 whitespace-pre-wrap text-sm leading-relaxed">
                    {comment.body}
                  </div>

                  {/* Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="border-t border-zinc-800 bg-zinc-950/50 p-4 space-y-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="ml-8 border-l-2 border-zinc-800 pl-4 py-1">
                          <div className="text-xs text-zinc-500 mb-1">
                            <span className="font-semibold text-zinc-300">{reply.author?.name}</span> • {formatRelativeTime(reply.created_at)}
                          </div>
                          <div className="text-sm text-zinc-300 whitespace-pre-wrap">{reply.body}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Button Hook */}
                  <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3">
                    {activeReplyId === comment.id ? (
                      <div className="mt-2 text-right">
                        <textarea
                          rows={3}
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          placeholder="Write a reply..."
                          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none mb-2"
                        />
                        <button
                          onClick={() => { setActiveReplyId(null); setReplyBody(""); }}
                          className="mr-3 text-sm text-zinc-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleCreateComment(comment.id)}
                          disabled={isSubmitting || !replyBody.trim()}
                          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                        >
                          {isSubmitting ? "Replying..." : "Reply"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setActiveReplyId(comment.id); setReplyBody(""); }}
                        className="text-sm font-medium text-zinc-500 hover:text-blue-400 transition-colors"
                      >
                        Reply to comment
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* New Top-Level Comment */}
          {activeReplyId === null && (
            <div className="rounded-md border border-zinc-800 bg-zinc-950 shadow-sm overflow-hidden mt-8">
              <div className="border-b border-zinc-800 bg-zinc-900 p-3 text-sm font-medium text-white">
                Add a comment
              </div>
              <div className="p-4">
                <textarea
                  rows={4}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Leave a comment..."
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => handleCreateComment()}
                    disabled={isSubmitting || !replyBody.trim()}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting && <Spinner size="sm" />}
                    Comment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
