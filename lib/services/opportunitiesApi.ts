import { API_BASE_URL } from "../apiBaseUrl";
import { clearClientSessionAndRedirect } from "../auth/logoutCleanup";

export type OpportunityStatus = "not_looking" | "casually_open" | "actively_looking" | "available_soon";
export type OpportunityVisibility = "private" | "verified_companies" | "public";
export type EmploymentType = "internship" | "full_time" | "part_time" | "contract" | "freelance" | "cofounder" | "open_source_maintainer";
export type SeniorityTarget = "intern" | "junior" | "mid" | "senior" | "lead" | "staff" | "flexible";
export type RemotePreference = "remote" | "hybrid" | "onsite" | "flexible";

export interface CandidatePreference {
  status: OpportunityStatus;
  visibility: OpportunityVisibility;
  headline: string | null;
  summary: string | null;
  desired_roles: string[];
  employment_types: EmploymentType[];
  seniority_targets: SeniorityTarget[];
  domains: string[];
  preferred_skills: string[];
  remote_preference: RemotePreference;
  locations: string[];
  time_zones: string[];
  relocation_open: boolean;
  earliest_start_date: string | null;
  notice_period_days: number | null;
  weekly_availability_hours: number | null;
  current_company_name: string | null;
  current_company_domain: string | null;
  hide_from_current_company: boolean;
  opportunity_requests_paused_at: string | null;
  resume_sharing_preference: "never" | "ask_each_time" | "share_after_acceptance";
  status_confirmed_at: string | null;
  status_expires_at: string | null;
  profile_version: number;
  company_visible: boolean;
}

export interface CandidateExperience {
  id: string;
  organization_name: string;
  organization_domain: string | null;
  title: string;
  employment_type: EmploymentType;
  location: string | null;
  remote_type: RemotePreference;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  skills: string[];
  evidence_links: unknown[];
  external_url: string | null;
  visibility: OpportunityVisibility;
  display_order: number;
}

export interface CandidateExternalProfile {
  id: string;
  type: string;
  label: string | null;
  url: string;
  normalized_url: string;
  visibility: OpportunityVisibility;
  verification_status: string;
  display_order: number;
}

export interface CandidateResume {
  id: string;
  content_type: string;
  file_size: number;
  sha256: string;
  visibility: "private";
  scan_status: string;
  state: string;
  uploaded_at: string;
  deleted_at: string | null;
}

export interface CandidateCompanyBlock {
  id: string;
  company_name: string | null;
  company_domain: string | null;
  reason: string | null;
  created_at: string;
}

export interface OpportunityProfile {
  preference: CandidatePreference;
  experiences: CandidateExperience[];
  external_profiles: CandidateExternalProfile[];
  resume: CandidateResume | null;
  company_blocks: CandidateCompanyBlock[];
  limits: { experiences: number; externalProfiles: number; companyBlocks: number };
}

export interface OpportunityPreview {
  company_visible: boolean;
  public_profile: {
    id: string;
    username: string | null;
    name: string;
    headline: string | null;
    bio: string | null;
    location: string | null;
    website_url: string | null;
    github_url: string | null;
    linkedin_url: string | null;
    avatar_url: string | null;
    open_to_work: boolean;
  } | null;
  opportunity: Partial<CandidatePreference> | null;
  experiences: CandidateExperience[];
  external_profiles: CandidateExternalProfile[];
  resume: { available: boolean; visibility?: string; uploaded_at?: string };
  hidden: { current_company: boolean; company_blocks: number; resume_url: boolean };
}

export type ReceivedOpportunityStatus = "sent" | "viewed" | "accepted" | "declined" | "expired" | "withdrawn" | "blocked" | "reported" | "restricted";

