import { API_BASE_URL } from "@/lib/apiBaseUrl";
import type { ChatConversation, ChatMessage, ChatMessageRequest, ChatSettings, ChatUser } from "@/lib/types";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

function jsonHeaders() {
  return { "Content-Type": "application/json", ...getAuthHeaders() };
}

export async function checkChatUsername(username: string): Promise<{ username: string; available: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/users/username/check?username=${encodeURIComponent(username)}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function updateChatUsername(username: string): Promise<{ user: ChatUser }> {
  const res = await fetch(`${API_BASE_URL}/api/users/me/username`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify({ username }),
  });
  return handleResponse(res);
}

export async function searchChatUsers(username: string): Promise<{ users: ChatUser[] }> {
  const res = await fetch(`${API_BASE_URL}/api/users/search?username=${encodeURIComponent(username)}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function getChatSettings(): Promise<{ settings: ChatSettings }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/settings`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function updateChatSettings(settings: Partial<ChatSettings>): Promise<{ settings: ChatSettings }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/settings`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(settings),
  });
  return handleResponse(res);
}

export async function registerChatDevice(payload: Record<string, unknown>) {
  const res = await fetch(`${API_BASE_URL}/api/chat/devices/register`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function uploadChatOneTimePrekeys(deviceId: string, prekeys: Array<{ key_id: string; public_key: string }>) {
  const res = await fetch(`${API_BASE_URL}/api/chat/devices/${encodeURIComponent(deviceId)}/one-time-prekeys`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ prekeys }),
  });
  return handleResponse(res);
}

export async function fetchChatKeyBundle(userId: string) {
  const res = await fetch(`${API_BASE_URL}/api/chat/users/${encodeURIComponent(userId)}/key-bundle`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<{
    user_id: string;
    devices: Array<{
      device: {
        device_id: string;
        identity_public_key: string;
        signed_prekey_public: string;
        signed_prekey_signature: string;
        signed_prekey_id: string;
      };
      one_time_prekey: { key_id: string; public_key: string } | null;
    }>;
  }>(res);
}

export async function createDirectConversation(userId: string): Promise<{ conversation: ChatConversation }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/conversations/direct`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ user_id: userId }),
  });
  return handleResponse(res);
}

export async function listChatConversations(cursor?: string): Promise<{ conversations: ChatConversation[]; next_cursor: string | null }> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await fetch(`${API_BASE_URL}/api/chat/conversations${qs}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function getChatConversation(conversationId: string): Promise<{ conversation: ChatConversation }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/conversations/${encodeURIComponent(conversationId)}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function listChatMessages(
  conversationId: string,
  options: { cursor?: string; limit?: number } = {}
): Promise<{ messages: ChatMessage[]; next_cursor: string | null }> {
  const params = new URLSearchParams();
  if (options.cursor) params.set("cursor", options.cursor);
  if (options.limit) params.set("limit", String(options.limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE_URL}/api/chat/conversations/${encodeURIComponent(conversationId)}/messages${qs}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function sendEncryptedChatMessage(conversationId: string, payload: Record<string, unknown>): Promise<{ message: ChatMessage }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function markChatRead(conversationId: string, lastReadMessageId?: string) {
  const res = await fetch(`${API_BASE_URL}/api/chat/conversations/${encodeURIComponent(conversationId)}/read`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ last_read_message_id: lastReadMessageId || null }),
  });
  return handleResponse(res);
}

export async function createEncryptedMessageRequest(payload: { to_user_id: string; encrypted_intro_message: string }) {
  const res = await fetch(`${API_BASE_URL}/api/chat/message-requests`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function listMessageRequests(): Promise<{ requests: ChatMessageRequest[]; next_cursor: string | null }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/message-requests`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function respondMessageRequest(requestId: string, action: "accept" | "reject") {
  const res = await fetch(`${API_BASE_URL}/api/chat/message-requests/${encodeURIComponent(requestId)}/${action}`, {
    method: "POST",
    headers: jsonHeaders(),
  });
  return handleResponse(res);
}

export async function createEncryptedAttachmentUpload(input: { content_type: string; size_bytes: number }) {
  const res = await fetch(`${API_BASE_URL}/api/chat/attachments/upload-url`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  return handleResponse<{ upload_url: string; storage_key: string; expires_in: number; max_size_bytes: number }>(res);
}

export async function completeEncryptedAttachment(payload: Record<string, unknown>) {
  const res = await fetch(`${API_BASE_URL}/api/chat/attachments/complete`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}
