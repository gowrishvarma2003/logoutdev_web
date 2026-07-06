import { API_BASE_URL } from "@/lib/apiBaseUrl";
import type { CallConfig, CallRecord, SfuJoinDetails } from "@/lib/types";

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
  if (!res.ok) {
    const message = data.retry_after_seconds
      ? `${data.error || "Request failed"} Try again in ${data.retry_after_seconds}s.`
      : data.error || "Request failed";
    throw new Error(message);
  }
  return data as T;
}

export async function getCallConfig(): Promise<{ config: CallConfig }> {
  const res = await fetch(`${API_BASE_URL}/api/calls/config`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function getActiveCall(): Promise<{ call: CallRecord | null }> {
  const res = await fetch(`${API_BASE_URL}/api/calls/active`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function startDirectCall(input: {
  recipientUserId: string;
  callType: "audio" | "video";
  conversationId?: string;
  deviceId?: string | null;
}): Promise<{ call: CallRecord; sfu?: SfuJoinDetails | null }> {
  const res = await fetch(`${API_BASE_URL}/api/calls/direct`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  return handleResponse(res);
}

export async function startGroupCall(input: {
  conversationId: string;
  callType: "audio" | "video";
  deviceId?: string | null;
}): Promise<{ call: CallRecord; sfu: SfuJoinDetails }> {
  const res = await fetch(`${API_BASE_URL}/api/calls/group`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  return handleResponse(res);
}

export async function acceptCall(callId: string, deviceId?: string | null): Promise<{ call: CallRecord; sfu?: SfuJoinDetails | null }> {
  const res = await fetch(`${API_BASE_URL}/api/calls/${encodeURIComponent(callId)}/accept`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ deviceId }),
  });
  return handleResponse(res);
}

export async function rejectCall(callId: string): Promise<{ call: CallRecord }> {
  const res = await fetch(`${API_BASE_URL}/api/calls/${encodeURIComponent(callId)}/reject`, {
    method: "POST",
    headers: jsonHeaders(),
  });
  return handleResponse(res);
}

export async function joinCall(callId: string, deviceId?: string | null): Promise<{ call: CallRecord; sfu: SfuJoinDetails | null }> {
  const res = await fetch(`${API_BASE_URL}/api/calls/${encodeURIComponent(callId)}/join`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ deviceId }),
  });
  return handleResponse(res);
}

export async function leaveCall(callId: string, reason?: "left" | "cancelled"): Promise<{ call: CallRecord }> {
  const res = await fetch(`${API_BASE_URL}/api/calls/${encodeURIComponent(callId)}/leave`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ reason: reason || "left" }),
  });
  return handleResponse(res);
}

export async function endCall(callId: string): Promise<{ call: CallRecord }> {
  const res = await fetch(`${API_BASE_URL}/api/calls/${encodeURIComponent(callId)}/end`, {
    method: "POST",
    headers: jsonHeaders(),
  });
  return handleResponse(res);
}

export async function listCallHistory(cursor?: string): Promise<{ calls: CallRecord[]; next_cursor: string | null }> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await fetch(`${API_BASE_URL}/api/calls/history${qs}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function listConversationCalls(conversationId: string): Promise<{ calls: CallRecord[]; next_cursor: string | null }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/conversations/${encodeURIComponent(conversationId)}/calls`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function sendCallQualityReport(callId: string, payload: Record<string, unknown>) {
  const res = await fetch(`${API_BASE_URL}/api/calls/${encodeURIComponent(callId)}/quality-report`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}