export interface ReceivedOpportunityRequest {
  id: string;
  status: ReceivedOpportunityStatus;
  subject: string;
  message_body: string;
  personalization_evidence: string;
  compensation_summary: string;
  workplace_summary: string;
  match_snapshot: { score?: number; label_text?: string; reasons?: string[] };
  expires_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  withdrawn_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpportunityCompany {
  id: string;
  display_name: string;
  slug: string;
  website_url: string;
  description: string | null;
  hq_location: string | null;
  company_size: string | null;
  industry: string | null;
  verified: boolean;
  approved_at: string | null;
}

export interface OpportunityJob {
  id: string;
  title: string;
  description: string;
  location: string | null;
  workplace_type: string;
  employment_type: string;
  seniority: string | null;
  skills: string[];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
}

export interface OpportunityConversation {
  id: string;
  request_id: string;
  status: string;
  created_at: string;
  closed_at: string | null;
  updated_at: string;
  messages?: Array<{ id: string; sender_type: string; body: string; created_at: string }>;
}

export interface OpportunityRequestDetail {
  request: ReceivedOpportunityRequest;
  company: OpportunityCompany | null;
  job: OpportunityJob | null;
  recruiter: { name: string; title: string | null } | null;
  resume_access: { status: string; expires_at: string | null } | null;
  conversation?: OpportunityConversation;
}

export type AcceptedOpportunityStatus = "accepted" | "in_conversation" | "technical_review" | "team_review" | "company_interested" | "closed";

export interface AcceptedOpportunity {
  id: string;
  external_status: AcceptedOpportunityStatus;
  process_state: "active" | "closed" | "withdrawn" | "reported" | "restricted";
  waiting_on: "company" | "candidate" | "none";
  next_action: string | null;
  last_activity_at: string;
  created_at: string;
  closed_at: string | null;
  closure_outcome: "hired" | "not_selected" | "withdrawn_by_candidate" | "role_closed" | "reported" | "company_blocked" | null;
  company: OpportunityCompany | null;
  job: OpportunityJob | null;
  conversation: { id: string; status: string } | null;
  timeline?: Array<{ id: string; status: AcceptedOpportunityStatus; created_at: string }>;
}

export type HiringInterviewStatus =
  | "draft"
  | "requested"
  | "candidate_selected_time"
  | "confirmed"
  | "reschedule_requested"
  | "cancelled_by_company"
  | "cancelled_by_candidate"
  | "completed"
  | "no_show_company"
  | "no_show_candidate"
  | "expired";

export interface HiringInterviewSlot {
  id: string;
  start_at: string;
  end_at: string;
  timezone: string;
  status: "proposed" | "selected" | "expired" | "cancelled";
  selected_at: string | null;
}

export interface HiringInterviewParticipant {
  id: string;
  participant_type: "company_member" | "candidate" | "external";
  member_id: string | null;
  display_name: string;
  role: string;
  visibility: "candidate_visible";
}

export type InterviewCompany = Pick<OpportunityCompany, "id" | "display_name" | "slug" | "website_url" | "verified">;
export type InterviewJob = Pick<OpportunityJob, "id" | "title" | "location" | "workplace_type" | "employment_type">;

export interface InterviewPipelineItem {
  id: string;
  status: string;
  external_status: AcceptedOpportunityStatus;
  waiting_on: "company" | "candidate" | "none";
  next_action: string | null;
}

export interface HiringInterview {
  id: string;
  pipeline_item_id: string;
  title: string;
  interview_type: string;
  duration_minutes: number;
  scheduling_mode: "exact_times" | "availability_windows";
  buffer_minutes: number;
  status: HiringInterviewStatus;
  timezone: string;
  preparation_notes: string | null;
  meeting_url: string | null;
  location: string | null;
  confirmed_slot_id: string | null;
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
  expires_at: string;
  alternative_requested_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  reported_at: string | null;
  reschedule_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  company: InterviewCompany | null;
  job: InterviewJob | null;
  pipeline_item: InterviewPipelineItem | null;
  slots: HiringInterviewSlot[];
  participants: HiringInterviewParticipant[];
}

export interface HiringInterviewEvent {
  id: string;
  actor_type: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type HiringOfferStatus = "sent" | "viewed" | "accepted" | "declined" | "withdrawn" | "expired" | "reported";

export interface HiringOfferDocument {
  id: string;
  display_filename: string;
  content_type: "application/pdf";
  file_size: number;
  sha256: string;
  scan_status: string;
  created_at: string;
}

export interface HiringOutcomeConfirmation {
  id: string;
  company_reported_hired_at: string | null;
  developer_confirmed_hired_at: string | null;
  developer_disputed_at: string | null;
  public_proof_allowed: boolean | null;
  profile_status_updated: boolean;
  created_at: string;
  updated_at: string;
}

export interface HiringOffer {
  id: string;
  company_id: string;
  job_id: string;
  pipeline_item_id: string;
  candidate_user_id: string;
  status: HiringOfferStatus;
  version: number;
  title: string;
  employment_type: string;
  workplace_type: string;
  location: string;
  contact_name: string;
  contact_title: string | null;
  contact_email: string;
  start_date: string | null;
  start_date_note: string | null;
  compensation_min: string;
  compensation_max: string | null;
  compensation_currency: string;
  compensation_period: string;
  schedule_expectation: string;
  reporting_manager: string;
  benefits_summary: string;
  conditions: string | null;
  equity_summary: string | null;
  signing_bonus: string | null;
  relocation_support: string | null;
  equipment_note: string | null;
  work_authorization_note: string | null;
  expires_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  withdrawn_at: string | null;
  reported_at: string | null;
  accepted_set_not_looking: boolean;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  company: Pick<OpportunityCompany, "id" | "display_name" | "slug" | "website_url" | "verified"> | null;
  job: Pick<OpportunityJob, "id" | "title" | "location" | "workplace_type" | "employment_type"> & { status: string } | null;
  pipeline_item: {
    id: string;
    status: "active" | "closed" | "withdrawn" | "reported" | "restricted";
    external_status: AcceptedOpportunityStatus;
    waiting_on: "company" | "candidate" | "none";
    next_action: string | null;
  } | null;
  documents: HiringOfferDocument[];
  outcome_confirmation: HiringOutcomeConfirmation | null;
}

export interface HiringOfferEvent {
  id: string;
  actor_type: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface HiringOfferDetail {
  offer: HiringOffer;
  events: HiringOfferEvent[];
  idempotent_replay?: boolean;
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    if (typeof window !== "undefined") clearClientSessionAndRedirect("/login");
    throw new Error("Unauthorized");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

async function jsonRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...(init.headers || {}) },
  });
  return handleResponse<T>(res);
}

