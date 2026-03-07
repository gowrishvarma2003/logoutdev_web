"use client";

import Avatar from "@/components/ui/Avatar";
import { ArrowUpIcon, CheckCircleIcon } from "@/components/ui/Icons";
import type { QuestionAnswer, User } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

export default function AnswerList({
  answers,
  currentUser,
  canAccept,
  onAccept,
  onToggleVote,
}: {
  answers: QuestionAnswer[];
  currentUser: User | null;
  canAccept: boolean;
  onAccept: (answerId: string) => Promise<void>;
  onToggleVote: (answer: QuestionAnswer) => Promise<void>;
}) {
  if (answers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-500">
        No answers yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {answers.map((answer) => {
        const isOwn = currentUser?.id === answer.author_id;
        return (
          <article key={answer.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="flex items-start gap-3">
              <Avatar user={answer.author ?? null} size="sm" className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-white">{answer.author?.name ?? "Unknown"}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-zinc-500">{formatRelativeTime(answer.created_at)}</span>
                  {answer.is_accepted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-300">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      Accepted
                    </span>
                  )}
                  {isOwn && (
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 font-semibold text-zinc-300">
                      Your answer
                    </span>
                  )}
                </div>

                <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
                  {answer.body}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  {!isOwn && currentUser && (
                    <button
                      onClick={() => onToggleVote(answer)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold transition-colors ${
                        answer.is_upvoted_by_me
                          ? "bg-white text-zinc-950"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      <ArrowUpIcon className="h-3.5 w-3.5" />
                      {answer.score}
                    </button>
                  )}
                  {(isOwn || !currentUser) && <span className="text-zinc-500">{answer.score} upvotes</span>}
                  {canAccept && !answer.is_accepted && (
                    <button
                      onClick={() => onAccept(answer.id)}
                      className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
                    >
                      Mark accepted
                    </button>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
