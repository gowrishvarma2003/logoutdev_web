import type { DiscoveryResult } from "../types";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleRes<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

function qs(params: Record<string, string | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== "" && value !== false);
  if (!entries.length) return "";
  return `?${entries.map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join("&")}`;
}

export interface DiscoveryFilters {
  q?: string;
  type?: string;
  stack?: string;
  tag?: string;
  status?: string;
  collab?: boolean;
  sort?: string;
}

export async function getDiscovery(filters: DiscoveryFilters = {}): Promise<DiscoveryResult> {
  const res = await fetch(
    `${API}/api/discovery${qs({
      q: filters.q,
      type: filters.type,
      stack: filters.stack,
      tag: filters.tag,
      status: filters.status,
      collab: filters.collab,
      sort: filters.sort,
    })}`,
    { headers: { ...authHeaders() } }
  );

  return handleRes<DiscoveryResult>(res);
}