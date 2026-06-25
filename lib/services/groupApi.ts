import { API_BASE_URL } from "@/lib/apiBaseUrl";
import type {
  ChatConversation,
  ChatGroupInvite,
  ChatGroupKeyEnvelope,
  ChatGroupKeyEpoch,
  ChatGroupMember,
  ChatMessage,
} from "@/lib/types";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function jsonHeaders() {
  return { "Content-Type": "application/json", ...getAuthHeaders() };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export async function createGroup(input: {
  title: string;
  description?: string | null;
  avatar_storage_key?: string | null;
  member_user_ids: string[];
  settings?: Record<string, unknown>;
  epoch_envelopes: Array<{
    target_user_id: string;
    target_device_id: string;
    encrypted_key_payload: string;
    encryption_version?: string;
  }>;
}): Promise<{ conversation: ChatConversation }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/groups`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  return handleResponse(res);
}

export async function getGroup(conversationId: string): Promise<{ conversation: ChatConversation }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/groups/${encodeURIComponent(conversationId)}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function updateGroup(conversationId: string, patch: Record<string, unknown>): Promise<{ conversation: ChatConversation }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/groups/${encodeURIComponent(conversationId)}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(patch),
  });
  return handleResponse(res);
}

export async function deleteGroup(conversationId: string): Promise<{ conversation_id: string }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/groups/${encodeURIComponent(conversationId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function listGroupMembers(
  conversationId: string,
  cursor?: string
): Promise<{ members: ChatGroupMember[]; next_cursor: string | null }> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await fetch(`${API_BASE_URL}/api/chat/groups/${encodeURIComponent(conversationId)}/members${qs}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function addGroupMembers(
  conversationId: string,
  input: {
    member_user_ids: string[];
    epoch_envelopes: Array<{ target_user_id: string; target_device_id: string; encrypted_key_payload: string; encryption_version?: string }>;
  }
): Promise<{ epoch: { id: string; epoch_number: number }; added_member_ids: string[]; readded_member_ids: string[] }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/groups/${encodeURIComponent(conversationId)}/members`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  return handleResponse(res);
}

export async function removeGroupMember(
  conversationId: string,
  userId: string,
  epochEnvelopes: Array<{ target_user_id: string; target_device_id: string; encrypted_key_payload: string; encryption_version?: string }>
): Promise<{ epoch: { id: string; epoch_number: number }; removed_user_id: string }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/groups/${encodeURIComponent(conversationId)}/members/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: jsonHeaders(),
    body: JSON.stringify({ epoch_envelopes: epochEnvelopes }),
  });
  return handleResponse(res);
}

export async function updateGroupMemberRole(
  conversationId: string,
  userId: string,
  role: "admin" | "member"
): Promise<{ target_user_id: string; role: string }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/groups/${encodeURIComponent(conversationId)}/members/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify({ role }),
  });
  return handleResponse(res);
}

export async function leaveGroup(
  conversationId: string,
  epochEnvelopes: Array<{ target_user_id: string; target_device_id: string; encrypted_key_payload: string; encryption_version?: string }>
): Promise<{ epoch: { id: string; epoch_number: number }; left_user_id: string }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/groups/${encodeURIComponent(conversationId)}/leave`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ epoch_envelopes: epochEnvelopes }),
  });
  return handleResponse(res);
}

export async function transferGroupOwnership(conversationId: string, targetUserId: string) {
  const res = await fetch(`${API_BASE_URL}/api/chat/groups/${encodeURIComponent(conversationId)}/transfer-ownership`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ target_user_id: targetUserId }),
  });
  return handleResponse(res);
}

export async function listGroupKeyEpochs(
  conversationId: string,
  cursor?: string
): Promise<{ epochs: ChatGroupKeyEpoch[]; next_cursor: string | null }> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await fetch(`${API_BASE_URL}/api/chat/groups/${encodeURIComponent(conversationId)}/key-epochs${qs}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function listUnconsumedGroupKeyEnvelopes(
  conversationId: string,
  deviceIds: string[]
): Promise<{ envelopes: ChatGroupKeyEnvelope[] }> {
  throw new Error("listUnconsumedGroupKeyEnvelopes is deprecated.");
}

export async function consumeGroupKeyEnvelopes(envelopeIds: string[]) {
  throw new Error("consumeGroupKeyEnvelopes is deprecated.");
}

export async function createGroupInvites(conversationId: string, userIds: string[]): Promise<{ invites: ChatGroupInvite[] }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/groups/${encodeURIComponent(conversationId)}/invites`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ user_ids: userIds }),
  });
  return handleResponse(res);
}

export async function listGroupInvites(cursor?: string): Promise<{ invites: ChatGroupInvite[]; next_cursor: string | null }> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await fetch(`${API_BASE_URL}/api/chat/group-invites${qs}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function respondGroupInvite(inviteId: string, action: "accept" | "reject") {
  const res = await fetch(`${API_BASE_URL}/api/chat/group-invites/${encodeURIComponent(inviteId)}/${action}`, {
    method: "POST",
    headers: jsonHeaders(),
  });
  return handleResponse(res);
}

export async function sendGroupMessage(
  conversationId: string,
  payload: Record<string, unknown>
): Promise<{ message: ChatMessage }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<{ message: ChatMessage }>(res);
}

export async function listGroupMessageReadReceipts(messageId: string, cursor?: string) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await fetch(`${API_BASE_URL}/api/chat/messages/${encodeURIComponent(messageId)}/read-receipts${qs}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function groupAvatarUploadUrl(input: { content_type: string; size_bytes: number }) {
  const res = await fetch(`${API_BASE_URL}/api/chat/attachments/upload-url`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  return handleResponse<{ upload_url: string; storage_key: string; expires_in: number; max_size_bytes: number }>(res);
}