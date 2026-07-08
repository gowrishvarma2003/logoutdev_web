"use client";

/**
 * Profile questions page — /profile/:id/questions
 * Lists questions authored by this user.
 */

import { use, useState } from "react";
import Link from "next/link";
import { useProfileQuestions } from "@/lib/hooks/useProfile";
import { ProfileListSkeleton } from "@/components/profile/ProfileSkeleton";
import { formatRelativeTime } from "@/lib/utils";
import { ChatIcon, CheckCircleIcon, QuestionMarkCircleIcon } from "@/components/ui/Icons";
import EmptyState from "@/components/ui/EmptyState";

interface ProfileQuestionsPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_STYLES = {
  open: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  closed: "bg-surface-hover text-text-muted border-border-strong",
} as const;

export default function ProfileQuestionsPage({ params }: ProfileQuestionsPageProps) {
  const { id: username } = use(params);
  const [page, setPage] = useState(1);

  const { questions, total, loading, error } = useProfileQuestions(username, page);

  if (loading) {
    return <ProfileListSkeleton rows={5} />;
  }

  if (error) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-rose-400 text-sm">{error}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          icon={<QuestionMarkCircleIcon className="h-7 w-7" />}
          title="No questions asked yet"
          description="Ask a focused technical question to start building a visible knowledge trail."
          tone="question"
          action={
            <Link href="/questions/ask" className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">
              Ask a question
            </Link>
          }
        />
      </div>
    );
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="py-2">
      {questions.map((question) => (
        <Link
          key={question.id}
          href={`/questions/${question.id}`}
          className="group flex items-start gap-3.5 px-5 py-4 border-b border-border-default hover:bg-surface/40 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <QuestionMarkCircleIcon className="w-4 h-4 text-violet-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-semibold text-text-primary group-hover:text-sky-400 transition-colors line-clamp-1">
                {question.title}
              </h3>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[question.status]}`}>
                {question.status}
              </span>
            </div>
            <p className="text-xs text-text-disabled line-clamp-2 leading-relaxed">
              {question.body}
            </p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-text-disabled">
              <span className="flex items-center gap-1">
                <ChatIcon className="w-3 h-3" />
                {question.answer_count} answer{question.answer_count !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircleIcon className="w-3 h-3" />
                {question.participant_count} participant{question.participant_count !== 1 ? "s" : ""}
              </span>
              <span>{formatRelativeTime(question.latest_activity_at)}</span>
            </div>
            {question.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {question.tags.slice(0, 4).map((tag) => (
                  <span key={tag.id} className="rounded-full border border-border-strong/80 px-2 py-0.5 text-[10px] text-text-disabled">
                    {tag.tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </Link>
      ))}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 px-5 py-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-border-strong text-sm text-text-muted hover:text-text-primary hover:border-zinc-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-text-disabled">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-border-strong text-sm text-text-muted hover:text-text-primary hover:border-zinc-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
