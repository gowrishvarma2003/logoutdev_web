import { API_BASE_URL } from "../apiBaseUrl";
import type {
  McqMode,
  Question,
  QuestionAnswer,
  QuestionDiscussionComment,
  QuestionTagType,
  QuestionType,
} from "../types";

const API = API_BASE_URL;

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleRes<T>(res: Response): Promise<T> {
  if (res.status === 401 && typeof window !== "undefined") {
    throw new Error("Unauthorized");
  }

  const data = await res.json();
  if (!res.ok) {
    const message = data.error || "Request failed";
    const error = new Error(message) as Error & { code?: string };
    if (data.code) error.code = data.code;
    throw error;
  }

  return data as T;
}

function appendCsv(params: URLSearchParams, key: string, values?: string[]) {
  if (!values || values.length === 0) return;
  params.set(key, values.join(","));
}

export interface QuestionListFilters {
  type?: QuestionType | "";
  status?: "open" | "closed" | "";
  needs_my_answer?: boolean;
  role?: string[];
  stack?: string[];
  topic?: string[];
  sort?: "newest" | "active" | "unanswered" | "top";
  page?: number;
  limit?: number;
}

export interface QuestionUpsertPayload {
  title: string;
  body: string;
  type: QuestionType;
  mcq_mode?: McqMode | null;
  options?: string[];
  correct_option_index?: number;
  tags: Array<{ tag_type: QuestionTagType; tag: string }>;
}

export async function listQuestions(filters: QuestionListFilters = {}) {
  const params = new URLSearchParams();

  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.needs_my_answer !== undefined) {
    params.set("needs_my_answer", String(filters.needs_my_answer));
  }
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  appendCsv(params, "role", filters.role);
  appendCsv(params, "stack", filters.stack);
  appendCsv(params, "topic", filters.topic);

  const qs = params.toString();
  const res = await fetch(`${API}/api/questions${qs ? `?${qs}` : ""}`, {
    headers: { ...authHeaders() },
  });
  return handleRes<{ questions: Question[]; total: number; page: number; limit: number }>(res);
}

export async function getQuestion(questionId: string) {
  const res = await fetch(`${API}/api/questions/${questionId}`, {
    headers: { ...authHeaders() },
  });
  return handleRes<{ question: Question }>(res);
}

export async function createQuestion(body: QuestionUpsertPayload) {
  const res = await fetch(`${API}/api/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes<{ question: Question }>(res);
}

export async function updateQuestion(questionId: string, body: Partial<QuestionUpsertPayload>) {
  const res = await fetch(`${API}/api/questions/${questionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes<{ question: Question }>(res);
}

export async function closeQuestion(questionId: string) {
  const res = await fetch(`${API}/api/questions/${questionId}/close`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleRes<{ question: Question }>(res);
}

export async function reopenQuestion(questionId: string) {
  const res = await fetch(`${API}/api/questions/${questionId}/reopen`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleRes<{ question: Question }>(res);
}

export async function submitMcqResponse(questionId: string, option_ids: string[]) {
  const res = await fetch(`${API}/api/questions/${questionId}/mcq-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ option_ids }),
  });
  return handleRes<{ question: Question }>(res);
}

export async function putMyAnswer(questionId: string, body: string) {
  const res = await fetch(`${API}/api/questions/${questionId}/my-answer`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ body }),
  });
  return handleRes<{ answer: QuestionAnswer }>(res);
}

export async function listAnswers(questionId: string) {
  const res = await fetch(`${API}/api/questions/${questionId}/answers`, {
    headers: { ...authHeaders() },
  });
  return handleRes<{ answers: QuestionAnswer[] }>(res);
}

export async function upvoteAnswer(questionId: string, answerId: string) {
  const res = await fetch(`${API}/api/questions/${questionId}/answers/${answerId}/upvote`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleRes<{ answer: QuestionAnswer }>(res);
}

export async function removeAnswerUpvote(questionId: string, answerId: string) {
  const res = await fetch(`${API}/api/questions/${questionId}/answers/${answerId}/upvote`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes<{ answer: QuestionAnswer }>(res);
}

export async function acceptAnswer(questionId: string, answerId: string) {
  const res = await fetch(`${API}/api/questions/${questionId}/answers/${answerId}/accept`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleRes<{ answer: QuestionAnswer }>(res);
}

export async function listDiscussion(questionId: string) {
  const res = await fetch(`${API}/api/questions/${questionId}/discussion`, {
    headers: { ...authHeaders() },
  });
  return handleRes<{ comments: QuestionDiscussionComment[] }>(res);
}

export async function createDiscussionComment(questionId: string, body: string, parentCommentId?: string) {
  const path = parentCommentId
    ? `${API}/api/questions/${questionId}/discussion/${parentCommentId}/replies`
    : `${API}/api/questions/${questionId}/discussion`;

  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ body }),
  });
  return handleRes<{ comment: QuestionDiscussionComment }>(res);
}
