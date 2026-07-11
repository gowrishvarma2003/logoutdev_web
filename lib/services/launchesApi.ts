import { API_BASE_URL } from "../apiBaseUrl";
import { clearClientSessionAndRedirect } from "../auth/logoutCleanup";
import type {
  Launch,
  LaunchBetaRegistration,
  LaunchCollaborationRequestPayload,
  LaunchFeedbackItem,
  LaunchListResponse,
  LaunchReview,
} from "../types";

const API = API_BASE_URL;

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleRes<T>(res: Response): Promise<T> {
  if (res.status === 401 && typeof window !== "undefined") {
    clearClientSessionAndRedirect("/login");
    throw new Error("Unauthorized");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== "");
  if (!entries.length) return "";
  return `?${entries.map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join("&")}`;
}

export async function listLaunches(filters?: {
  q?: string;
  product_type?: string;
  development_stage?: string;
  launch_phase?: string;
  stack?: string;
  seeking_collaborators?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<LaunchListResponse> {
  const res = await fetch(
    `${API}/api/launches${qs({
      q: filters?.q,
      product_type: filters?.product_type,
      development_stage: filters?.development_stage,
      launch_phase: filters?.launch_phase,
      stack: filters?.stack,
      seeking_collaborators: filters?.seeking_collaborators,
      sort: filters?.sort,
      page: filters?.page,
      limit: filters?.limit,
    })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function getMyLaunches(): Promise<LaunchListResponse> {
  const res = await fetch(`${API}/api/launches/me`, { headers: { ...authHeaders() } });
  return handleRes(res);
}

export async function getLaunch(launchId: string): Promise<{ launch: Launch }> {
  const res = await fetch(`${API}/api/launches/${launchId}`, { headers: { ...authHeaders() } });
  return handleRes(res);
}

export async function createLaunch(body: {
  name: string;
  tagline: string;
  description: string;
  product_type: string;
  development_stage: string;
  launch_phase: string;
  beta_capacity?: number | null;
  beta_access_url?: string;
  live_url?: string;
  demo_url?: string;
  website_url?: string;
  github_url?: string;
  docs_url?: string;
  collaboration_mode: string;
  collaboration_note?: string;
  collaboration_roles: string[];
  linked_space_id?: string | null;
  is_open_source?: boolean;
  repo_ids?: string[];
  screenshots: string[];
  image_files?: File[];
  tech_stack: string[];
  status?: "draft" | "published";
  publish_now?: boolean;
}): Promise<{ launch: Launch }> {
  const { image_files: imageFiles = [], ...payload } = body;
  const formData = new FormData();
  formData.append("payload", JSON.stringify(payload));
  imageFiles.forEach((file) => formData.append("images", file));
  const res = await fetch(`${API}/api/launches`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });
  return handleRes(res);
}

export async function updateLaunch(
  launchId: string,
  body: Partial<{
    name: string;
    tagline: string;
    description: string;
    product_type: string;
    development_stage: string;
    launch_phase: string;
    beta_capacity: number | null;
    beta_access_url: string;
    live_url: string;
    demo_url: string;
    website_url: string;
    github_url: string;
    docs_url: string;
    collaboration_mode: string;
    collaboration_note: string;
    collaboration_roles: string[];
    linked_space_id: string | null;
    is_open_source: boolean;
    repo_ids: string[];
    screenshots: string[];
    image_files: File[];
    tech_stack: string[];
  }>
): Promise<{ launch: Launch }> {
  const { image_files: imageFiles = [], ...payload } = body;
  const formData = new FormData();
  formData.append("payload", JSON.stringify(payload));
  imageFiles.forEach((file) => formData.append("images", file));
  const res = await fetch(`${API}/api/launches/${launchId}`, {
    method: "PATCH",
    headers: { ...authHeaders() },
    body: formData,
  });
  return handleRes(res);
}

export async function publishLaunch(launchId: string): Promise<{ launch: Launch }> {
  const res = await fetch(`${API}/api/launches/${launchId}/publish`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function archiveLaunch(launchId: string): Promise<{ launch: Launch }> {
  const res = await fetch(`${API}/api/launches/${launchId}/archive`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function deleteLaunch(launchId: string): Promise<{ deleted: boolean; launch_id: string }> {
  const res = await fetch(`${API}/api/launches/${launchId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function goLiveLaunch(
  launchId: string,
  body?: { live_url?: string }
): Promise<{ launch: Launch }> {
  const res = await fetch(`${API}/api/launches/${launchId}/go-live`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body ?? {}),
  });
  return handleRes(res);
}

export async function upvoteLaunch(launchId: string): Promise<{ upvoted: boolean; upvote_count: number }> {
  const res = await fetch(`${API}/api/launches/${launchId}/upvote`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function removeLaunchUpvote(launchId: string): Promise<{ upvoted: boolean; upvote_count: number }> {
  const res = await fetch(`${API}/api/launches/${launchId}/upvote`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function listLaunchReviews(
  launchId: string,
  filters?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    sort?: string;
    mine?: boolean;
    bookmarked?: boolean;
  }
): Promise<{ reviews: LaunchReview[]; total: number; page: number; limit: number }> {
  const res = await fetch(
    `${API}/api/launches/${launchId}/reviews${qs({
      page: filters?.page ?? 1,
      limit: filters?.limit ?? 20,
      category: filters?.category,
      status: filters?.status,
      sort: filters?.sort,
      mine: filters?.mine ? "true" : undefined,
      bookmarked: filters?.bookmarked ? "true" : undefined,
    })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function createLaunchReview(
  launchId: string,
  body: {
    headline: string;
    body: string;
    recommendation?: string;
    category?: string;
  }
): Promise<{ review: LaunchReview }> {
  const res = await fetch(`${API}/api/launches/${launchId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

/** @deprecated Prefer createLaunchReview — always creates a new entry. */
export async function upsertMyLaunchReview(
  launchId: string,
  body: {
    headline: string;
    body: string;
    recommendation?: string;
    category?: string;
  }
): Promise<{ review: LaunchReview }> {
  return createLaunchReview(launchId, body);
}

export async function updateLaunchReview(
  launchId: string,
  reviewId: string,
  body: Partial<{
    headline: string;
    body: string;
    recommendation: string;
    category: string;
    status: string;
  }>
): Promise<{ review: LaunchReview }> {
  const res = await fetch(`${API}/api/launches/${launchId}/reviews/${reviewId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function deleteLaunchReview(
  launchId: string,
  reviewId: string
): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API}/api/launches/${launchId}/reviews/${reviewId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

/** @deprecated Prefer deleteLaunchReview with a specific id. */
export async function deleteMyLaunchReview(launchId: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API}/api/launches/${launchId}/my-review`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function createLaunchReviewComment(
  launchId: string,
  reviewId: string,
  body: { body: string }
): Promise<{ comment: NonNullable<LaunchReview["comments"]>[number] }> {
  const res = await fetch(`${API}/api/launches/${launchId}/reviews/${reviewId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function bookmarkLaunchReview(
  launchId: string,
  reviewId: string
): Promise<{ bookmarked: boolean }> {
  const res = await fetch(`${API}/api/launches/${launchId}/reviews/${reviewId}/bookmark`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function unbookmarkLaunchReview(
  launchId: string,
  reviewId: string
): Promise<{ bookmarked: boolean }> {
  const res = await fetch(`${API}/api/launches/${launchId}/reviews/${reviewId}/bookmark`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function listLaunchFeedback(
  launchId: string,
  filters?: {
    type?: string;
    status?: string;
    sort?: string;
    mine?: boolean;
    bookmarked?: boolean;
    page?: number;
    limit?: number;
  }
): Promise<{ feedback: LaunchFeedbackItem[]; total: number; page: number; limit: number }> {
  const res = await fetch(
    `${API}/api/launches/${launchId}/feedback${qs({
      type: filters?.type,
      status: filters?.status,
      sort: filters?.sort,
      mine: filters?.mine ? "true" : undefined,
      bookmarked: filters?.bookmarked ? "true" : undefined,
      page: filters?.page,
      limit: filters?.limit,
    })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function createLaunchFeedback(
  launchId: string,
  body: { type: string; title: string; body: string }
): Promise<{ feedback: LaunchFeedbackItem }> {
  const res = await fetch(`${API}/api/launches/${launchId}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function requestBetaAccess(
  launchId: string,
  body?: { message?: string }
): Promise<{ registration: LaunchBetaRegistration }> {
  const res = await fetch(`${API}/api/launches/${launchId}/beta-registrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body ?? {}),
  });
  return handleRes(res);
}

export async function withdrawBetaAccess(
  launchId: string
): Promise<{ registration: LaunchBetaRegistration }> {
  const res = await fetch(`${API}/api/launches/${launchId}/beta-registrations/me`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function listBetaRegistrations(
  launchId: string
): Promise<{ registrations: LaunchBetaRegistration[] }> {
  const res = await fetch(`${API}/api/launches/${launchId}/beta-registrations`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function approveBetaRegistration(
  launchId: string,
  registrationId: string
): Promise<{ registration: LaunchBetaRegistration }> {
  const res = await fetch(`${API}/api/launches/${launchId}/beta-registrations/${registrationId}/approve`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function rejectBetaRegistration(
  launchId: string,
  registrationId: string
): Promise<{ registration: LaunchBetaRegistration }> {
  const res = await fetch(`${API}/api/launches/${launchId}/beta-registrations/${registrationId}/reject`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function updateLaunchFeedback(
  launchId: string,
  feedbackId: string,
  body: Partial<{ type: string; title: string; body: string; status: string }>
): Promise<{ feedback: LaunchFeedbackItem }> {
  const res = await fetch(`${API}/api/launches/${launchId}/feedback/${feedbackId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function deleteLaunchFeedback(
  launchId: string,
  feedbackId: string
): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API}/api/launches/${launchId}/feedback/${feedbackId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function createLaunchFeedbackComment(
  launchId: string,
  feedbackId: string,
  body: { body: string }
): Promise<{ comment: NonNullable<LaunchFeedbackItem["comments"]>[number] }> {
  const res = await fetch(`${API}/api/launches/${launchId}/feedback/${feedbackId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function bookmarkLaunchFeedback(
  launchId: string,
  feedbackId: string
): Promise<{ bookmarked: boolean }> {
  const res = await fetch(`${API}/api/launches/${launchId}/feedback/${feedbackId}/bookmark`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function unbookmarkLaunchFeedback(
  launchId: string,
  feedbackId: string
): Promise<{ bookmarked: boolean }> {
  const res = await fetch(`${API}/api/launches/${launchId}/feedback/${feedbackId}/bookmark`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function createLaunchCollaborationRequest(
  launchId: string,
  body: LaunchCollaborationRequestPayload
): Promise<{ joinRequest: { id: string; status: string } }> {
  const res = await fetch(`${API}/api/launches/${launchId}/collaboration-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}
