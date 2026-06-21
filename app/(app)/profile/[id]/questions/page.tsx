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

interface ProfileQuestionsPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_STYLES = {
  open: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  closed: "bg-zinc-800 text-zinc-400 border-zinc-700",
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
      <div className="px-5 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3">
          <QuestionMarkCircleIcon className="w-5 h-5 text-zinc-600" />
        </div>
        <p className="text-zinc-600 text-sm">No questions asked yet.</p>
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
          className="group flex items-start gap-3.5 px-5 py-4 border-b border-zinc-800 hover:bg-zinc-900/40 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <QuestionMarkCircleIcon className="w-4 h-4 text-violet-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors line-clamp-1">
                {question.title}
              </h3>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[question.status]}`}>
                {question.status}
              </span>
            </div>
            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
              {question.body}
            </p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-600">
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
                  <span key={tag.id} className="rounded-full border border-zinc-700/80 px-2 py-0.5 text-[10px] text-zinc-500">
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
            className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
