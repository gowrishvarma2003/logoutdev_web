import { API_BASE_URL } from "../apiBaseUrl";
import type { GitAccessToken } from "../types";

const API = API_BASE_URL;

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

export async function listAccessTokens(): Promise<{ tokens: GitAccessToken[] }> {
  const res = await fetch(`${API}/api/users/me/access-tokens`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function createAccessToken(body: {
  name: string;
  expires_at?: string;
}): Promise<{ token: GitAccessToken; plaintext_token: string }> {
  const res = await fetch(`${API}/api/users/me/access-tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function revokeAccessToken(tokenId: string): Promise<{ revoked: boolean }> {
  const res = await fetch(`${API}/api/users/me/access-tokens/${tokenId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}
