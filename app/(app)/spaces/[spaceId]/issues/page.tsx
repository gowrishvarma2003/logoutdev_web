"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useIssues, useWorkSummary, useContributors, useMilestones } from "@/lib/hooks/useSpaces";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRepos } from "@/lib/hooks/useRepos";
import WorkItemCard from "@/components/spaces/WorkItemCard";
import { EmptyState, SectionHeader } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import {
  BarChartIcon,
  CalendarIcon,
  ChevronDownIcon,
  FilterIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  SearchIcon,
  UsersIcon,
} from "@/components/ui/Icons";
import * as api from "@/lib/services/spacesApi";
import type {
  MilestoneStatus,
  SpaceIssuePriority,
  SpaceIssueStatus,
  SpaceMilestone,
  WorkDueState,
  WorkItemType,
  WorkReadiness,
  WorkSort,
  WorkView,
} from "@/lib/types";
import { buildWorkHref, parseWorkSearchParams, serializeWorkQuery, type WorkSearchState } from "@/lib/workFilters";
import RichComposer from "@/components/ui/RichComposer";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";

const MAX_WORK_PHOTOS = 6;
const MAX_WORK_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_WORK_PHOTO_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

interface SelectedWorkPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

const STATUS_OPTIONS: Array<{ value: "" | SpaceIssueStatus; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "triaged", label: "Triaged" },
  { value: "in-progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS: Array<{ value: "" | SpaceIssuePriority; label: string }> = [
  { value: "", label: "All priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const TYPE_OPTIONS: Array<{ value: "" | WorkItemType; label: string }> = [
  { value: "", label: "All types" },
  { value: "task", label: "Task" },
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "docs", label: "Docs" },
  { value: "research", label: "Research" },
];

const SORT_OPTIONS: Array<{ value: WorkSort; label: string }> = [
  { value: "updated", label: "Updated" },
  { value: "created", label: "Created" },
  { value: "priority", label: "Priority" },
  { value: "due_date", label: "Due date" },
];

const DUE_OPTIONS: Array<{ value: "" | WorkDueState; label: string }> = [
  { value: "", label: "Any due date" },
  { value: "overdue", label: "Overdue" },
  { value: "due_soon", label: "Due soon" },
  { value: "scheduled", label: "Scheduled" },
  { value: "none", label: "No due date" },
];

const READINESS_OPTIONS: Array<{ value: "" | WorkReadiness; label: string }> = [
  { value: "", label: "Any readiness" },
  { value: "needs_triage", label: "Needs triage" },
  { value: "ready", label: "Ready for contributor" },
];

const VIEW_OPTIONS: Array<{ value: WorkView; label: string; icon: ReactNode }> = [
  { value: "list", label: "List", icon: <QuestionMarkCircleIcon className="h-4 w-4" /> },
  { value: "board", label: "Board", icon: <BarChartIcon className="h-4 w-4" /> },
  { value: "calendar", label: "Calendar", icon: <CalendarIcon className="h-4 w-4" /> },
  { value: "workload", label: "Workload", icon: <UsersIcon className="h-4 w-4" /> },
];

const MILESTONE_STATUS_OPTIONS: MilestoneStatus[] = ["planned", "active", "completed", "archived"];

function ViewButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-white bg-white text-zinc-950"
          : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function CompactWorkLink({
  href,
  title,
  meta,
}: {
  href: string;
  title: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-zinc-800 bg-zinc-950/60 px-3 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-950"
    >
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-zinc-500">{meta}</p>
    </Link>
  );
}

