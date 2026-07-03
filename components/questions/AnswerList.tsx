"use client";

import Avatar from "@/components/ui/Avatar";
import { ArrowUpIcon, CheckCircleIcon } from "@/components/ui/Icons";
import type { QuestionAnswer, User } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import RichText from "@/components/ui/RichText";
import EmptyState from "@/components/ui/EmptyState";

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
      <EmptyState
        icon={<CheckCircleIcon className="h-7 w-7" />}
        title="No solutions yet"
        description="Share the first answer and help move this question forward."
        tone="question"
        size="md"
      />
    );
  }

  return (
    <div className="space-y-4">
      {answers.map((answer) => {
        const isOwn = currentUser?.id === answer.author_id;
        const isAccepted = answer.is_accepted;

        return (
          <article
            key={answer.id}
            className={`rounded-2xl border p-5 transition-all duration-300 ${
              isAccepted
                ? "border-emerald-500/25 bg-emerald-500/[0.02] shadow-[0_0_16px_rgba(16,185,129,0.02)]"
                : "border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <Avatar user={answer.author ?? null} size="sm" className="mt-0.5 ring-2 ring-zinc-900/50" />
              <div className="min-w-0 flex-1">
                {/* Author & Header Metadata */}
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-white hover:underline cursor-pointer">
                      {answer.author?.name ?? "Unknown"}
                    </span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-zinc-500">{formatRelativeTime(answer.created_at)}</span>
                    {isOwn && (
                      <span className="rounded bg-zinc-800/60 border border-zinc-700/50 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-300">
                        Your answer
                      </span>
                    )}
                  </div>

                  {isAccepted && (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                      <CheckCircleIcon className="h-3 w-3" />
                      Accepted Solution
                    </span>
                  )}
                </div>

                {/* Answer Content */}
                <RichText
                  text={answer.body}
                  className="whitespace-pre-line text-sm leading-relaxed text-zinc-300"
                />

                {/* Actions / Votes */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-900 pt-3">
                  <div className="flex items-center gap-3 text-xs">
                    {!isOwn && currentUser ? (
                      <button
                        onClick={() => onToggleVote(answer)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                          answer.is_upvoted_by_me
                            ? "bg-sky-500 border-sky-500 text-zinc-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.1)]"
                            : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        <ArrowUpIcon className="h-3.5 w-3.5" />
                        <span>Upvote</span>
                        <span className="text-[11px] opacity-80">({answer.score})</span>
                      </button>
                    ) : (
                      <span className="text-zinc-500 text-[11px] bg-zinc-900/20 border border-zinc-900 px-2 py-1 rounded-lg">
                        {answer.score} upvotes
                      </span>
                    )}
                  </div>

                  {canAccept && !isAccepted && (
                    <button
                      onClick={() => onAccept(answer.id)}
                      className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:border-emerald-500/30"
                    >
                      Accept Solution
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
