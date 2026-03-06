import type {
  ProjectSpace,
  StackEntry,
  SpaceMember,
  JoinRequest,
  Discussion,
  DiscussionReply,
  SpaceUpdate,
  HealthScore,
  DecisionEntry,
} from "../types";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleRes<T>(res: Response): Promise<T> {
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

// ─── Spaces CRUD ─────────────────────────────────────────────────────────────

export async function listSpaces(filters?: {
  status?: string;
  tag?: string;
  page?: number;
  limit?: number;
}): Promise<{ spaces: ProjectSpace[]; page: number; limit: number; total?: number }> {
  const res = await fetch(
    `${API}/api/spaces${qs({ status: filters?.status, tag: filters?.tag, page: filters?.page, limit: filters?.limit })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function getSpace(spaceId: string): Promise<{ space: ProjectSpace }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function createSpace(body: {
  name: string;
  summary: string;
  description?: string;
  status?: string;
  visibility?: string;
  primary_repo_url?: string;
}): Promise<{ space: ProjectSpace }> {
  const res = await fetch(`${API}/api/spaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function updateSpace(
  spaceId: string,
  body: Partial<{
    name: string;
    summary: string;
    description: string;
    status: string;
    visibility: string;
    primary_repo_url: string;
  }>
): Promise<{ space: ProjectSpace }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function deleteSpace(spaceId: string): Promise<{ archived: boolean }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

// ─── Stack ───────────────────────────────────────────────────────────────────

export async function getStack(spaceId: string): Promise<{ stack: StackEntry[] }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/stack`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function replaceStack(
  spaceId: string,
  stack: Array<{ category: string; technology: string; maturity?: string }>
): Promise<{ stack: StackEntry[] }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/stack`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ stack }),
  });
  return handleRes(res);
}

// ─── Contributors ────────────────────────────────────────────────────────────

export async function getContributors(
  spaceId: string
): Promise<{ contributors: SpaceMember[] }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/contributors`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function updateContributorRole(
  spaceId: string,
  userId: string,
  role: string
): Promise<{ contributor: SpaceMember }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/contributors/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ role }),
  });
  return handleRes(res);
}

export async function removeContributor(
  spaceId: string,
  userId: string
): Promise<{ removed: boolean }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/contributors/${userId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

// ─── Join Requests ───────────────────────────────────────────────────────────

export async function createJoinRequest(
  spaceId: string,
  body: {
    message: string;
    skills?: string[];
    availability_hours?: number;
    proof_links?: string[];
  }
): Promise<{ joinRequest: JoinRequest }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/join-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function listJoinRequests(
  spaceId: string,
  params?: { status?: string; page?: number; limit?: number }
): Promise<{ requests: JoinRequest[]; page: number; limit: number; total?: number }> {
  const res = await fetch(
    `${API}/api/spaces/${spaceId}/join-requests${qs({ status: params?.status, page: params?.page, limit: params?.limit })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function reviewJoinRequest(
  spaceId: string,
  requestId: string,
  action: "accept" | "reject" | "need-info"
): Promise<{ joinRequest: JoinRequest }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/join-requests/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action }),
  });
  return handleRes(res);
}

// ─── Discussions ─────────────────────────────────────────────────────────────

export async function createDiscussion(
  spaceId: string,
  body: { title: string; body: string; category?: string }
): Promise<{ thread: Discussion }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/discussions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function listDiscussions(
  spaceId: string,
  params?: { page?: number; limit?: number }
): Promise<{ threads: Discussion[]; page: number; limit: number; total?: number }> {
  const res = await fetch(
    `${API}/api/spaces/${spaceId}/discussions${qs({ page: params?.page, limit: params?.limit })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function getDiscussion(
  spaceId: string,
  threadId: string
): Promise<{ thread: Discussion }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/discussions/${threadId}`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function addReply(
  spaceId: string,
  threadId: string,
  body: string,
  parentReplyId?: string
): Promise<{ reply: DiscussionReply }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/discussions/${threadId}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      body,
      ...(parentReplyId ? { parent_reply_id: parentReplyId } : {}),
    }),
  });
  return handleRes(res);
}

export async function updateDiscussion(
  spaceId: string,
  threadId: string,
  body: Partial<{
    status: string;
    is_pinned: boolean;
    category: string;
    decision_summary: string;
  }>
): Promise<{ thread: Discussion }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/discussions/${threadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

// ─── Progress Updates ────────────────────────────────────────────────────────

export async function createUpdate(
  spaceId: string,
  body: {
    type: string;
    title: string;
    content: string;
    what_shipped?: string;
    next_up?: string;
    blockers?: string;
    evidence_links?: string[];
  }
): Promise<{ update: SpaceUpdate }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/updates`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function listUpdates(
  spaceId: string,
  params?: { page?: number; limit?: number }
): Promise<{ updates: SpaceUpdate[]; page: number; limit: number; total?: number }> {
  const res = await fetch(
    `${API}/api/spaces/${spaceId}/updates${qs({ page: params?.page, limit: params?.limit })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function patchUpdate(
  spaceId: string,
  updateId: string,
  body: Partial<{
    title: string;
    content: string;
    what_shipped: string;
    next_up: string;
    blockers: string;
    evidence_links: string[];
  }>
): Promise<{ update: SpaceUpdate }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/updates/${updateId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function deleteUpdate(
  spaceId: string,
  updateId: string
): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/updates/${updateId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

// ─── Signals ─────────────────────────────────────────────────────────────────

export async function getHealth(
  spaceId: string
): Promise<{ health: HealthScore }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/health`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function getDecisions(
  spaceId: string
): Promise<{ decisions: DecisionEntry[] }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/decisions`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}
