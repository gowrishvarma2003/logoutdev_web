import { API_BASE_URL } from "../apiBaseUrl";

export type ActionStatus = "queued" | "running" | "success" | "failed" | "cancelled" | "timeout" | "skipped";
export interface Workflow { id: string; repository_id: string; name: string; file_path: string; is_active: boolean; }
export interface WorkflowStep { id: string; name: string; step_index: number; status: ActionStatus; exit_code: number | null; }
export interface WorkflowJob { id: string; job_key: string; name: string; image: string; status: ActionStatus; attempt: number; error_message?: string | null; steps?: WorkflowStep[]; }
export interface WorkflowRun { id: string; workflow_id: string; commit_sha: string; branch: string; trigger_event: string; status: ActionStatus; queued_at: string; started_at: string | null; completed_at: string | null; workflow?: Workflow; jobs?: WorkflowJob[]; }
export interface WorkflowLog { id: string; step_id: string | null; log_type: "stdout" | "stderr" | "system"; content: string; sequence: number; created_at: string; }
export interface RunWorkflowLog extends WorkflowLog { job_id: string; job?: Pick<WorkflowJob, "id" | "name" | "job_key">; }
export interface RepositorySecret { id: string; name: string; created_at: string; updated_at: string; }
export interface ActionRunner { id: string; name: string; status: "online" | "offline" | "disabled"; labels: string[]; max_concurrent_jobs: number; current_running_jobs: number; last_heartbeat_at: string | null; version: string | null; }

function headers(json = false): Record<string, string> {
  const token = typeof window === "undefined" ? null : localStorage.getItem("authToken");
  return { ...(json ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (response.status === 401 && typeof window !== "undefined") window.location.href = "/login";
  const data = response.status === 204 ? {} : await response.json();
  if (!response.ok) throw new Error(data.error || "Actions request failed");
  return data as T;
}

export const listWorkflows = (repoId: string) => request<{ workflows: Workflow[] }>(`/api/actions/repos/${repoId}/workflows`, { headers: headers() });
export const createWorkflow = (repoId: string, input: { filename: string; content: string; branch?: string; message?: string }) => request<{ workflow: Workflow; commit: { oid: string; path: string } }>(`/api/actions/repos/${repoId}/workflows`, { method: "POST", headers: headers(true), body: JSON.stringify(input) });
export const refreshWorkflows = (repoId: string) => request<{ workflows: Workflow[] }>(`/api/actions/repos/${repoId}/workflows/refresh`, { method: "POST", headers: headers(true) });
export const dispatchWorkflow = (workflowId: string, branch?: string) => request<{ run: WorkflowRun }>(`/api/actions/workflows/${workflowId}/dispatch`, { method: "POST", headers: headers(true), body: JSON.stringify({ branch }) });
export const listRuns = (repoId: string) => request<{ runs: WorkflowRun[] }>(`/api/actions/repos/${repoId}/runs`, { headers: headers() });
export const getRun = (runId: string) => request<{ run: WorkflowRun }>(`/api/actions/runs/${runId}`, { headers: headers() });
export const getRunLogs = (runId: string, after = 0, limit = 2000) => request<{ logs: RunWorkflowLog[]; has_more: boolean }>(`/api/actions/runs/${runId}/logs?after=${after}&limit=${limit}`, { headers: headers() });
export const cancelRun = (runId: string) => request<{ run: WorkflowRun }>(`/api/actions/runs/${runId}/cancel`, { method: "POST", headers: headers(true) });
export const rerunRun = (runId: string) => request<{ run: WorkflowRun }>(`/api/actions/runs/${runId}/rerun`, { method: "POST", headers: headers(true) });
export const getJob = (jobId: string) => request<{ job: WorkflowJob }>(`/api/actions/jobs/${jobId}`, { headers: headers() });
export const getLogs = (jobId: string, after = 0) => request<{ logs: WorkflowLog[] }>(`/api/actions/jobs/${jobId}/logs?after=${after}`, { headers: headers() });
export const listSecrets = (repoId: string) => request<{ secrets: RepositorySecret[] }>(`/api/actions/repos/${repoId}/secrets`, { headers: headers() });
export const saveSecret = (repoId: string, name: string, value: string) => request<{ secret: RepositorySecret }>(`/api/actions/repos/${repoId}/secrets`, { method: "POST", headers: headers(true), body: JSON.stringify({ name, value }) });
export const deleteSecret = (repoId: string, secretId: string) => request<void>(`/api/actions/repos/${repoId}/secrets/${secretId}`, { method: "DELETE", headers: headers() });
export const listRunners = () => request<{ runners: ActionRunner[] }>("/api/actions/runners", { headers: headers() });
