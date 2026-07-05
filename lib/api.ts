import type {
  AuthResponse,
  FeedResponse,
  HashtagFeedResponse,
  HashtagSuggestion,
  NotificationListResponse,
  NotificationSummary,
  Post,
  PostResponse,
  RelatedHashtag,
  User,
  UserSuggestion,
  PlatformEntity,
  FollowListUser,
} from "./types";
import { API_BASE_URL } from "./apiBaseUrl";
import { clearClientSessionAndRedirect } from "./auth/logoutCleanup";

export { API_BASE_URL };

export class ApiError extends Error {
  status: number;
  code?: string;
  data: Record<string, unknown>;

  constructor(message: string, status: number, data: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = typeof data.code === "string" ? data.code : undefined;
    this.data = data;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));

  // Auto-logout on 401
  if (res.status === 401) {
    // A Firebase exchange has no LogoutDev session yet. Do not turn its useful
    // server error into a redirect plus a generic "Unauthorized" message.
    const hasSession = typeof window !== "undefined" && Boolean(localStorage.getItem("authToken"));
    if (hasSession) {
      clearClientSessionAndRedirect("/login");
    }
  }

  if (!res.ok) throw new ApiError(data.error || "Request failed", res.status, data);
  return data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  username: string,
  verificationToken: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, username, verification_token: verificationToken }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function firebaseLogin(
  idToken: string,
  name?: string,
  username?: string
): Promise<AuthResponse> {
  const body: Record<string, string> = {};
  if (name) body.name = name;
  if (username) body.username = username;

  const res = await fetch(`${API_BASE_URL}/api/auth/firebase-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
  });
  return handleResponse<AuthResponse>(res);
}

export async function getCurrentUser(): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<{ user: User }>(res);
}

export async function resetPassword(
  email: string,
  newPassword: string,
  verificationToken: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, newPassword, verification_token: verificationToken }),
  });
  return handleResponse<{ message: string }>(res);
}

export async function checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/username-availability?username=${encodeURIComponent(username)}`);
  return handleResponse(res);
}

export async function sendEmailOtp(email: string, purpose: "signup" | "password_reset"): Promise<{ challenge_token: string | null; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/email-otp/send`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, purpose }),
  });
  return handleResponse(res);
}

export async function verifyEmailOtp(email: string, purpose: "signup" | "password_reset", otp: string, challengeToken: string): Promise<{ verification_token: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/email-otp/verify`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, purpose, otp, challenge_token: challengeToken }),
  });
  return handleResponse(res);
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function getFeed(cursor?: string): Promise<FeedResponse> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await fetch(`${API_BASE_URL}/api/posts/feed${qs}`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<FeedResponse>(res);
}

export async function getExplore(cursor?: string): Promise<FeedResponse> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await fetch(`${API_BASE_URL}/api/posts/explore${qs}`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<FeedResponse>(res);
}

export async function createPost(
  content: string,
  entityTags: Array<{ type: string; id: string }> = [],
  images: File[] = []
): Promise<{ post: Post }> {
  const body = new FormData();
  body.set("content", content);
  body.set("entity_tags", JSON.stringify(entityTags));
  images.forEach((image) => body.append("images", image));
  const res = await fetch(`${API_BASE_URL}/api/posts`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body,
  });
  return handleResponse<{ post: Post }>(res);
}

export async function getPost(id: string): Promise<PostResponse> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<PostResponse>(res);
}

export async function deletePost(id: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<{ message: string }>(res);
}

export async function createReply(
  postId: string,
  content: string,
  entityTags: Array<{ type: string; id: string }> = [],
  images: File[] = []
): Promise<{ reply: Post }> {
  const body = new FormData();
  body.set("content", content);
  body.set("entity_tags", JSON.stringify(entityTags));
  images.forEach((image) => body.append("images", image));
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/replies`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body,
  });
  return handleResponse<{ reply: Post }>(res);
}

export async function suggestPlatformEntities(query = "", types: string[] = []): Promise<{ entities: PlatformEntity[] }> {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (types.length) params.set("types", types.join(","));
  const res = await fetch(`${API_BASE_URL}/api/discovery/entities?${params}`, { headers: { ...getAuthHeaders() } });
  return handleResponse<{ entities: PlatformEntity[] }>(res);
}

export async function getReplies(
  postId: string
): Promise<{ replies: Post[] }> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/replies`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<{ replies: Post[] }>(res);
}