export const opportunitiesApi = {
  getProfile: () => jsonRequest<OpportunityProfile>("/api/profiles/me/opportunity"),
  savePreference: (preference: Partial<CandidatePreference>) =>
    jsonRequest<{ preference: CandidatePreference }>("/api/profiles/me/opportunity", { method: "PUT", body: JSON.stringify(preference) }),
  listExperiences: () => jsonRequest<{ experiences: CandidateExperience[] }>("/api/profiles/me/experience"),
  createExperience: (payload: Partial<CandidateExperience>) =>
    jsonRequest<{ experience: CandidateExperience }>("/api/profiles/me/experience", { method: "POST", body: JSON.stringify(payload) }),
  updateExperience: (id: string, payload: Partial<CandidateExperience>) =>
    jsonRequest<{ experience: CandidateExperience }>(`/api/profiles/me/experience/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteExperience: (id: string) =>
    jsonRequest<void>(`/api/profiles/me/experience/${encodeURIComponent(id)}`, { method: "DELETE" }),
  createExternalProfile: (payload: Partial<CandidateExternalProfile>) =>
    jsonRequest<{ external_profile: CandidateExternalProfile }>("/api/profiles/me/external-profiles", { method: "POST", body: JSON.stringify(payload) }),
  updateExternalProfile: (id: string, payload: Partial<CandidateExternalProfile>) =>
    jsonRequest<{ external_profile: CandidateExternalProfile }>(`/api/profiles/me/external-profiles/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteExternalProfile: (id: string) =>
    jsonRequest<void>(`/api/profiles/me/external-profiles/${encodeURIComponent(id)}`, { method: "DELETE" }),
  uploadResume: async (file: File) => {
    const form = new FormData();
    form.append("resume", file);
    const res = await fetch(`${API_BASE_URL}/api/profiles/me/resume`, { method: "PUT", headers: { ...getAuthHeaders() }, body: form });
    return handleResponse<{ resume: CandidateResume }>(res);
  },
  getResumeDownloadUrl: () =>
    jsonRequest<{ url: string; expires_in_seconds: number }>("/api/profiles/me/resume/download-url", { method: "POST" }),
  deleteResume: () => jsonRequest<void>("/api/profiles/me/resume", { method: "DELETE" }),
  createCompanyBlock: (payload: Partial<CandidateCompanyBlock>) =>
    jsonRequest<{ company_block: CandidateCompanyBlock }>("/api/profiles/me/company-blocks", { method: "POST", body: JSON.stringify(payload) }),
  deleteCompanyBlock: (id: string) =>
    jsonRequest<void>(`/api/profiles/me/company-blocks/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getPreview: () => jsonRequest<{ preview: OpportunityPreview }>("/api/profiles/me/opportunity-preview"),
  listReceivedOpportunities: (status?: string) => jsonRequest<{ opportunity_requests: OpportunityRequestDetail[] }>(`/api/users/me/opportunities${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  getReceivedOpportunity: (id: string) => jsonRequest<OpportunityRequestDetail>(`/api/users/me/opportunities/${encodeURIComponent(id)}`),
  viewReceivedOpportunity: (id: string) => jsonRequest<OpportunityRequestDetail>(`/api/users/me/opportunities/${encodeURIComponent(id)}/view`, { method: "POST" }),
  acceptReceivedOpportunity: (id: string) => jsonRequest<OpportunityRequestDetail>(`/api/users/me/opportunities/${encodeURIComponent(id)}/accept`, { method: "POST" }),
  declineReceivedOpportunity: (id: string) => jsonRequest<OpportunityRequestDetail>(`/api/users/me/opportunities/${encodeURIComponent(id)}/decline`, { method: "POST" }),
  blockOpportunityCompany: (id: string) => jsonRequest<OpportunityRequestDetail>(`/api/users/me/opportunities/${encodeURIComponent(id)}/block-company`, { method: "POST" }),
  reportReceivedOpportunity: (id: string, input: { category: string; note?: string }) => jsonRequest<OpportunityRequestDetail>(`/api/users/me/opportunities/${encodeURIComponent(id)}/report`, { method: "POST", body: JSON.stringify(input) }),
  pauseOpportunityRequests: (paused: boolean) => jsonRequest<{ paused: boolean; paused_at: string | null }>("/api/users/me/opportunities/pause", { method: "POST", body: JSON.stringify({ paused }) }),
  decideOpportunityResumeAccess: (id: string, decision: "grant" | "revoke" | "deny") => jsonRequest<{ resume_access: { status: string; expires_at: string | null } }>(`/api/users/me/opportunities/${encodeURIComponent(id)}/resume-access`, { method: "POST", body: JSON.stringify({ decision }) }),
  listOpportunityConversations: () => jsonRequest<{ opportunity_conversations: Array<OpportunityConversation & { request: ReceivedOpportunityRequest; company: OpportunityCompany | null; job: OpportunityJob | null }> }>("/api/users/me/opportunity-conversations"),
  getOpportunityConversation: (id: string) => jsonRequest<{ conversation: OpportunityConversation; request: ReceivedOpportunityRequest; company: OpportunityCompany | null; job: OpportunityJob | null }>(`/api/users/me/opportunity-conversations/${encodeURIComponent(id)}`),
  postOpportunityConversationMessage: (id: string, body: string) => jsonRequest<{ message: { id: string; sender_type: string; body: string; created_at: string } }>(`/api/users/me/opportunity-conversations/${encodeURIComponent(id)}/messages`, { method: "POST", body: JSON.stringify({ body }) }),
  listAcceptedOpportunities: (cursor?: string) => jsonRequest<{ accepted_opportunities: AcceptedOpportunity[]; page: { limit: number; next_cursor: string | null } }>(`/api/users/me/opportunities/accepted${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`),
  getAcceptedOpportunity: (id: string) => jsonRequest<{ accepted_opportunity: AcceptedOpportunity }>(`/api/users/me/opportunities/accepted/${encodeURIComponent(id)}`),
  withdrawAcceptedOpportunity: (id: string, note?: string) => jsonRequest<{ accepted_opportunity: AcceptedOpportunity }>(`/api/users/me/opportunities/accepted/${encodeURIComponent(id)}/withdraw`, { method: "POST", body: JSON.stringify(note ? { note } : {}) }),
  reportAcceptedOpportunity: (id: string, input: { category: string; note?: string }) => jsonRequest<{ accepted_opportunity: AcceptedOpportunity }>(`/api/users/me/opportunities/accepted/${encodeURIComponent(id)}/report`, { method: "POST", body: JSON.stringify(input) }),
  listInterviews: (status?: string) => jsonRequest<{ interviews: HiringInterview[] }>(`/api/users/me/opportunities/interviews${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  getInterview: (id: string) => jsonRequest<{ interview: HiringInterview; events: HiringInterviewEvent[] }>(`/api/users/me/opportunities/interviews/${encodeURIComponent(id)}`),
  selectInterviewSlot: (id: string, slotId: string) => jsonRequest<{ interview: HiringInterview; events: HiringInterviewEvent[] }>(`/api/users/me/opportunities/interviews/${encodeURIComponent(id)}/select-slot`, { method: "POST", body: JSON.stringify({ slot_id: slotId }) }),
  requestInterviewAlternatives: (id: string, note: string) => jsonRequest<{ interview: HiringInterview; events: HiringInterviewEvent[] }>(`/api/users/me/opportunities/interviews/${encodeURIComponent(id)}/request-alternatives`, { method: "POST", body: JSON.stringify({ note }) }),
  cancelInterview: (id: string, reason: string) => jsonRequest<{ interview: HiringInterview; events: HiringInterviewEvent[] }>(`/api/users/me/opportunities/interviews/${encodeURIComponent(id)}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }),
  markInterviewCompanyNoShow: (id: string, reason: string) => jsonRequest<{ interview: HiringInterview; events: HiringInterviewEvent[] }>(`/api/users/me/opportunities/interviews/${encodeURIComponent(id)}/company-no-show`, { method: "POST", body: JSON.stringify({ reason }) }),
  reportInterview: (id: string, input: { category: string; note?: string }) => jsonRequest<{ interview: HiringInterview; events: HiringInterviewEvent[] }>(`/api/users/me/opportunities/interviews/${encodeURIComponent(id)}/report`, { method: "POST", body: JSON.stringify(input) }),
  listOffers: (status?: string, cursor?: string) => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (cursor) query.set("cursor", cursor);
    const suffix = query.size ? `?${query.toString()}` : "";
    return jsonRequest<{ offers: HiringOffer[]; page: { limit: number; has_more: boolean; next_cursor: string | null } }>(`/api/users/me/offers${suffix}`);
  },
  getOffer: (id: string) => jsonRequest<HiringOfferDetail>(`/api/users/me/offers/${encodeURIComponent(id)}`),
  viewOffer: (id: string) => jsonRequest<HiringOfferDetail>(`/api/users/me/offers/${encodeURIComponent(id)}/view`, { method: "POST", body: "{}" }),
  acceptOffer: (id: string, setNotLooking: boolean) => jsonRequest<HiringOfferDetail>(`/api/users/me/offers/${encodeURIComponent(id)}/accept`, { method: "POST", body: JSON.stringify({ set_not_looking: setNotLooking }) }),
  declineOffer: (id: string, input: { reason: string; note?: string; share_reason: boolean }) => jsonRequest<HiringOfferDetail>(`/api/users/me/offers/${encodeURIComponent(id)}/decline`, { method: "POST", body: JSON.stringify(input) }),
  reportOffer: (id: string, input: { category: string; note?: string }) => jsonRequest<HiringOfferDetail>(`/api/users/me/offers/${encodeURIComponent(id)}/report`, { method: "POST", body: JSON.stringify(input) }),
  confirmOfferOutcome: (id: string, publicProofAllowed: boolean) => jsonRequest<HiringOfferDetail>(`/api/users/me/offers/${encodeURIComponent(id)}/confirm-outcome`, { method: "POST", body: JSON.stringify({ public_proof_allowed: publicProofAllowed }) }),
  getOfferDocumentUrl: (offerId: string, documentId: string) => jsonRequest<{ url: string; expires_in_seconds: number }>(`/api/users/me/offers/${encodeURIComponent(offerId)}/documents/${encodeURIComponent(documentId)}/download-url`),
};
