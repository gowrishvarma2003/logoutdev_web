import type {
  SpaceIssuePriority,
  SpaceIssueStatus,
  WorkDueState,
  WorkItemType,
  WorkReadiness,
  WorkSort,
  WorkView,
} from "./types";

function parseBoolean(value: string | null) {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return undefined;
}

function parsePage(value: string | null) {
  const parsed = Number.parseInt(value || "1", 10);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return parsed;
}

function isDefaultSearchValue(key: string, value: string | number | boolean) {
  if (key === "sort" && value === "updated") return true;
  if (key === "page" && Number(value) === 1) return true;
  if (key === "view" && value === "list") return true;
  return false;
}

export interface WorkSearchState {
  q?: string;
  status?: SpaceIssueStatus;
  priority?: SpaceIssuePriority;
  type?: WorkItemType;
  repo_id?: string;
  assignee?: string;
  needed_skill?: string;
  good_first?: boolean;
  help_wanted?: boolean;
  blocked?: boolean;
  stale?: boolean;
  due_state?: WorkDueState;
  readiness?: WorkReadiness;
  sort: WorkSort;
  page: number;
  view: WorkView;
}

export function parseWorkSearchParams(searchParams: URLSearchParams): WorkSearchState {
  return {
    q: searchParams.get("q") || undefined,
    status: (searchParams.get("status") || undefined) as SpaceIssueStatus | undefined,
    priority: (searchParams.get("priority") || undefined) as SpaceIssuePriority | undefined,
    type: (searchParams.get("type") || undefined) as WorkItemType | undefined,
    repo_id: searchParams.get("repo_id") || undefined,
    assignee: searchParams.get("assignee") || undefined,
    needed_skill: searchParams.get("needed_skill") || undefined,
    good_first: parseBoolean(searchParams.get("good_first")),
    help_wanted: parseBoolean(searchParams.get("help_wanted")),
    blocked: parseBoolean(searchParams.get("blocked")),
    stale: parseBoolean(searchParams.get("stale")),
    due_state: (searchParams.get("due_state") || undefined) as WorkDueState | undefined,
    readiness: (searchParams.get("readiness") || undefined) as WorkReadiness | undefined,
    sort: (searchParams.get("sort") || "updated") as WorkSort,
    page: parsePage(searchParams.get("page")),
    view: (searchParams.get("view") || "list") as WorkView,
  };
}

export function buildWorkHref(
  pathname: string,
  current: URLSearchParams,
  patch: Partial<Record<keyof WorkSearchState, string | number | boolean | undefined | null>>
) {
  const next = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(patch)) {
    if (typeof value === "boolean") {
      if (value) next.set(key, "true");
      else next.delete(key);
      continue;
    }

    if (value === undefined || value === null || value === "") {
      next.delete(key);
      continue;
    }

    if (isDefaultSearchValue(key, value)) {
      next.delete(key);
      continue;
    }

    next.set(key, String(value));
  }

  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function serializeWorkQuery(searchState: Partial<WorkSearchState>) {
  const params = new URLSearchParams();

  Object.entries(searchState).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === false) return;
    if (isDefaultSearchValue(key, value)) return;
    params.set(key, String(value));
  });

  return params.toString();
}
