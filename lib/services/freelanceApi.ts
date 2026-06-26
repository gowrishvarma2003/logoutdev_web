import { API_BASE_URL } from "../apiBaseUrl";
import { clearClientSessionAndRedirect } from "../auth/logoutCleanup";
import type {
  FreelanceProject,
  FreelanceProjectListResponse,
  FreelanceProposal,
} from "../types";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      clearClientSessionAndRedirect("/login");
    }
    throw new Error("Unauthorized");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== "");
  if (!entries.length) return "";
  return `?${entries.map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join("&")}`;
}

export async function listFreelanceProjects(filters?: {
  q?: string;
  skill?: string;
  pricing_model?: string;
  experience_level?: string;
  engagement_type?: string;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<FreelanceProjectListResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/freelance/projects${qs({
      q: filters?.q,
      skill: filters?.skill,
      pricing_model: filters?.pricing_model,
      experience_level: filters?.experience_level,
      engagement_type: filters?.engagement_type,
      status: filters?.status,
      sort: filters?.sort,
      page: filters?.page,
      limit: filters?.limit,
    })}`,
    { headers: { ...getAuthHeaders() } }
  );
  return handleResponse(res);
}

export async function createFreelanceProject(body: {
  title: string;
  summary: string;
  description: string;
  pricing_model: "fixed" | "hourly";
  currency_code?: string;
  budget_min_cents: number;
  budget_max_cents: number;
  experience_level: string;
  engagement_type: string;
  duration_weeks?: number | null;
  location_mode: string;
  timezone_note?: string;
  skills: string[];
}): Promise<{ project: FreelanceProject }> {
  const res = await fetch(`${API_BASE_URL}/api/freelance/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function getFreelanceProject(projectId: string): Promise<{ project: FreelanceProject }> {
  const res = await fetch(`${API_BASE_URL}/api/freelance/projects/${projectId}`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(res);
}

export async function updateFreelanceProject(
  projectId: string,
  body: Partial<{
    title: string;
    summary: string;
    description: string;
    pricing_model: "fixed" | "hourly";
    currency_code: string;
    budget_min_cents: number;
    budget_max_cents: number;
    experience_level: string;
    engagement_type: string;
    duration_weeks: number | null;
    location_mode: string;
    timezone_note: string;
    skills: string[];
  }>
): Promise<{ project: FreelanceProject }> {
  const res = await fetch(`${API_BASE_URL}/api/freelance/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function updateFreelanceProjectStatus(
  projectId: string,
  status: string
): Promise<{ project: FreelanceProject }> {
  const res = await fetch(`${API_BASE_URL}/api/freelance/projects/${projectId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

export async function listProjectProposals(
  projectId: string,
  page = 1,
  limit = 20
): Promise<{ proposals: FreelanceProposal[]; total: number; page: number; limit: number }> {
  const res = await fetch(
    `${API_BASE_URL}/api/freelance/projects/${projectId}/proposals${qs({ page, limit })}`,
    { headers: { ...getAuthHeaders() } }
  );
  return handleResponse(res);
}

export async function createProposal(
  projectId: string,
  body: {
    cover_note: string;
    pricing_model: "fixed" | "hourly";
    currency_code?: string;
    bid_amount_cents: number;
    estimated_duration_weeks?: number | null;
    availability_hours?: number | null;
    proof_links?: string[];
  }
): Promise<{ proposal: FreelanceProposal }> {
  const res = await fetch(`${API_BASE_URL}/api/freelance/projects/${projectId}/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function updateProposal(
  projectId: string,
  proposalId: string,
  body: Partial<{
    cover_note: string;
    pricing_model: "fixed" | "hourly";
    currency_code: string;
    bid_amount_cents: number;
    estimated_duration_weeks: number | null;
    availability_hours: number | null;
    proof_links: string[];
  }>
): Promise<{ proposal: FreelanceProposal }> {
  const res = await fetch(`${API_BASE_URL}/api/freelance/projects/${projectId}/proposals/${proposalId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function withdrawProposal(
  projectId: string,
  proposalId: string
): Promise<{ withdrawn: boolean; proposal: FreelanceProposal }> {
  const res = await fetch(`${API_BASE_URL}/api/freelance/projects/${projectId}/proposals/${proposalId}/withdraw`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(res);
}

export async function reviewProposal(
  projectId: string,
  proposalId: string,
  action: "shortlist" | "reject" | "accept"
): Promise<{ proposal: FreelanceProposal; project: FreelanceProject }> {
  const res = await fetch(`${API_BASE_URL}/api/freelance/projects/${projectId}/proposals/${proposalId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ action }),
  });
  return handleResponse(res);
}

export async function getMyFreelanceProjects(): Promise<FreelanceProjectListResponse> {
  const res = await fetch(`${API_BASE_URL}/api/freelance/me/projects`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(res);
}

export async function getMyFreelanceProposals(): Promise<{
  proposals: FreelanceProposal[];
  total: number;
  page: number;
  limit: number;
}> {
  const res = await fetch(`${API_BASE_URL}/api/freelance/me/proposals`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse(res);
}
