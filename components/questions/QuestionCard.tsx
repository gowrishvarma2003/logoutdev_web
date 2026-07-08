"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import type { Question, User } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import RichText from "@/components/ui/RichText";

function TagPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-border-strong px-2 py-0.5 text-[11px] font-medium text-text-secondary">
      #{label}
    </span>
  );
}

export default function QuestionCard({
  question,
  currentUser,
}: {
  question: Question;
  currentUser: User | null;
}) {
  const isAnswered = Boolean(question.viewer_state?.has_answered);

  return (
    <Link
      href={`/questions/${question.id}`}
      className="block border-b border-border-default px-4 py-4 transition-colors hover:bg-surface/40"
    >
      <div className="flex items-start gap-3">
        <Avatar user={question.author ?? null} size="sm" className="mt-0.5 shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-text-disabled">
            <span className="font-semibold text-text-secondary">
              {question.author?.name ?? "Unknown"}
            </span>
            <span>·</span>
            <span>{formatRelativeTime(question.created_at)}</span>
            <span
              className={`rounded-full px-2 py-0.5 font-semibold ${
                question.type === "mcq"
                  ? "bg-sky-500/10 text-sky-300"
                  : "bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {question.type === "mcq" ? "MCQ" : "Open"}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 font-semibold ${
                question.status === "open"
                  ? "bg-surface-hover text-text-secondary"
                  : "bg-rose-500/10 text-rose-300"
              }`}
            >
              {question.status}
            </span>
            {currentUser && isAnswered && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-300">
                Answered
              </span>
            )}
          </div>

          <h2 className="line-clamp-2 text-[17px] font-semibold text-text-primary">
            {question.title}
          </h2>
          <RichText text={question.body} className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-muted" />

          <div className="mt-3 flex flex-wrap gap-2">
            {question.tags.slice(0, 6).map((tag) => (
              <TagPill key={tag.id || `${tag.tag_type}:${tag.slug}`} label={tag.slug} />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-text-disabled">
            <span>{question.answer_count} answers</span>
            <span>{question.discussion_count} discussion posts</span>
            <span>{question.participant_count} participants</span>
            <span>Active {formatRelativeTime(question.latest_activity_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
