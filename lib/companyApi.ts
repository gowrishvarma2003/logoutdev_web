import { API_BASE_URL } from "./apiBaseUrl";

export interface CompanyProfile {
  id: string;
  legal_name: string;
  display_name: string;
  slug: string;
  website_url: string;
  primary_domain: string;
  description: string | null;
  hq_location: string | null;
  company_size: string | null;
  industry: string | null;
  linkedin_url: string | null;
  careers_url: string | null;
  hiring_contact_name: string | null;
  hiring_contact_email: string | null;
  hiring_contact_title: string | null;
  hiring_intent: string | null;
  status: "approved" | "draft" | "profile_incomplete" | "under_review" | "email_unverified" | "needs_reverification" | "rejected" | "suspended";
  public_review_note: string | null;
  rejection_reason: string | null;
  approved_at: string | null;
  reviewed_at: string | null;
  missing_profile_fields: string[];
}

export interface CompanyVerification {
  id: string;
  status: string;
  reviewer_decision: string | null;
  public_note: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
}

export interface CompanyJob {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  workplace_type: "remote" | "hybrid" | "onsite";
  employment_type: "full_time" | "part_time" | "contract" | "internship";
  seniority: "junior" | "mid" | "senior" | "lead" | "executive";
  skills: string[];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  hiring_manager_name: string | null;
  hiring_manager_email: string | null;
  status: "draft" | "pending_review" | "published" | "closed" | "archived";
  approval_requested_at: string | null;
  approved_at: string | null;
  closed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  role: "owner" | "admin" | "recruiter" | "member";
  status: "active" | "invited" | "disabled";
  joined_at: string | null;
  permissions: string[];
  account?: {
    id: string;
    name: string;
    email: string;
    title?: string | null;
    status: string;
  };
}

function getCompanyAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("companyToken") || localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleCompanyResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return data as T;
}

export const companyPortalApi = {
  async getProfile(): Promise<{ company: CompanyProfile }> {
    const res = await fetch(`${API_BASE_URL}/api/company/profile`, {
      headers: { ...getCompanyAuthHeaders() },
    });
    return handleCompanyResponse<{ company: CompanyProfile }>(res);
  },

  async updateProfile(input: Partial<CompanyProfile>): Promise<{ company: CompanyProfile }> {
    const res = await fetch(`${API_BASE_URL}/api/company/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getCompanyAuthHeaders(),
      },
      body: JSON.stringify(input),
    });
    return handleCompanyResponse<{ company: CompanyProfile }>(res);
  },

  async getVerificationStatus(): Promise<{ company: CompanyProfile; verification: CompanyVerification | null }> {
    const res = await fetch(`${API_BASE_URL}/api/company/verification/status`, {
      headers: { ...getCompanyAuthHeaders() },
    });
    return handleCompanyResponse<{ company: CompanyProfile; verification: CompanyVerification | null }>(res);
  },

  async getJobs(): Promise<{ jobs: CompanyJob[] }> {
    const res = await fetch(`${API_BASE_URL}/api/company/jobs`, {
      headers: { ...getCompanyAuthHeaders() },
    });
    return handleCompanyResponse<{ jobs: CompanyJob[] }>(res);
  },

  async getTeam(): Promise<{ members: CompanyMember[] }> {
    const res = await fetch(`${API_BASE_URL}/api/company/team`, {
      headers: { ...getCompanyAuthHeaders() },
    });
    return handleCompanyResponse<{ members: CompanyMember[] }>(res);
  },
};
