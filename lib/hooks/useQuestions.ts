"use client";

import { useCallback, useEffect, useState } from "react";
import type { Question, QuestionAnswer, QuestionDiscussionComment } from "../types";
import * as api from "../services/questionsApi";
import type { QuestionListFilters } from "../services/questionsApi";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[], enabled = true) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });

  const load = useCallback(async () => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setState({ data: null, loading: false, error: message });
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}

export function useQuestionList(filters: QuestionListFilters) {
  const result = useAsync(() => api.listQuestions(filters), [
    filters.type,
    filters.status,
    filters.needs_my_answer,
    JSON.stringify(filters.role || []),
    JSON.stringify(filters.stack || []),
    JSON.stringify(filters.topic || []),
    filters.sort,
    filters.page,
    filters.limit,
  ]);

  return {
    questions: result.data?.questions ?? [],
    total: result.data?.total ?? 0,
    page: result.data?.page ?? filters.page ?? 1,
    limit: result.data?.limit ?? filters.limit ?? 20,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useQuestion(questionId: string) {
  const result = useAsync(() => api.getQuestion(questionId), [questionId], Boolean(questionId));
  return {
    question: (result.data as { question: Question } | null)?.question ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useQuestionAnswers(questionId: string, enabled: boolean) {
  const result = useAsync(() => api.listAnswers(questionId), [questionId], enabled);
  return {
    answers: (result.data as { answers: QuestionAnswer[] } | null)?.answers ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useQuestionDiscussion(questionId: string, enabled: boolean) {
  const result = useAsync(() => api.listDiscussion(questionId), [questionId], enabled);
  return {
    comments:
      (result.data as { comments: QuestionDiscussionComment[] } | null)?.comments ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
