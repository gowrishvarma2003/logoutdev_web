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
import { ArrowLeftIcon, LockIcon, ShareIcon, CheckCircleIcon, ClockIcon } from "@/components/ui/Icons";
import { formatRelativeTime } from "@/lib/utils";
import NextStepsPanel from "@/components/connected/NextStepsPanel";
import RelatedEntitiesPanel from "@/components/connected/RelatedEntitiesPanel";
import TrustContextCard from "@/components/connected/TrustContextCard";

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
    return <div className="px-4 py-16 text-center text-sm text-text-disabled">{error || "Question not found."}</div>;
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

  // Sidebar components block rendered on desktop right column, and bottom on mobile
  const sidebarContent = (
    <div className="space-y-5">
      {/* Asker Trust Card */}
      {resolvedQuestion.trust_context && (
        <TrustContextCard trust={resolvedQuestion.trust_context} />
      )}

      {/* Recommended Next Steps */}
      {resolvedQuestion.next_steps && resolvedQuestion.next_steps.length > 0 && (
        <NextStepsPanel items={resolvedQuestion.next_steps} />
      )}

      {/* Question Platform Metrics Stats Card */}
      <div className="rounded-2xl border border-border-default bg-app/40 p-5">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-disabled mb-4">Question Stats</h3>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span>Asked</span>
            <span className="font-semibold text-text-primary">{formatRelativeTime(resolvedQuestion.created_at)}</span>
          </div>
          <div className="flex items-center justify-between text-text-muted">
            <span>Last Activity</span>
            <span className="font-semibold text-text-primary">{formatRelativeTime(resolvedQuestion.latest_activity_at)}</span>
          </div>
          <div className="flex items-center justify-between text-text-muted">
            <span>Participants</span>
            <span className="font-semibold text-text-primary">{resolvedQuestion.participant_count} developers</span>
          </div>
          <div className="flex items-center justify-between text-text-muted">
            <span>Status</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                resolvedQuestion.status === "open"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-surface-hover text-text-muted border border-border-strong/60"
              }`}
            >
              {resolvedQuestion.status}
            </span>
          </div>
        </div>
      </div>

      {/* Related Entities workspaces */}
      {resolvedQuestion.related_entities && resolvedQuestion.related_entities.length > 0 && (
        <RelatedEntitiesPanel items={resolvedQuestion.related_entities} />
      )}

      {/* Share action updates hub link */}
      <div>
        <Link
          href={`/feed?shareType=question&shareId=${resolvedQuestion.id}&shareTitle=${encodeURIComponent(resolvedQuestion.title)}&shareSubtitle=${encodeURIComponent(resolvedQuestion.body || "")}&shareHref=${encodeURIComponent(`/questions/${resolvedQuestion.id}`)}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-default bg-surface/40 py-2.5 text-xs font-semibold text-text-secondary transition-all duration-300 hover:bg-surface hover:text-text-primary hover:border-border-strong"
        >
          <ShareIcon className="h-4 w-4" />
          <span>Share Question</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div>
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border-default bg-app/80 px-4 py-3.5 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="rounded-full p-1.5 text-text-muted transition-colors hover:bg-surface-hover"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[15px] font-bold text-text-primary">Question Detail</h1>
          <p className="text-[11px] text-text-disabled mt-0.5">
            {resolvedQuestion.type === "mcq" ? "MCQ thread" : "Open Q&A thread"}
          </p>
        </div>
      </header>

      {/* Two column grid for desktop layouts, stacked columns for mobile */}
      <div className="lg:grid lg:grid-cols-[1fr_300px]">
        
        {/* Left Column: Question Detail content feed */}
        <div className="min-w-0 border-border-default lg:border-r pb-12">
          
          {/* Question Hero Card */}
          <article className="border-b border-border-default/80 px-5 py-6">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                  resolvedQuestion.type === "mcq"
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
              >
                {resolvedQuestion.type === "mcq" ? "MCQ" : "Open Q&A"}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                  resolvedQuestion.status === "open"
                    ? "bg-surface-hover text-text-secondary border-border-strong/60"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {resolvedQuestion.status}
              </span>
              {resolvedQuestion.tags.map((tag) => (
                <span
                  key={tag.id || `${tag.tag_type}:${tag.slug}`}
                  className="rounded bg-surface px-2 py-0.5 text-[11px] text-text-muted font-medium"
                >
                  #{tag.slug}
                </span>
              ))}
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary lg:text-3xl leading-tight">
              {resolvedQuestion.title}
            </h1>
            
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
              {resolvedQuestion.body}
            </p>

            <div className="mt-6 flex items-center gap-3 border-t border-border-subtle pt-4">
              <Avatar user={resolvedQuestion.author ?? null} size="sm" className="ring-1 ring-border-default" />
              <div className="text-xs">
                <p className="font-bold text-text-primary">{resolvedQuestion.author?.name ?? "Unknown"}</p>
                <p className="text-text-disabled mt-0.5">
                  Asked {formatRelativeTime(resolvedQuestion.created_at)} · {resolvedQuestion.answer_count} answers ·{" "}
                  {resolvedQuestion.discussion_count} discussion posts
                </p>
              </div>
            </div>
          </article>

          {/* Solutions / Voting Section */}
          <div className="space-y-6 p-5">
            {resolvedQuestion.type === "mcq" ? (
              <>
                {/* MCQ Answer form/locked banners */}
                {!user ? (
                  <div className="rounded-2xl border border-border-default bg-app/40 p-5 text-sm text-text-muted">
                    <p>Sign in to answer this MCQ and unlock results plus discussion.</p>
                    <div className="mt-3.5">
                      <Link href="/login" className="rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">
                        Go to Sign In
                      </Link>
                    </div>
                  </div>
                ) : !isAuthor && resolvedQuestion.status === "open" ? (
                  <McqAnswerForm question={resolvedQuestion} onSubmit={handleMcqSubmit} />
                ) : (
                  <div className="rounded-2xl border border-border-default bg-surface/10 px-5 py-4 text-xs text-text-muted">
                    {isAuthor ? "You asked this question." : "This question is closed."}
                  </div>
                )}

                {/* MCQ Vote Results Display */}
                {resolvedQuestion.viewer_state?.can_view_locked_content ? (
                  <div className="space-y-4 rounded-2xl border border-border-default bg-app/40 p-5">
                    <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Results</h3>
                      <span className="text-xs text-text-disabled">{(resolvedQuestion.options || []).reduce((acc, o) => acc + (o.vote_count ?? 0), 0)} total votes</span>
                    </div>

                    {correctOption && (
                      <div
                        className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs leading-relaxed ${
                          !isAuthor && resolvedQuestion.viewer_state?.has_answered
                            ? selectedCorrectOption
                              ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-400"
                              : "border-amber-500/25 bg-amber-500/5 text-amber-400"
                            : "border-sky-500/25 bg-sky-500/5 text-sky-400"
                        }`}
                      >
                        <CheckCircleIcon className="h-4 w-4 shrink-0" />
                        <span>
                          {!isAuthor && resolvedQuestion.viewer_state?.has_answered
                            ? selectedCorrectOption
                              ? "You picked the correct answer."
                              : `Incorrect. Correct answer is: ${correctOption.text}`
                            : `Correct answer: ${correctOption.text}`}
                        </span>
                      </div>
                    )}

                    <div className="space-y-3.5">
                      {(resolvedQuestion.options || []).map((option) => (
                        <div key={option.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2 font-medium text-text-primary">
                              <span>{option.text}</span>
                              {option.is_correct && (
                                <span className="rounded bg-emerald-500/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                                  Correct
                                </span>
                              )}
                              {option.selected_by_me && !option.is_correct && (
                                <span className="rounded bg-surface-hover px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-text-muted border border-border-strong/50">
                                  Your answer
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-text-disabled font-medium">
                              {option.vote_count ?? 0} votes ({option.vote_percent ?? 0}%)
                            </span>
                          </div>
                          
                          {/* Premium horizontal progress bar */}
                          <div className="h-2 overflow-hidden rounded-full bg-surface border border-border-default/40">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                option.is_correct
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                  : option.selected_by_me
                                  ? "bg-gradient-to-r from-amber-500 to-orange-400"
                                  : "bg-surface-active"
                              }`}
                              style={{ width: `${option.vote_percent ?? 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-default bg-app/20 px-4 py-8 text-center">
                    <LockIcon className="h-5 w-5 text-text-disabled mb-2" />
                    <p className="text-xs text-text-disabled">Answer this MCQ to unlock results and discussion.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Open Q&A answer composor / details */}
                {!user ? (
                  <div className="rounded-2xl border border-border-default bg-app/40 p-5 text-sm text-text-muted">
                    <p>Sign in to post an answer and unlock discussion.</p>
                    <div className="mt-3.5">
                      <Link href="/login" className="rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">
                        Go to Sign In
                      </Link>
                    </div>
                  </div>
                ) : !isAuthor && resolvedQuestion.status === "open" ? (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Write your Solution</h3>
                    <OpenAnswerForm
                      initialValue={myAnswer?.body ?? ""}
                      submitLabel={myAnswer ? "Update answer" : "Post answer"}
                      onSubmit={handleAnswerSubmit}
                      placeholder="Write a clear answer with reasoning, examples, or code…"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border-default bg-surface/10 px-5 py-4 text-xs text-text-muted">
                    {isAuthor ? "You asked this question." : "This question is closed."}
                  </div>
                )}

                {/* Answers list */}
                {!resolvedQuestion.viewer_state?.can_view_locked_content ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-default bg-app/20 px-4 py-10 text-center">
                    <LockIcon className="h-5 w-5 text-text-disabled mb-2" />
                    <p className="text-xs text-text-disabled">Post your answer first to unlock the full answer list and discussion.</p>
                  </div>
                ) : answersLoading ? (
                  <div className="flex justify-center py-10">
                    <Spinner size="md" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border-subtle pb-2">Solutions ({answers.length})</h3>
                    <AnswerList
                      answers={answers}
                      currentUser={user}
                      canAccept={Boolean(resolvedQuestion.viewer_state?.can_accept_answer)}
                      onAccept={handleAccept}
                      onToggleVote={(answer) => handleVote(answer.id, Boolean(answer.is_upvoted_by_me))}
                    />
                  </div>
                )}
              </>
            )}

            {actionError && <p className="text-xs text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded-lg px-3 py-2">{actionError}</p>}

            {/* Discussions Area */}
            {!resolvedQuestion.viewer_state?.can_view_locked_content ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-default bg-app/20 px-4 py-8 text-center">
                <LockIcon className="h-4 w-4 text-text-disabled mb-2" />
                <p className="text-xs text-text-disabled">
                  {user ? "Answer to unlock discussion." : "Sign in and answer to unlock discussion."}
                </p>
              </div>
            ) : discussionLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size="md" />
              </div>
            ) : (
              <div className="pt-4">
                <DiscussionPanel
                  questionId={resolvedQuestion.id}
                  currentUser={user}
                  comments={comments}
                  onRefresh={refetchDiscussion}
                  questionAuthorId={resolvedQuestion.author_id}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Desktop sticky sidebar */}
        <aside className="hidden lg:block bg-app/15 p-5 space-y-5 sticky top-[53px] h-[calc(100vh-53px)] overflow-y-auto border-t border-border-subtle">
          {sidebarContent}
        </aside>

      </div>

      {/* Mobile-only layout widgets rendered at the bottom of page */}
      <div className="lg:hidden space-y-5 border-t border-border-subtle bg-app/15 px-4 py-8">
        {sidebarContent}
      </div>

    </div>
  );
}