export default function WorkPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);
  const { user, isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { repos } = useRepos(spaceId);
  const { contributors } = useContributors(spaceId);
  const { milestones, refetch: refetchMilestones } = useMilestones(spaceId);

  const filters = useMemo(() => parseWorkSearchParams(new URLSearchParams(searchParams.toString())), [searchParams]);
  const pageLimit = filters.view === "list" ? 20 : 100;
  const queryString = useMemo(
    () => serializeWorkQuery(filters),
    [filters]
  );

  const { issues, total, loading, error, refetch } = useIssues(spaceId, {
    status: filters.status,
    priority: filters.priority,
    assignee: filters.assignee,
    type: filters.type,
    repo_id: filters.repo_id,
    needed_skill: filters.needed_skill,
    good_first: filters.good_first,
    help_wanted: filters.help_wanted,
    blocked: filters.blocked,
    q: filters.q,
    sort: filters.sort,
    due_state: filters.due_state,
    stale: filters.stale,
    readiness: filters.readiness,
    page: filters.view === "list" ? filters.page : 1,
    limit: pageLimit,
  });

  const { summary, refetch: refetchSummary } = useWorkSummary(spaceId, {
    status: filters.status,
    priority: filters.priority,
    assignee: filters.assignee,
    type: filters.type,
    repo_id: filters.repo_id,
    needed_skill: filters.needed_skill,
    good_first: filters.good_first,
    help_wanted: filters.help_wanted,
    blocked: filters.blocked,
    q: filters.q,
    sort: filters.sort,
    due_state: filters.due_state,
    stale: filters.stale,
    readiness: filters.readiness,
  });

  const currentMembership = useMemo(
    () => contributors.find((member) => member.user_id === user?.id) ?? null,
    [contributors, user?.id]
  );
  const canBulkManage = Boolean(
    currentMembership?.role === "owner"
    || currentMembership?.role === "maintainer"
    || issues.some((issue) => issue.viewer_state?.can_bulk_manage)
  );

  const [showComposer, setShowComposer] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [composerPhotos, setComposerPhotos] = useState<SelectedWorkPhoto[]>([]);
  const composerPhotosRef = useRef<SelectedWorkPhoto[]>([]);
  const [composerPhotoError, setComposerPhotoError] = useState("");
  const [composerType, setComposerType] = useState<WorkItemType>("task");
  const [composerPriority, setComposerPriority] = useState<SpaceIssuePriority>("medium");
  const [composerRepoId, setComposerRepoId] = useState("");
  const [composerMilestoneId, setComposerMilestoneId] = useState("");
  const [composerGoodFirst, setComposerGoodFirst] = useState(false);
  const [composerHelpWanted, setComposerHelpWanted] = useState(false);
  const [composerNeededSkill, setComposerNeededSkill] = useState("");
  const [composerEstimate, setComposerEstimate] = useState("");
  const [composerTargetDate, setComposerTargetDate] = useState("");
  const [showMilestoneManager, setShowMilestoneManager] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [milestoneStatus, setMilestoneStatus] = useState<MilestoneStatus>("planned");
  const [milestoneTargetDate, setMilestoneTargetDate] = useState("");
  const [milestoneSubmitting, setMilestoneSubmitting] = useState(false);
  const [milestoneError, setMilestoneError] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkPriority, setBulkPriority] = useState("");
  const [bulkAssigneeUserId, setBulkAssigneeUserId] = useState("");
  const [bulkRepoId, setBulkRepoId] = useState("");
  const [bulkMilestoneId, setBulkMilestoneId] = useState("");
  const [bulkNeededSkill, setBulkNeededSkill] = useState("");
  const [bulkBlockedReason, setBulkBlockedReason] = useState("");
  const [bulkGoodFirst, setBulkGoodFirst] = useState("");
  const [bulkHelpWanted, setBulkHelpWanted] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState("");

  const [busyIssueId, setBusyIssueId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(filters.q || "");

  // Collapsible UI state
  const [showMetrics, setShowMetrics] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    composerPhotosRef.current = composerPhotos;
  }, [composerPhotos]);

  useEffect(() => () => {
    composerPhotosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
  }, []);

  const updateFilters = useCallback(
    (patch: Partial<Record<keyof WorkSearchState, string | number | boolean | undefined | null>>) => {
      router.replace(
        buildWorkHref(pathname, new URLSearchParams(searchParams.toString()), patch, {
          keepDefaultView: patch.view === "list",
        })
      );
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const issueIdSet = new Set(issues.map((issue) => issue.id));
    setSelectedIds((current) => {
      const next = current.filter((id) => issueIdSet.has(id));
      if (next.length === current.length && next.every((id, index) => id === current[index])) {
        return current;
      }
      return next;
    });
  }, [issues]);

  useEffect(() => {
    const nextValue = filters.q || "";
    setSearchInput((current) => (current === nextValue ? current : nextValue));
  }, [filters.q]);

  useEffect(() => {
    const normalizedCurrent = filters.q || "";
    if (searchInput === normalizedCurrent) return;

    const handle = window.setTimeout(() => {
      updateFilters({ q: searchInput || null, page: 1 });
    }, 300);

    return () => window.clearTimeout(handle);
  }, [filters.q, searchInput, updateFilters]);

  function clearFilters() {
    router.replace(pathname);
  }

  async function refreshWork() {
    refetch();
    refetchSummary();
  }

  function clearComposerPhotos() {
    composerPhotosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    composerPhotosRef.current = [];
    setComposerPhotos([]);
    setComposerPhotoError("");
  }

  function handlePhotoSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    setComposerPhotos((current) => {
      if (current.length + files.length > MAX_WORK_PHOTOS) {
        setComposerPhotoError(`You can attach at most ${MAX_WORK_PHOTOS} photos.`);
        return current;
      }

      const invalidType = files.find((file) => !ALLOWED_WORK_PHOTO_TYPES.has(file.type));
      if (invalidType) {
        setComposerPhotoError("Only PNG, JPG, WebP, or GIF images can be attached.");
        return current;
      }

      const oversized = files.find((file) => file.size > MAX_WORK_PHOTO_SIZE_BYTES);
      if (oversized) {
        setComposerPhotoError("Each attached photo must be 10MB or smaller.");
        return current;
      }

      setComposerPhotoError("");
      return [
        ...current,
        ...files.map((file) => ({
          id: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ];
    });
  }

  function removeComposerPhoto(photoId: string) {
    setComposerPhotos((current) => {
      const photo = current.find((item) => item.id === photoId);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return current.filter((item) => item.id !== photoId);
    });
    setComposerPhotoError("");
  }

  function resetMilestoneForm() {
    setEditingMilestoneId(null);
    setMilestoneTitle("");
    setMilestoneDescription("");
    setMilestoneStatus("planned");
    setMilestoneTargetDate("");
    setMilestoneError("");
  }

  function startMilestoneEdit(milestone: SpaceMilestone) {
    setEditingMilestoneId(milestone.id);
    setMilestoneTitle(milestone.title);
    setMilestoneDescription(milestone.description ?? "");
    setMilestoneStatus(milestone.status);
    setMilestoneTargetDate(milestone.target_date ? milestone.target_date.slice(0, 10) : "");
    setMilestoneError("");
    setShowMilestoneManager(true);
  }

  async function handleMilestoneSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!milestoneTitle.trim()) return;

    setMilestoneSubmitting(true);
    setMilestoneError("");
    try {
      if (editingMilestoneId) {
        await api.updateMilestone(spaceId, editingMilestoneId, {
          title: milestoneTitle.trim(),
          description: milestoneDescription.trim() || null,
          status: milestoneStatus,
          target_date: milestoneTargetDate || null,
        });
      } else {
        await api.createMilestone(spaceId, {
          title: milestoneTitle.trim(),
          description: milestoneDescription.trim() || null,
          status: milestoneStatus,
          target_date: milestoneTargetDate || null,
        });
      }
      resetMilestoneForm();
      setShowMilestoneManager(false);
      refetchMilestones();
    } catch (err) {
      setMilestoneError(err instanceof Error ? err.message : "Failed to save milestone.");
    } finally {
      setMilestoneSubmitting(false);
    }
  }

  async function handlePost(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) return;
    if (composerPhotos.length > MAX_WORK_PHOTOS) {
      setComposerPhotoError(`You can attach at most ${MAX_WORK_PHOTOS} photos.`);
      return;
    }

    setPosting(true);
    setPostError("");
    try {
      await api.createWork(spaceId, {
        title: title.trim(),
        body: body.trim(),
        type: composerType,
        priority: composerPriority,
        repo_id: composerRepoId || undefined,
        milestone_id: composerMilestoneId || undefined,
        good_first_task: composerGoodFirst,
        help_wanted: composerHelpWanted,
        needed_skill: composerNeededSkill.trim() || undefined,
        estimate: composerEstimate.trim() || undefined,
        target_date: composerTargetDate || undefined,
        attachments: composerPhotos.map((photo) => photo.file),
      });
      setTitle("");
      setBody("");
      clearComposerPhotos();
      setComposerType("task");
      setComposerPriority("medium");
      setComposerRepoId("");
      setComposerMilestoneId("");
      setComposerGoodFirst(false);
      setComposerHelpWanted(false);
      setComposerNeededSkill("");
      setComposerEstimate("");
      setComposerTargetDate("");
      setShowComposer(false);
      updateFilters({ page: 1 });
      await refreshWork();
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Failed to create work item");
    } finally {
      setPosting(false);
    }
  }

  async function runQuickAction(issueId: string, action: string, patch: Parameters<typeof api.updateWork>[2]) {
    setBusyIssueId(issueId);
    setBusyAction(action);
    try {
      await api.updateWork(spaceId, issueId, patch);
      await refreshWork();
    } finally {
      setBusyIssueId(null);
      setBusyAction(null);
    }
  }

  async function handleBulkApply() {
    if (!selectedIds.length) return;

    const changes: Parameters<typeof api.bulkUpdateWork>[2] = {};
    if (bulkStatus) changes.status = bulkStatus as SpaceIssueStatus;
    if (bulkPriority) changes.priority = bulkPriority as SpaceIssuePriority;
    if (bulkAssigneeUserId) changes.assignee_user_id = bulkAssigneeUserId;
    if (bulkRepoId) changes.repo_id = bulkRepoId;
    if (bulkMilestoneId === "__clear__") changes.milestone_id = null;
    else if (bulkMilestoneId) changes.milestone_id = bulkMilestoneId;
    if (bulkNeededSkill.trim()) changes.needed_skill = bulkNeededSkill.trim();
    if (bulkBlockedReason.trim()) changes.blocked_reason = bulkBlockedReason.trim();
    if (bulkGoodFirst) changes.good_first_task = bulkGoodFirst === "true";
    if (bulkHelpWanted) changes.help_wanted = bulkHelpWanted === "true";

    if (Object.keys(changes).length === 0) {
      setBulkError("Pick at least one bulk change before applying.");
      return;
    }

    setBulkSubmitting(true);
    setBulkError("");
    try {
      await api.bulkUpdateWork(spaceId, selectedIds, changes);
      setSelectedIds([]);
      setBulkStatus("");
      setBulkPriority("");
      setBulkAssigneeUserId("");
      setBulkRepoId("");
      setBulkMilestoneId("");
      setBulkNeededSkill("");
      setBulkBlockedReason("");
      setBulkGoodFirst("");
      setBulkHelpWanted("");
      await refreshWork();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Failed to apply bulk action.");
    } finally {
      setBulkSubmitting(false);
    }
  }

  const hasActiveFilters = Boolean(
    filters.q
    || filters.status
    || filters.priority
    || filters.type
    || filters.repo_id
    || filters.assignee
    || filters.needed_skill
    || filters.good_first
    || filters.help_wanted
    || filters.blocked
    || filters.stale
    || filters.due_state
    || filters.readiness
  );

  // Count active filters for badge display
  const activeFilterCount = [
    filters.q,
    filters.status,
    filters.priority,
    filters.type,
    filters.repo_id,
    filters.assignee,
    filters.needed_skill,
    filters.good_first,
    filters.help_wanted,
    filters.blocked,
    filters.stale,
    filters.due_state,
    filters.readiness,
  ].filter(Boolean).length;

  const emptyStateDescription = hasActiveFilters
    ? "No work items match the current search and filters."
    : !user
      ? "Browse public work or sign in to open a task, bug, feature, docs request, or research item."
      : canBulkManage
        ? "Add the first task or triage incoming work for this space."
        : "Pick a contributor-ready item or start a new work thread.";
  const emptyStateTitle = hasActiveFilters
    ? "No work matches this view"
    : !user
      ? "Browse open work"
      : canBulkManage
        ? "No work has landed yet"
        : "No contributor-ready work yet";
  const emptyStateAction = hasActiveFilters ? (
    <button
      onClick={clearFilters}
      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
    >
      Reset filters
    </button>
  ) : !user ? (
    <Link
      href="/login"
      className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
    >
      Sign in to contribute
    </Link>
  ) : canBulkManage ? (
    <button
      onClick={() => setShowComposer(true)}
      className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
    >
      Add the first work item
    </button>
  ) : (
    <button
      onClick={() => updateFilters({ readiness: "ready", page: 1, view: "list" })}
      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
    >
      Show ready work
    </button>
  );

  const groupedBoard = useMemo(() => {
    const groups: Record<SpaceIssueStatus, typeof issues> = {
      open: [],
      triaged: [],
      "in-progress": [],
      resolved: [],
      closed: [],
    };
    issues.forEach((issue) => {
      groups[issue.status].push(issue);
    });
    return groups;
  }, [issues]);

  const calendarGroups = useMemo(() => {
    const groups = new Map<string, typeof issues>();
    issues.forEach((issue) => {
      const key = issue.target_date || "Unscheduled";
      const current = groups.get(key) ?? [];
      current.push(issue);
      groups.set(key, current);
    });
    return Array.from(groups.entries()).sort(([left], [right]) => {
      if (left === "Unscheduled") return 1;
      if (right === "Unscheduled") return -1;
      return left.localeCompare(right);
    });
  }, [issues]);

  const workloadGroups = useMemo(() => {
    const groups = new Map<string, { label: string; issues: typeof issues }>();
    issues.forEach((issue) => {
      const key = issue.assignee?.id || "unassigned";
      const label = issue.assignee?.name || "Unassigned";
      const existing = groups.get(key) ?? { label, issues: [] };
      existing.issues.push(issue);
      groups.set(key, existing);
    });
    return Array.from(groups.entries()).sort(([, left], [, right]) => right.issues.length - left.issues.length);
  }, [issues]);

  return (
    <div>
      <SectionHeader
        title="Work"
        count={total}
        action={
          user ? (
            <button
              onClick={() => setShowComposer((current) => !current)}
              className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add work
            </button>
          ) : undefined
        }
      />

      <div className="space-y-3 border-b border-zinc-800 px-4 py-4">
        {/* View mode buttons - always visible */}
        <div className="flex flex-wrap items-center gap-2">
          {VIEW_OPTIONS.map((option) => (
            <ViewButton
              key={option.value}
              active={filters.view === option.value}
              icon={option.icon}
              label={option.label}
              onClick={() => updateFilters({ view: option.value, page: 1 })}
            />
          ))}
          <button
            onClick={() => updateFilters({ status: "open", assignee: "unassigned", readiness: "needs_triage", sort: "created", page: 1, view: "list" })}
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/20"
          >
            Triage inbox
          </button>
          {user ? (
            <button
              onClick={() => updateFilters({ assignee: "me", page: 1, view: "list" })}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              My work
            </button>
          ) : null}
        </div>

        {/* Collapsible toggle buttons row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metrics toggle */}
          {summary ? (
            <button
              onClick={() => setShowMetrics((current) => !current)}
              className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
            >
              <BarChartIcon className="h-4 w-4 text-zinc-500" />
              <span>Metrics</span>
              <ChevronDownIcon
                className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${showMetrics ? "rotate-180" : ""}`}
              />
            </button>
          ) : null}

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters((current) => !current)}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            <FilterIcon className="h-4 w-4 text-zinc-500" />
            <span>Filters</span>
            {activeFilterCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500/20 px-1.5 text-xs font-semibold text-blue-400">
                {activeFilterCount}
              </span>
            ) : null}
            <ChevronDownIcon
              className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
            />
          </button>

          {/* Clear filters button - shown when filters are active */}
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="text-xs text-zinc-500 transition-colors hover:text-white"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {/* Collapsible Metrics section */}
        {summary ? (
          <div
            className={`grid transition-all duration-200 ease-in-out ${
              showMetrics ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="space-y-3 pt-1">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                  {[
                    { label: "Open", value: summary.open, patch: { status: "open", page: 1, view: "list" } },
                    { label: "Unassigned", value: summary.unassigned, patch: { assignee: "unassigned", page: 1, view: "list" } },
                    { label: "Blocked", value: summary.blocked, patch: { blocked: true, page: 1, view: "list" } },
                    { label: "Overdue", value: summary.overdue, patch: { due_state: "overdue", page: 1, view: "list" } },
                    { label: "Stale", value: summary.stale, patch: { stale: true, page: 1, view: "list" } },
                    { label: "Ready", value: summary.ready_for_contributor, patch: { readiness: "ready", page: 1, view: "list" } },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => updateFilters(item.patch)}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                    >
                      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{item.label}</p>
                      <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">Triage inbox</p>
                    <p className="text-xs text-zinc-500">{summary.needs_triage} open item(s) still need first-pass triage.</p>
                  </div>
                  <button
                    onClick={() => updateFilters({ status: "open", assignee: "unassigned", readiness: "needs_triage", sort: "created", page: 1, view: "list" })}
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/20"
                  >
                    Open triage inbox
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Collapsible Filters section */}
        <div
          className={`grid transition-all duration-200 ease-in-out ${
            showFilters ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-3 pt-1">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,0.9fr))]">
                <label className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search title, description, reporter, or assignee"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-10 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                  />
                </label>

                <select
                  value={filters.sort}
                  onChange={(event) => updateFilters({ sort: event.target.value, page: 1 })}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      Sort: {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.status || ""}
                  onChange={(event) => updateFilters({ status: event.target.value || null, page: 1 })}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.priority || ""}
                  onChange={(event) => updateFilters({ priority: event.target.value || null, page: 1 })}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.type || ""}
                  onChange={(event) => updateFilters({ type: event.target.value || null, page: 1 })}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 lg:grid-cols-6">
                <select
                  value={filters.repo_id || ""}
                  onChange={(event) => updateFilters({ repo_id: event.target.value || null, page: 1 })}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
                >
                  <option value="">All repos</option>
                  {repos.map((repo) => (
                    <option key={repo.id} value={repo.id}>
                      {repo.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.assignee || ""}
                  onChange={(event) => updateFilters({ assignee: event.target.value || null, page: 1 })}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
                >
                  <option value="">Any assignee</option>
                  <option value="unassigned">Unassigned</option>
                  {user ? <option value="me">Assigned to me</option> : null}
                  {contributors.map((member) => (
                    <option key={member.id} value={member.user_id}>
                      {member.user?.name ?? member.user_id}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={filters.needed_skill || ""}
                  onChange={(event) => updateFilters({ needed_skill: event.target.value || null, page: 1 })}
                  placeholder="Needed skill"
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                />

                <select
                  value={filters.due_state || ""}
                  onChange={(event) => updateFilters({ due_state: event.target.value || null, page: 1 })}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
                >
                  {DUE_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.readiness || ""}
                  onChange={(event) => updateFilters({ readiness: event.target.value || null, page: 1 })}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
                >
                  {READINESS_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={Boolean(filters.good_first)}
                      onChange={(event) => updateFilters({ good_first: event.target.checked || null, page: 1 })}
                      className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-950 text-white"
                    />
                    Good first
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={Boolean(filters.help_wanted)}
                      onChange={(event) => updateFilters({ help_wanted: event.target.checked || null, page: 1 })}
                      className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-950 text-white"
                    />
                    Help wanted
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={Boolean(filters.blocked)}
                      onChange={(event) => updateFilters({ blocked: event.target.checked || null, page: 1 })}
                      className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-950 text-white"
                    />
                    Blocked
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={Boolean(filters.stale)}
                      onChange={(event) => updateFilters({ stale: event.target.checked || null, page: 1 })}
                      className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-950 text-white"
                    />
                    Stale
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showComposer ? (
        <form onSubmit={handlePost} className="space-y-3 border-b border-zinc-800 bg-zinc-900/30 px-4 py-4">
          <div className="grid gap-3 md:grid-cols-4">
            <select
              value={composerType}
              onChange={(event) => setComposerType(event.target.value as WorkItemType)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
            >
              {TYPE_OPTIONS.filter((option) => option.value).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={composerPriority}
              onChange={(event) => setComposerPriority(event.target.value as SpaceIssuePriority)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
            >
              {PRIORITY_OPTIONS.filter((option) => option.value).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={composerRepoId}
              onChange={(event) => setComposerRepoId(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
            >
              <option value="">No linked repo</option>
              {repos.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.name}
                </option>
              ))}
            </select>
            <select
              value={composerMilestoneId}
              onChange={(event) => setComposerMilestoneId(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
            >
              <option value="">No milestone</option>
              {milestones.map((milestone) => (
                <option key={milestone.id} value={milestone.id}>
                  {milestone.title}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Work title"
            maxLength={180}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />

          <RichComposer
            value={body}
            onChange={(value) => setBody(value)}
            placeholder="Describe the task, bug, feature, docs request, or research need"
            rows={4}
            previewClassName="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm leading-relaxed text-white"
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm leading-relaxed text-transparent caret-white focus:border-zinc-600 focus:outline-none selection:bg-[#1d9bf0]/30"
          />

          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Photos</p>
                <p className="text-xs text-zinc-500">Attach up to 6 PNG, JPG, WebP, or GIF images. 10MB each.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800">
                <PhotoIcon className="h-4 w-4" />
                Add photos
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple
                  onChange={handlePhotoSelection}
                  className="sr-only"
                  disabled={posting || composerPhotos.length >= MAX_WORK_PHOTOS}
                />
              </label>
            </div>

            {composerPhotoError ? (
              <p className="text-xs text-rose-400">{composerPhotoError}</p>
            ) : null}

            {composerPhotos.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {composerPhotos.map((photo) => (
                  <div key={photo.id} className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.previewUrl} alt={photo.file.name} className="aspect-video w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1.5">
                      <p className="truncate text-xs font-medium text-white">{photo.file.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeComposerPhoto(photo.id)}
                      className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white transition-colors hover:bg-rose-500"
                      aria-label={`Remove ${photo.file.name}`}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="text"
              value={composerNeededSkill}
              onChange={(event) => setComposerNeededSkill(event.target.value)}
              placeholder="Needed skill"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
            <input
              type="text"
              value={composerEstimate}
              onChange={(event) => setComposerEstimate(event.target.value)}
              placeholder="Estimate"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
            <input
              type="date"
              value={composerTargetDate}
              onChange={(event) => setComposerTargetDate(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={composerGoodFirst}
                onChange={(event) => setComposerGoodFirst(event.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
              />
              Good first task
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={composerHelpWanted}
                onChange={(event) => setComposerHelpWanted(event.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
              />
              Help wanted
            </label>
          </div>

          <div className="flex items-center justify-end gap-2">
            {postError ? <span className="mr-auto text-xs text-rose-400">{postError}</span> : null}
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={posting || !title.trim() || !body.trim()}
              className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-50"
            >
              {posting ? "Posting..." : "Create work"}
            </button>
          </div>
        </form>
      ) : null}

      {(milestones.length > 0 || canBulkManage) ? (
        <div className="space-y-4 border-b border-zinc-800 bg-zinc-950/20 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Milestones</p>
              <p className="text-xs text-zinc-500">
                Plan larger work arcs and assign items to milestone records instead of raw IDs.
              </p>
            </div>
            {canBulkManage ? (
              <button
                onClick={() => {
                  if (showMilestoneManager) {
                    setShowMilestoneManager(false);
                    resetMilestoneForm();
                  } else {
                    setShowMilestoneManager(true);
                  }
                }}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                {showMilestoneManager ? "Hide milestone form" : "New milestone"}
              </button>
            ) : null}
          </div>

          {milestones.length > 0 ? (
            <div className="grid gap-3 xl:grid-cols-3">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{milestone.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {milestone.target_date
                          ? `Target ${new Date(milestone.target_date).toLocaleDateString()}`
                          : "No target date"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        milestone.status === "active"
                          ? "bg-sky-500/10 text-sky-300"
                          : milestone.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-300"
                            : milestone.status === "archived"
                              ? "bg-zinc-800 text-zinc-400"
                              : "bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {milestone.status}
                    </span>
                  </div>
                  {milestone.description ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-400">{milestone.description}</p>
                  ) : null}
                  {canBulkManage ? (
                    <button
                      onClick={() => startMilestoneEdit(milestone)}
                      className="mt-3 text-xs text-sky-400 transition-colors hover:text-sky-300"
                    >
                      Edit milestone
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
              No milestones yet.
            </div>
          )}

          {showMilestoneManager && canBulkManage ? (
            <form onSubmit={handleMilestoneSubmit} className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {editingMilestoneId ? "Edit milestone" : "Create milestone"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Milestones can now be assigned directly from work create/edit flows and bulk updates.
                  </p>
                </div>
                {editingMilestoneId ? (
                  <button
                    type="button"
                    onClick={resetMilestoneForm}
                    className="text-xs text-zinc-500 transition-colors hover:text-white"
                  >
                    Switch to new
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
                <input
                  type="text"
                  value={milestoneTitle}
                  onChange={(event) => setMilestoneTitle(event.target.value)}
                  placeholder="Milestone title"
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                />
                <select
                  value={milestoneStatus}
                  onChange={(event) => setMilestoneStatus(event.target.value as MilestoneStatus)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
                >
                  {MILESTONE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={milestoneTargetDate}
                  onChange={(event) => setMilestoneTargetDate(event.target.value)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
                />
              </div>

              <textarea
                value={milestoneDescription}
                onChange={(event) => setMilestoneDescription(event.target.value)}
                placeholder="What does this milestone cover?"
                rows={3}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2">
                {milestoneError ? <span className="mr-auto text-xs text-rose-400">{milestoneError}</span> : null}
                <button
                  type="button"
                  onClick={() => {
                    setShowMilestoneManager(false);
                    resetMilestoneForm();
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={milestoneSubmitting || !milestoneTitle.trim()}
                  className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-50"
                >
                  {milestoneSubmitting ? "Saving..." : editingMilestoneId ? "Save milestone" : "Create milestone"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

      {!user && isLoaded ? (
        <div className="border-b border-zinc-800 px-4 py-3 text-xs text-zinc-500">
          Sign in to create work for this space.
        </div>
      ) : null}

      {canBulkManage && selectedIds.length > 0 && filters.view === "list" ? (
        <div className="space-y-3 border-b border-zinc-800 bg-zinc-950/60 px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-200">
              {selectedIds.length} selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-zinc-500 transition-colors hover:text-white"
            >
              Clear selection
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-5">
            <select
              value={bulkStatus}
              onChange={(event) => setBulkStatus(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
            >
              <option value="">Bulk status</option>
              {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={bulkPriority}
              onChange={(event) => setBulkPriority(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
            >
              <option value="">Bulk priority</option>
              {PRIORITY_OPTIONS.filter((option) => option.value).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={bulkAssigneeUserId}
              onChange={(event) => setBulkAssigneeUserId(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
            >
              <option value="">Bulk assignee</option>
              {contributors.map((member) => (
                <option key={member.id} value={member.user_id}>
                  {member.user?.name ?? member.user_id}
                </option>
              ))}
            </select>
            <select
              value={bulkRepoId}
              onChange={(event) => setBulkRepoId(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
            >
              <option value="">Bulk repo</option>
              {repos.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.name}
                </option>
              ))}
            </select>
            <select
              value={bulkMilestoneId}
              onChange={(event) => setBulkMilestoneId(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
            >
              <option value="">Bulk milestone</option>
              <option value="__clear__">Clear milestone</option>
              {milestones.map((milestone) => (
                <option key={milestone.id} value={milestone.id}>
                  {milestone.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto_auto]">
            <input
              type="text"
              value={bulkNeededSkill}
              onChange={(event) => setBulkNeededSkill(event.target.value)}
              placeholder="Bulk needed skill"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
            <input
              type="text"
              value={bulkBlockedReason}
              onChange={(event) => setBulkBlockedReason(event.target.value)}
              placeholder="Bulk blocked reason"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
            <select
              value={bulkGoodFirst}
              onChange={(event) => setBulkGoodFirst(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
            >
              <option value="">Good first</option>
              <option value="true">Set true</option>
              <option value="false">Set false</option>
            </select>
            <select
              value={bulkHelpWanted}
              onChange={(event) => setBulkHelpWanted(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
            >
              <option value="">Help wanted</option>
              <option value="true">Set true</option>
              <option value="false">Set false</option>
            </select>
            <button
              onClick={handleBulkApply}
              disabled={bulkSubmitting}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-50"
            >
              {bulkSubmitting ? "Applying..." : "Apply"}
            </button>
          </div>
          {bulkError ? <p className="text-xs text-rose-400">{bulkError}</p> : null}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : null}

      {error ? <p className="py-10 text-center text-sm text-rose-400">{error}</p> : null}

      {!loading && !error && issues.length === 0 ? (
        <EmptyState
          icon={<QuestionMarkCircleIcon className="h-10 w-10" />}
          title={emptyStateTitle}
          description={emptyStateDescription}
          action={emptyStateAction}
        />
      ) : null}

      {!loading && !error && issues.length > 0 ? (
        <>
          {filters.view === "list" ? (
            <div>
              {canBulkManage ? (
                <div className="flex justify-end px-4 py-2">
                  <button
                    onClick={() => {
                      if (selectedIds.length === issues.length) setSelectedIds([]);
                      else setSelectedIds(issues.map((issue) => issue.id));
                    }}
                    className="text-xs text-zinc-500 transition-colors hover:text-white"
                  >
                    {selectedIds.length === issues.length ? "Clear page" : "Select page"}
                  </button>
                </div>
              ) : null}
              {issues.map((issue) => (
                <WorkItemCard
                  key={issue.id}
                  issue={issue}
                  spaceId={spaceId}
                  queryString={queryString}
                  selectable={canBulkManage}
                  selected={selectedIds.includes(issue.id)}
                  onSelectedChange={(checked) => {
                    setSelectedIds((current) => (
                      checked
                        ? [...new Set([...current, issue.id])]
                        : current.filter((id) => id !== issue.id)
                    ));
                  }}
                  currentUserId={user?.id}
                  busyAction={busyIssueId === issue.id ? busyAction : null}
                  onClaim={() => runQuickAction(issue.id, "claim", { assignee_user_id: user?.id || "" })}
                  onStart={() => runQuickAction(issue.id, "start", { status: "in-progress" })}
                  onResolve={() => runQuickAction(issue.id, "resolve", { status: "resolved" })}
                  onMarkTriaged={() => runQuickAction(issue.id, "triage", { status: "triaged" })}
                  onAssignToMe={() => runQuickAction(issue.id, "assign", { assignee_user_id: user?.id || "" })}
                />
              ))}
            </div>
          ) : null}

          {filters.view === "board" ? (
            <div className="grid gap-4 p-4 lg:grid-cols-5">
              {(Object.keys(groupedBoard) as SpaceIssueStatus[]).map((status) => (
                <section key={status} className="rounded-2xl border border-zinc-800 bg-zinc-900/30">
                  <div className="border-b border-zinc-800 px-4 py-3">
                    <p className="text-sm font-semibold capitalize text-white">{status.replace("-", " ")}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{groupedBoard[status].length} item(s)</p>
                  </div>
                  <div className="space-y-3 p-3">
                    {groupedBoard[status].length === 0 ? (
                      <div className="rounded-xl border border-dashed border-zinc-800 px-3 py-6 text-center text-xs text-zinc-500">
                        No items
                      </div>
                    ) : (
                      groupedBoard[status].map((issue) => (
                        <CompactWorkLink
                          key={issue.id}
                          href={queryString ? `/spaces/${spaceId}/work/${issue.id}?${queryString}` : `/spaces/${spaceId}/work/${issue.id}`}
                          title={issue.title}
                          meta={`${issue.assignee?.name ?? "Unassigned"} · ${issue.priority}`}
                        />
                      ))
                    )}
                  </div>
                </section>
              ))}
            </div>
          ) : null}

          {filters.view === "calendar" ? (
            <div className="space-y-4 p-4">
              {calendarGroups.map(([key, group]) => (
                <section key={key} className="rounded-2xl border border-zinc-800 bg-zinc-900/30">
                  <div className="border-b border-zinc-800 px-4 py-3">
                    <p className="text-sm font-semibold text-white">
                      {key === "Unscheduled" ? key : new Date(`${key}T00:00:00`).toLocaleDateString()}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">{group.length} item(s)</p>
                  </div>
                  <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
                    {group.map((issue) => (
                      <CompactWorkLink
                        key={issue.id}
                        href={queryString ? `/spaces/${spaceId}/work/${issue.id}?${queryString}` : `/spaces/${spaceId}/work/${issue.id}`}
                        title={issue.title}
                        meta={`${issue.status} · ${issue.assignee?.name ?? "Unassigned"}`}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}

          {filters.view === "workload" ? (
            <div className="space-y-4 p-4">
              {workloadGroups.map(([key, group]) => (
                <section key={key} className="rounded-2xl border border-zinc-800 bg-zinc-900/30">
                  <div className="border-b border-zinc-800 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{group.label}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">{group.issues.length} assigned item(s)</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>{group.issues.filter((issue) => issue.blocked_reason).length} blocked</span>
                        <span>·</span>
                        <span>{group.issues.filter((issue) => issue.due_state === "overdue").length} overdue</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
                    {group.issues.map((issue) => (
                      <CompactWorkLink
                        key={issue.id}
                        href={queryString ? `/spaces/${spaceId}/work/${issue.id}?${queryString}` : `/spaces/${spaceId}/work/${issue.id}`}
                        title={issue.title}
                        meta={`${issue.status} · ${issue.priority}`}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {filters.view === "list" && (filters.page > 1 || issues.length >= pageLimit) ? (
        <div className="flex items-center justify-center gap-3 py-4">
          <button
            onClick={() => updateFilters({ page: Math.max(1, filters.page - 1) })}
            disabled={filters.page <= 1}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-zinc-500">Page {filters.page}</span>
          <button
            onClick={() => updateFilters({ page: filters.page + 1 })}
            disabled={issues.length < pageLimit}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
