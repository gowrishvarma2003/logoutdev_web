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
} from "./types";
import { API_BASE_URL } from "./apiBaseUrl";

export { API_BASE_URL };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  // Auto-logout on 401
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
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function getCurrentUser(): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<{ user: User }>(res);
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
  linkedEntity?: { type: string; id: string } | null
): Promise<{ post: Post }> {
  const res = await fetch(`${API_BASE_URL}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      content,
      linked_entity_type: linkedEntity?.type,
      linked_entity_id: linkedEntity?.id,
    }),
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
  content: string
): Promise<{ reply: Post }> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/replies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ content }),
  });
  return handleResponse<{ reply: Post }>(res);
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
): Promise<{ following: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}/follow`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(res);
}

export async function unfollowUser(
  userId: string
): Promise<{ following: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}/follow`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(res);
}

export async function getFollowers(
  userId: string
): Promise<{ followers: User[] }> {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}/followers`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<{ followers: User[] }>(res);
}

export async function getFollowing(
  userId: string
): Promise<{ following: User[] }> {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}/following`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<{ following: User[] }>(res);
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
  tab?: "needs-action" | "unread" | "all";
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
  tab: "needs-action" | "unread" | "all" = "all"
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
