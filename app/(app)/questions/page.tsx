"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useQuestionList } from "@/lib/hooks/useQuestions";
import type { QuestionListFilters } from "@/lib/services/questionsApi";
import QuestionCard from "@/components/questions/QuestionCard";
import QuestionFilters from "@/components/questions/QuestionFilters";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { QuestionMarkCircleIcon } from "@/components/ui/Icons";

export default function QuestionsPage() {
  const { user, isLoaded } = useAuth();
  const [filters, setFilters] = useState<QuestionListFilters>({
    sort: "active",
    page: 1,
    limit: 20,
  });
  const { questions, total, loading, error } = useQuestionList(filters);

  useEffect(() => {
    if (!isLoaded) return;
    setFilters((prev) => ({
      ...prev,
      status: user ? prev.status || "open" : prev.status || "",
      needs_my_answer: user ? prev.needs_my_answer ?? true : false,
      sort: prev.sort || "active",
      page: 1,
    }));
  }, [isLoaded, user]);

  function updateFilters(patch: Partial<QuestionListFilters>) {
    setFilters((prev) => ({
      ...prev,
      ...patch,
      page: 1,
    }));
  }

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-border-default bg-app/80 px-4 py-4 backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-text-primary">Questions</h1>
            <p className="mt-0.5 text-sm text-text-disabled">
              Ask for help, post MCQs, and unlock discussion only after answering.
            </p>
          </div>

          {user ? (
            <Link
              href="/questions/ask"
              className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Ask Question
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex rounded-xl border border-border-strong px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
            >
              Sign in to ask
            </Link>
          )}
        </div>
      </header>

      <QuestionFilters
        filters={filters}
        onChange={updateFilters}
        isAuthenticated={Boolean(user)}
      />



      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="px-4 py-16 text-center text-sm text-text-disabled">{error}</div>
      ) : questions.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={<QuestionMarkCircleIcon className="h-7 w-7" />}
            title="No questions found"
            description="Try loosening your filters, or ask the question other developers are probably wondering about too."
            tone="question"
            action={
              <Link href="/questions/ask" className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">
                Ask a question
              </Link>
            }
          />
        </div>
      ) : (
        questions.map((question) => (
          <QuestionCard key={question.id} question={question} currentUser={user} />
        ))
      )}
    </div>
  );
}
