import { API_BASE_URL } from "../apiBaseUrl";
/**
 * profilesApi — all Developer Profile API calls.
 * Mirrors src/routes/profiles/profileRoutes.js endpoint contract.
 */

import type {
  ProfileResponse,
  ProfileQuestionsResponse,
  ProfileReposResponse,
  ProofOfWorkSignals,
  UserProfileSkill,
  UserFeaturedProject,
  Post,
  ProjectSpace,
  ActivityItem,
  User,
  Launch,
  FreelanceProject,
  FreelanceProposal,
} from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

// ─── Profile Read Endpoints ───────────────────────────────────────────────────

/** GET /api/profiles/:username — full profile overview */
export async function getProfile(username: string): Promise<ProfileResponse> {
  const res = await fetch(`${API_BASE_URL}/api/profiles/${encodeURIComponent(username)}`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<ProfileResponse>(res);
}

/** GET /api/profiles/:username/projects — paginated owned + contributed spaces */
export async function getProfileProjects(
  username: string,
  page = 1,
  limit = 20
): Promise<{ projects: ProjectSpace[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(
    `${API_BASE_URL}/api/profiles/${encodeURIComponent(username)}/projects?${qs}`,
    { headers: { ...getAuthHeaders() } }
  );
  return handleResponse(res);
}

/** GET /api/profiles/:username/posts — paginated posts (no replies) */
export async function getProfilePosts(
  username: string,
  page = 1,
  limit = 20
): Promise<{ posts: Post[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(
    `${API_BASE_URL}/api/profiles/${encodeURIComponent(username)}/posts?${qs}`,
    { headers: { ...getAuthHeaders() } }
  );
  return handleResponse(res);
}

/** GET /api/profiles/:username/activity — unified activity timeline */
export async function getProfileActivity(
  username: string,
  page = 1,
  limit = 20
): Promise<{ activity: ActivityItem[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(
    `${API_BASE_URL}/api/profiles/${encodeURIComponent(username)}/activity?${qs}`,
    { headers: { ...getAuthHeaders() } }
  );
  return handleResponse(res);
}

/** GET /api/profiles/:username/signals — proof-of-work score */
export async function getProfileSignals(
  username: string
): Promise<{ signals: ProofOfWorkSignals }> {
  const res = await fetch(
    `${API_BASE_URL}/api/profiles/${encodeURIComponent(username)}/signals`,
    { headers: { ...getAuthHeaders() } }
  );
  return handleResponse(res);
}

export async function getProfileLaunches(
  username: string
): Promise<{ launches: Launch[] }> {
  const res = await fetch(
    `${API_BASE_URL}/api/profiles/${encodeURIComponent(username)}/launches`,
    { headers: { ...getAuthHeaders() } }
  );
  return handleResponse(res);
}

export async function getProfileFreelance(
  username: string
): Promise<{ client_projects: FreelanceProject[]; wins: FreelanceProposal[] }> {
  const res = await fetch(
    `${API_BASE_URL}/api/profiles/${encodeURIComponent(username)}/freelance`,
    { headers: { ...getAuthHeaders() } }
  );
  return handleResponse(res);
}

// ─── Profile Write Endpoints (owner only) ────────────────────────────────────

/** PATCH /api/profiles/me — update profile metadata */
export async function patchMyProfile(
  updates: Partial<
    Pick<User, "name" | "headline" | "bio" | "location" | "website_url" | "github_url" | "linkedin_url" | "username" | "pronouns" | "open_to_work">
  >
): Promise<{ profile: User }> {
  const res = await fetch(`${API_BASE_URL}/api/profiles/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(updates),
  });
  return handleResponse(res);
}

/** PUT /api/profiles/me/skills — replace skills list (ordered array of strings) */
export async function replaceMySkills(
  skills: string[]
): Promise<{ skills: UserProfileSkill[] }> {
  const res = await fetch(`${API_BASE_URL}/api/profiles/me/skills`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ skills }),
  });
  return handleResponse(res);
}

/** PUT /api/profiles/me/featured-projects — set pinned space IDs (max 3) */
export async function replaceMyFeaturedProjects(
  spaceIds: string[]
): Promise<{ featured_projects: UserFeaturedProject[] }> {
  const res = await fetch(`${API_BASE_URL}/api/profiles/me/featured-projects`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ space_ids: spaceIds }),
  });
  return handleResponse(res);
}

/** GET /api/profiles/:username/questions — paginated authored questions */
export async function getProfileQuestions(
  username: string,
  page = 1,
  limit = 20
): Promise<ProfileQuestionsResponse> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(
    `${API_BASE_URL}/api/profiles/${encodeURIComponent(username)}/questions?${qs}`,
    { headers: { ...getAuthHeaders() } }
  );
  return handleResponse(res);
}

/** GET /api/profiles/:username/repos — owned repos + recent PR/review activity */
export async function getProfileRepos(
  username: string,
  page = 1,
  limit = 20
): Promise<ProfileReposResponse> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(
    `${API_BASE_URL}/api/profiles/${encodeURIComponent(username)}/repos?${qs}`,
    { headers: { ...getAuthHeaders() } }
  );
  return handleResponse(res);
}

/** PUT /api/profiles/me/avatar — upload avatar image (multipart/form-data) */
export async function uploadMyAvatar(
  file: File
): Promise<{ profile: User }> {
  const form = new FormData();
  form.append("avatar", file);
  const res = await fetch(`${API_BASE_URL}/api/profiles/me/avatar`, {
    method: "PUT",
    headers: { ...getAuthHeaders() },
    body: form,
  });
  return handleResponse(res);
}

/** DELETE /api/profiles/me/avatar — remove avatar image */
export async function deleteMyAvatar(): Promise<{ profile: User }> {
  const res = await fetch(`${API_BASE_URL}/api/profiles/me/avatar`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(res);
}

/** PUT /api/profiles/me/banner — upload banner image (multipart/form-data) */
export async function uploadMyBanner(
  file: File
): Promise<{ profile: User }> {
  const form = new FormData();
  form.append("banner", file);
  const res = await fetch(`${API_BASE_URL}/api/profiles/me/banner`, {
    method: "PUT",
    headers: { ...getAuthHeaders() },
    body: form,
  });
  return handleResponse(res);
}

/** DELETE /api/profiles/me/banner — remove banner image */
export async function deleteMyBanner(): Promise<{ profile: User }> {
  const res = await fetch(`${API_BASE_URL}/api/profiles/me/banner`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(res);
}
