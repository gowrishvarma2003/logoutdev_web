"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useQuestion, useQuestionAnswers, useQuestionDiscussion } from "@/lib/hooks/useQuestions";
import * as api from "@/lib/services/questionsApi";
import AnswerList from "@/components/questions/AnswerList";
import DiscussionPanel from "@/components/questions/DiscussionPanel";
import McqAnswerForm from "@/components/questions/McqAnswerForm";
import OpenAnswerForm from "@/components/questions/OpenAnswerForm";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import { ArrowLeftIcon } from "@/components/ui/Icons";
import { formatRelativeTime } from "@/lib/utils";

export default function QuestionDetailPage({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { question, loading, error, refetch } = useQuestion(questionId);
  const canLoadLocked = Boolean(question?.viewer_state?.can_view_locked_content);
  const {
    answers,
    loading: answersLoading,
    refetch: refetchAnswers,
  } = useQuestionAnswers(questionId, Boolean(question && question.type === "open" && canLoadLocked));
  const {
    comments,
    loading: discussionLoading,
    refetch: refetchDiscussion,
  } = useQuestionDiscussion(questionId, Boolean(question && canLoadLocked));
  const [actionError, setActionError] = useState("");

  const myAnswer = useMemo(
    () => answers.find((answer) => answer.author_id === user?.id) ?? null,
    [answers, user?.id]
  );

  async function refreshAll(currentQuestion = question) {
    await refetch();
    if (currentQuestion?.type === "open") {
      await refetchAnswers();
    }
    if (currentQuestion?.viewer_state?.can_view_locked_content) {
      await refetchDiscussion();
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !question) {
    return <div className="px-4 py-16 text-center text-sm text-zinc-500">{error || "Question not found."}</div>;
  }

  const resolvedQuestion = question;
  const isAuthor = Boolean(user && user.id === resolvedQuestion.author_id);
  const correctOption = (resolvedQuestion.options || []).find((option) => option.is_correct);
  const selectedCorrectOption = (resolvedQuestion.options || []).some(
    (option) => option.is_correct && option.selected_by_me
  );

  async function handleMcqSubmit(optionIds: string[]) {
    setActionError("");
    try {
      await api.submitMcqResponse(resolvedQuestion.id, optionIds);
      await refreshAll(resolvedQuestion);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to submit response.");
      throw err;
    }
  }

  async function handleAnswerSubmit(body: string) {
    setActionError("");
    try {
      await api.putMyAnswer(resolvedQuestion.id, body);
      await refreshAll(resolvedQuestion);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to submit answer.");
      throw err;
    }
  }

  async function handleAccept(answerId: string) {
    await api.acceptAnswer(resolvedQuestion.id, answerId);
    await refreshAll(resolvedQuestion);
  }

  async function handleVote(answerId: string, isUpvoted: boolean) {
    if (isUpvoted) {
      await api.removeAnswerUpvote(resolvedQuestion.id, answerId);
    } else {
      await api.upvoteAnswer(resolvedQuestion.id, answerId);
    }
    await refetchAnswers();
  }

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[17px] font-bold text-white">Question</h1>
          <p className="text-sm text-zinc-500">
            {resolvedQuestion.type === "mcq" ? "MCQ thread" : "Open Q&A thread"}
          </p>
        </div>
      </header>

      <article className="border-b border-zinc-800 px-4 py-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 font-semibold ${
              resolvedQuestion.type === "mcq"
                ? "bg-sky-500/10 text-sky-300"
                : "bg-emerald-500/10 text-emerald-300"
            }`}
          >
            {resolvedQuestion.type === "mcq" ? "MCQ" : "Open"}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-semibold ${
              resolvedQuestion.status === "open"
                ? "bg-zinc-800 text-zinc-300"
                : "bg-rose-500/10 text-rose-300"
            }`}
          >
            {resolvedQuestion.status}
          </span>
          {resolvedQuestion.tags.map((tag) => (
            <span
              key={tag.id || `${tag.tag_type}:${tag.slug}`}
              className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-300"
            >
              #{tag.slug}
            </span>
          ))}
        </div>

        <h1 className="text-2xl font-bold leading-tight text-white">{resolvedQuestion.title}</h1>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-300">
          {resolvedQuestion.body}
        </p>

        <div className="mt-5 flex items-center gap-3">
          <Avatar user={resolvedQuestion.author ?? null} size="sm" />
          <div className="text-sm">
            <p className="font-semibold text-white">{resolvedQuestion.author?.name ?? "Unknown"}</p>
            <p className="text-xs text-zinc-500">
              Asked {formatRelativeTime(resolvedQuestion.created_at)} · {resolvedQuestion.answer_count} answers ·{" "}
              {resolvedQuestion.discussion_count} discussion posts
            </p>
          </div>
        </div>
      </article>

      <div className="space-y-5 px-4 py-5">
        {resolvedQuestion.type === "mcq" ? (
          <>
            {!user ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-400">
                Sign in to answer this MCQ and unlock results plus discussion.
                <div className="mt-3">
                  <Link href="/login" className="font-semibold text-white hover:underline">
                    Go to sign in
                  </Link>
                </div>
              </div>
            ) : !isAuthor && resolvedQuestion.status === "open" ? (
              <McqAnswerForm question={resolvedQuestion} onSubmit={handleMcqSubmit} />
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-400">
                {isAuthor ? "You asked this question." : "This question is closed."}
              </div>
            )}

            {resolvedQuestion.viewer_state?.can_view_locked_content ? (
              <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/20 p-4">
                <h3 className="text-sm font-semibold text-white">Results</h3>
                {correctOption && (
                  <div
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      !isAuthor && resolvedQuestion.viewer_state?.has_answered
                        ? selectedCorrectOption
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        : "border-sky-500/30 bg-sky-500/10 text-sky-300"
                    }`}
                  >
                    {!isAuthor && resolvedQuestion.viewer_state?.has_answered
                      ? selectedCorrectOption
                        ? "You picked the correct answer."
                        : `Correct answer: ${correctOption.text}`
                      : `Correct answer: ${correctOption.text}`}
                  </div>
                )}
                {(resolvedQuestion.options || []).map((option) => (
                  <div key={option.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="flex items-center gap-2 text-sm text-white">
                        <span>{option.text}</span>
                        {option.is_correct && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                            Correct
                          </span>
                        )}
                        {option.selected_by_me && !option.is_correct && (
                          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
                            Your answer
                          </span>
                        )}
                      </span>
                      <span>
                        {option.vote_count ?? 0} votes · {option.vote_percent ?? 0}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          option.is_correct ? "bg-emerald-400" : "bg-white"
                        }`}
                        style={{ width: `${option.vote_percent ?? 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
                Answer this MCQ to unlock results and discussion.
              </div>
            )}
          </>
        ) : (
          <>
            {!user ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-400">
                Sign in to post an answer and unlock discussion.
                <div className="mt-3">
                  <Link href="/login" className="font-semibold text-white hover:underline">
                    Go to sign in
                  </Link>
                </div>
              </div>
            ) : !isAuthor && resolvedQuestion.status === "open" ? (
              <OpenAnswerForm
                initialValue={myAnswer?.body ?? ""}
                submitLabel={myAnswer ? "Update answer" : "Post answer"}
                onSubmit={handleAnswerSubmit}
              />
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-400">
                {isAuthor ? "You asked this question." : "This question is closed."}
              </div>
            )}

            {!resolvedQuestion.viewer_state?.can_view_locked_content ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
                Post your answer first to unlock the full answer list and discussion.
              </div>
            ) : answersLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size="md" />
              </div>
            ) : (
              <AnswerList
                answers={answers}
                currentUser={user}
                canAccept={Boolean(resolvedQuestion.viewer_state?.can_accept_answer)}
                onAccept={handleAccept}
                onToggleVote={(answer) => handleVote(answer.id, Boolean(answer.is_upvoted_by_me))}
              />
            )}
          </>
        )}

        {actionError && <p className="text-sm text-rose-400">{actionError}</p>}

        {!resolvedQuestion.viewer_state?.can_view_locked_content ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-500">
            {user ? "Answer to unlock discussion." : "Sign in and answer to unlock discussion."}
          </div>
        ) : discussionLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="md" />
          </div>
        ) : (
          <DiscussionPanel
            questionId={resolvedQuestion.id}
            currentUser={user}
            comments={comments}
            onRefresh={refetchDiscussion}
          />
        )}
      </div>
    </div>
  );
}