export async function getPostsByHashtag(
  tag: string,
  cursor?: string
): Promise<HashtagFeedResponse> {
  const params = new URLSearchParams({ tag });
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`${API_BASE_URL}/api/posts/by-hashtag?${params.toString()}`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<HashtagFeedResponse>(res);
}

export async function suggestHashtags(
  query: string,
  context?: string
): Promise<{ hashtags: HashtagSuggestion[]; related_tags: RelatedHashtag[] }> {
  const params = new URLSearchParams({ q: query });
  if (context) params.set("context", context);
  const res = await fetch(`${API_BASE_URL}/api/hashtags/suggest?${params.toString()}`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<{ hashtags: HashtagSuggestion[]; related_tags: RelatedHashtag[] }>(res);
}

export async function getTrendingHashtags(
  limit = 6
): Promise<{ hashtags: HashtagSuggestion[] }> {
  const res = await fetch(`${API_BASE_URL}/api/hashtags/trending?limit=${limit}`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<{ hashtags: HashtagSuggestion[] }>(res);
}

// ─── Interactions ─────────────────────────────────────────────────────────────

export async function likePost(
  id: string
): Promise<{ liked: boolean; likeCount: number }> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${id}/like`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(res);
}

export async function unlikePost(
  id: string
): Promise<{ liked: boolean; likeCount: number }> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${id}/like`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(res);
}

export async function repostPost(
  id: string
): Promise<{ reposted: boolean; repostCount: number }> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${id}/repost`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(res);
}

export async function undoRepost(
  id: string
): Promise<{ reposted: boolean; repostCount: number }> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${id}/repost`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(res);
}

// ─── Social ───────────────────────────────────────────────────────────────────

export async function followUser(
  userId: string
): Promise<{ following: boolean; follower_count?: number }> {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}/follow`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(res);
}

export async function unfollowUser(
  userId: string
): Promise<{ following: boolean; follower_count?: number }> {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}/follow`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(res);
}

export async function getFollowers(
  userId: string,
  page = 1,
  limit = 24
): Promise<{ followers: FollowListUser[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(
    `${API_BASE_URL}/api/users/${userId}/followers?${qs}`,
    { headers: { ...getAuthHeaders() } }
  );
  return handleResponse(res);
}

export async function getFollowing(
  userId: string,
  page = 1,
  limit = 24
): Promise<{ following: FollowListUser[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(
    `${API_BASE_URL}/api/users/${userId}/following?${qs}`,
    { headers: { ...getAuthHeaders() } }
  );
  return handleResponse(res);
}

export async function suggestUsers(
  query: string
): Promise<{ users: UserSuggestion[] }> {
  const res = await fetch(`${API_BASE_URL}/api/users/suggest?q=${encodeURIComponent(query)}`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<{ users: UserSuggestion[] }>(res);
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function getNotificationSummary(): Promise<NotificationSummary> {
  const res = await fetch(`${API_BASE_URL}/api/users/me/notifications/summary`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<NotificationSummary>(res);
}

export async function listNotifications(params?: {
  tab?: "priority" | "mentions" | "work" | "social" | "unread" | "all" | "needs-action";
  cursor?: string | null;
  limit?: number;
}): Promise<NotificationListResponse> {
  const search = new URLSearchParams();
  if (params?.tab) search.set("tab", params.tab);
  if (params?.cursor) search.set("cursor", params.cursor);
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  const res = await fetch(
    `${API_BASE_URL}/api/users/me/notifications${qs ? `?${qs}` : ""}`,
    {
      headers: { ...getAuthHeaders() },
    }
  );
  return handleResponse<NotificationListResponse>(res);
}

export async function readNotification(notificationId: string): Promise<{ read: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/users/me/notifications/${notificationId}/read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  return handleResponse<{ read: boolean }>(res);
}

export async function readAllNotifications(
  tab: "priority" | "mentions" | "work" | "social" | "unread" | "all" | "needs-action" = "all"
): Promise<{ read: boolean; updated: number }> {
  const res = await fetch(`${API_BASE_URL}/api/users/me/notifications/read-all`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ tab }),
  });
  return handleResponse<{ read: boolean; updated: number }>(res);
}
