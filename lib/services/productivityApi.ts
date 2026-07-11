import { API_BASE_URL } from "../apiBaseUrl";

function headers(): HeadersInit {
  const token = typeof window === "undefined" ? null : localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/productivity${path}`, {
    ...init,
    headers: { ...headers(), ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Productivity request failed.");
  return payload as T;
}

export type TaskStatus = "inbox" | "planned" | "in_progress" | "blocked" | "completed" | "cancelled";
export type TaskPriority = "none" | "low" | "medium" | "high" | "urgent";
export type ProductivityKind = "task" | "reminder" | "goal" | "event";
export type ProductivityList = { id: string; name: string; description: string | null; color: string | null; default_view: string; is_archived: boolean };
export type ProductivityTask = { id: string; list_id: string | null; parent_task_id?: string | null; title: string; description?: { text?: string } | null; status: TaskStatus; priority: TaskPriority; due_at: string | null; start_at: string | null; estimated_minutes?: number | null; actual_minutes?: number; recurrence_rule?: string | null; is_pinned: boolean; is_archived: boolean; updated_at: string };
export type ProductivityEvent = { id: string; task_id?: string | null; title: string; description?: { text?: string } | null; starts_at: string; ends_at: string; all_day: boolean; time_zone?: string; recurrence_rule?: string | null; location?: string | null; meeting_url?: string | null; color?: string | null; status: string; is_archived: boolean };
export type ProductivityReminder = { id: string; task_id?: string | null; event_id?: string | null; title: string; description?: string | null; remind_at: string; time_zone?: string; recurrence_rule?: string | null; status: string; channels?: string[] };
export type ProductivityGoal = { id: string; title: string; description?: { text?: string } | null; start_at?: string | null; status: string; progress_type?: string; progress_percent: number; numeric_target?: number | null; numeric_current?: number | null; target_at: string | null; priority?: TaskPriority; is_archived: boolean };
export type ProductivitySettings = { time_zone: string; start_of_week: number; default_home_view: string; default_task_view: string; analytics_enabled: boolean; browser_notifications_enabled: boolean; email_reminders_enabled: boolean; focus_minutes: number };
export type MyDayItem = { id: string; task_id: string; day: string; task: ProductivityTask };
export type ProductivityTemplate = { id: string; name: string; kind: "task" | "list" | "goal" | "daily_plan" | "note"; description: string | null; content: Record<string, unknown>; is_archived: boolean };
export type FocusSession = { id: string; task_id: string | null; planned_minutes: number; actual_minutes: number; status: string; started_at: string; ended_at: string | null };
export type ProductivityAnalytics = { completed_tasks: number; tasks_by_status: Array<{ status: string; count: string | number }>; focus_minutes: number };
export type ProductivityComposePayload = {
  kind: ProductivityKind;
  item: Record<string, unknown> & { title: string };
  checklist?: Array<string | { title: string; is_completed?: boolean; sort_order?: number }>;
  milestones?: Array<string | { title: string; due_at?: string | null; is_completed?: boolean; sort_order?: number }>;
  tags?: Array<string | { name: string }>;
  reminders?: Array<Record<string, unknown> & { title: string; remind_at: string }>;
  relations?: Array<{ target_type: "note" | "space_work"; target_id: string; relation_type?: string }>;
  my_day?: { day: string };
};
export type ProductivityComposeResponse = {
  kind: ProductivityKind;
  item: ProductivityTask | ProductivityReminder | ProductivityGoal | ProductivityEvent;
  checklist?: unknown[];
  milestones?: unknown[];
  tags?: unknown[];
  reminders?: ProductivityReminder[];
  relations?: unknown[];
  my_day?: MyDayItem;
};

type TaskInput = Partial<Pick<ProductivityTask, "list_id" | "title" | "status" | "priority" | "due_at" | "start_at" | "is_pinned" | "is_archived">>;
type GoalInput = Partial<Pick<ProductivityGoal, "title" | "status" | "progress_percent" | "target_at" | "priority" | "is_archived">>;
type EventInput = Partial<Pick<ProductivityEvent, "title" | "starts_at" | "ends_at" | "all_day" | "status" | "is_archived">>;

export const productivityApi = {
  overview: () => request<{ today_tasks: number; overdue_tasks: number; upcoming_events: ProductivityEvent[]; upcoming_reminders: ProductivityReminder[]; recent_tasks: ProductivityTask[]; active_goals: ProductivityGoal[] }>("/overview"),
  listLists: (archived = false) => request<{ lists: ProductivityList[] }>(`/lists?limit=100&archived=${archived}`),
  createList: (name: string) => request<{ list: ProductivityList }>("/lists", { method: "POST", body: JSON.stringify({ name }) }),
  updateList: (id: string, payload: Partial<Pick<ProductivityList, "name" | "is_archived">>) => request<{ list: ProductivityList }>(`/lists/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  listTasks: (params: { archived?: boolean; status?: string } = {}) => request<{ tasks: ProductivityTask[] }>(`/tasks?limit=100${params.archived !== undefined ? `&archived=${params.archived}` : ""}${params.status ? `&status=${encodeURIComponent(params.status)}` : ""}`),
  createTask: (payload: Pick<ProductivityTask, "title"> & TaskInput) => request<{ task: ProductivityTask }>("/tasks", { method: "POST", body: JSON.stringify(payload) }),
  updateTask: (id: string, payload: TaskInput) => request<{ task: ProductivityTask }>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteTask: (id: string) => request<{ deleted: true }>(`/tasks/${id}`, { method: "DELETE" }),
  listReminders: () => request<{ reminders: ProductivityReminder[] }>("/reminders?limit=100"),
  createReminder: (title: string, remind_at: string) => request<{ reminder: ProductivityReminder }>("/reminders", { method: "POST", body: JSON.stringify({ title, remind_at, channels: ["in_app"] }) }),
  updateReminder: (id: string, payload: Partial<Pick<ProductivityReminder, "status" | "remind_at">>) => request<{ reminder: ProductivityReminder }>(`/reminders/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteReminder: (id: string) => request<{ deleted: true }>(`/reminders/${id}`, { method: "DELETE" }),
  listGoals: (archived = false) => request<{ goals: ProductivityGoal[] }>(`/goals?limit=100&archived=${archived}`),
  createGoal: (payload: Pick<ProductivityGoal, "title"> & GoalInput) => request<{ goal: ProductivityGoal }>("/goals", { method: "POST", body: JSON.stringify(payload) }),
  updateGoal: (id: string, payload: GoalInput) => request<{ goal: ProductivityGoal }>(`/goals/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteGoal: (id: string) => request<{ deleted: true }>(`/goals/${id}`, { method: "DELETE" }),
  listEvents: (start: string, end: string) => request<{ events: ProductivityEvent[] }>(`/calendar?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
  createEvent: (payload: Required<Pick<ProductivityEvent, "title" | "starts_at" | "ends_at">> & EventInput) => request<{ event: ProductivityEvent }>("/calendar", { method: "POST", body: JSON.stringify(payload) }),
  deleteEvent: (id: string) => request<{ deleted: true }>(`/calendar/${id}`, { method: "DELETE" }),
  getMyDay: (day: string) => request<{ day: string; items: MyDayItem[] }>(`/my-day?day=${encodeURIComponent(day)}`),
  addMyDay: (task_id: string, day: string) => request<{ item: MyDayItem }>("/my-day/items", { method: "POST", body: JSON.stringify({ task_id, day }) }),
  removeMyDay: (taskId: string, day: string) => request<{ removed: true }>(`/my-day/items/${taskId}?day=${encodeURIComponent(day)}`, { method: "DELETE" }),
  getSettings: () => request<{ settings: ProductivitySettings }>("/settings"),
  updateSettings: (payload: Partial<ProductivitySettings>) => request<{ settings: ProductivitySettings }>("/settings", { method: "PATCH", body: JSON.stringify(payload) }),
  listTemplates: () => request<{ templates: ProductivityTemplate[] }>("/templates?limit=100"),
  createTemplate: (name: string, kind: ProductivityTemplate["kind"], content: Record<string, unknown>) => request<{ template: ProductivityTemplate }>("/templates", { method: "POST", body: JSON.stringify({ name, kind, content }) }),
  deleteTemplate: (id: string) => request<{ deleted: true }>(`/templates/${id}`, { method: "DELETE" }),
  listFocusSessions: () => request<{ focus_sessions: FocusSession[] }>("/focus-sessions?limit=25"),
  createFocusSession: (planned_minutes: number, task_id?: string) => request<{ focus_session: FocusSession }>("/focus-sessions", { method: "POST", body: JSON.stringify({ planned_minutes, ...(task_id ? { task_id } : {}) }) }),
  updateFocusSession: (id: string, payload: Partial<Pick<FocusSession, "status" | "actual_minutes">>) => request<{ focus_session: FocusSession }>(`/focus-sessions/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  analytics: (from: string, to: string) => request<ProductivityAnalytics>(`/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  compose: (payload: ProductivityComposePayload) => request<ProductivityComposeResponse>("/compose", { method: "POST", body: JSON.stringify(payload) }),
};
