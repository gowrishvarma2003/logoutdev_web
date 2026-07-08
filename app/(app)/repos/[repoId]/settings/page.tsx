"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBranches, useRepo, useRepoAccess, useBranchProtectionRules } from "@/lib/hooks/useRepos";
import { useSpaceList } from "@/lib/hooks/useSpaces";
import * as reposApi from "@/lib/services/reposApi";
import * as cache from "@/lib/services/requestCache";
import type { RepoCollaboratorCandidate, RepoRole } from "@/lib/types";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import Avatar from "@/components/ui/Avatar";
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  TrashIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PlusIcon,
  ArrowRightIcon,
  LinkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserGroupIcon,
  KeyIcon,
  CheckCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

const BASE_ROLES: RepoRole[] = ["read", "triage", "write", "maintain"];

function roleOptions(isPersonalRepo: boolean): RepoRole[] {
  return isPersonalRepo ? [...BASE_ROLES, "admin"] : BASE_ROLES;
}

export default function RepoSettingsPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);
  const router = useRouter();
  const { repo, loading: repoLoading, error, refetch } = useRepo(repoId);
  const { collaborators, loading: accessLoading, refetch: refetchAccess } = useRepoAccess(repoId);
  const { branches } = useBranches(repoId);
  const { rules, loading: rulesLoading } = useBranchProtectionRules(repoId);
  const { data: spacesData, loading: spacesLoading, error: spacesError } = useSpaceList({ mine: true, page: 1, limit: 100 });

  const [activeTab, setActiveTab] = useState("general");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [attachmentSaving, setAttachmentSaving] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [attachmentSuccess, setAttachmentSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<RepoCollaboratorCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<RepoCollaboratorCandidate | null>(null);
  const [candidateRole, setCandidateRole] = useState<RepoRole>("read");
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Sync state with url hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#access") {
        setActiveTab("access");
      } else if (hash === "#binding") {
        setActiveTab("binding");
      } else if (hash === "#branches") {
        setActiveTab("branches");
      } else if (hash === "#danger") {
        setActiveTab("danger");
      } else {
        setActiveTab("general");
      }
    };
    
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  };

  useEffect(() => {
    if (!repo) return;
    setName(repo.name);
    setDescription(repo.description ?? "");
    setSlug(repo.slug);
    setDefaultBranch(repo.default_branch);
    setVisibility(repo.visibility);
    setSelectedSpaceId(repo.attached_space?.id ?? "");
  }, [repo]);

  useEffect(() => {
    if (!repo) return;
    let cancelled = false;
    if (!search.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    reposApi.searchRepositoryCollaborators(repo.id, search.trim())
      .then((response) => {
        if (!cancelled) {
          setResults(response.users);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSearching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [repo, search]);

  const spaces = spacesData?.spaces ?? [];
  const isPersonalRepo = !repo?.space_id;
  const availableRoles = useMemo(() => roleOptions(isPersonalRepo), [isPersonalRepo]);

  // Dirty state check for General Settings
  const isGeneralDirty = useMemo(() => {
    if (!repo) return false;
    return (
      name.trim() !== repo.name ||
      description.trim() !== (repo.description ?? "") ||
      slug.trim() !== repo.slug ||
      defaultBranch !== repo.default_branch ||
      visibility !== repo.visibility
    );
  }, [repo, name, description, slug, defaultBranch, visibility]);

  // Dirty state check for Space Attachment
  const isAttachmentDirty = useMemo(() => {
    if (!repo) return false;
    return selectedSpaceId !== (repo.attached_space?.id ?? "");
  }, [repo, selectedSpaceId]);

  // Access Metrics Calculations
  const metrics = useMemo(() => {
    let inheritedCount = 0;
    let directCount = 0;
    collaborators.forEach((member) => {
      if (member.direct_role) directCount++;
      if (member.inherited_role) inheritedCount++;
    });
    return {
      total: collaborators.length,
      inherited: inheritedCount,
      direct: directCount,
    };
  }, [collaborators]);

  // Branch rules summary calculation
  const rulesSummary = useMemo(() => {
    if (!rules || rules.length === 0) return null;
    const requirePr = rules.some((r) => r.require_pr);
    const requireApprovals = rules.some((r) => r.required_approvals > 0);
    const requireStatusChecks = rules.some((r) => r.require_status_checks);
    const allowForcePush = rules.some((r) => !r.allow_force_push);
    
    return {
      requirePr,
      requireApprovals,
      requireStatusChecks,
      allowForcePush,
    };
  }, [rules]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!repo) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      await reposApi.updateRepository(repo.id, {
        name: name.trim(),
        description: description.trim(),
        slug: slug.trim(),
        default_branch: defaultBranch.trim(),
        visibility,
      });
      cache.invalidateRepo(repo.id);
      cache.invalidateRepoListings();
      refetch();
      setSaveSuccess("Repository settings saved successfully.");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save repository settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!repo) return;
    if (deleteConfirmName !== repo.name) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await reposApi.deleteRepository(repo.id);
      cache.invalidateRepo(repo.id);
      cache.invalidateRepoListings();
      router.push("/repos");
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete repository.");
      setDeleting(false);
    }
  }

  async function handleAttachmentSave() {
    if (!repo) return;
    setAttachmentSaving(true);
    setAttachmentError(null);
    setAttachmentSuccess(null);
    try {
      if (selectedSpaceId) {
        await reposApi.setRepositoryAttachment(repo.id, { space_id: selectedSpaceId });
      } else {
        await reposApi.removeRepositoryAttachment(repo.id);
      }
      // Binding lives on the repo overview; bust it + the affected space's
      // attachments cache if the repo is (or was) attached.
      cache.invalidateRepo(repo.id, "overview");
      if (repo.attached_space) cache.invalidateSpace(repo.attached_space.id, "attachments");
      cache.invalidateRepoListings();
      refetch();
      setAttachmentSuccess("Space binding updated successfully.");
    } catch (err: unknown) {
      setAttachmentError(err instanceof Error ? err.message : "Failed to update attachment.");
    } finally {
      setAttachmentSaving(false);
    }
  }

  async function handleAddMember() {
    if (!repo || !selectedUser) return;
    setMemberSaving(true);
    setMemberError(null);
    setMemberSuccess(null);
    try {
      await reposApi.upsertRepositoryMember(repo.id, selectedUser.id, candidateRole);
      setSearch("");
      setResults([]);
      setSelectedUser(null);
      setCandidateRole("read");
      setMemberSuccess("Collaborator invited successfully.");
      cache.invalidateRepo(repo.id, "access");
      cache.invalidateRepo(repo.id, "members");
      refetchAccess();
      refetch();
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : "Failed to invite collaborator.");
    } finally {
      setMemberSaving(false);
    }
  }

  async function handleRoleChange(userId: string, role: RepoRole) {
    if (!repo) return;
    try {
      await reposApi.upsertRepositoryMember(repo.id, userId, role);
      cache.invalidateRepo(repo.id, "access");
      cache.invalidateRepo(repo.id, "members");
      refetchAccess();
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to change role.");
    }
  }

  async function handleRemove(userId: string) {
    if (!repo) return;
    try {
      await reposApi.removeRepositoryMember(repo.id, userId);
      cache.invalidateRepo(repo.id, "access");
      cache.invalidateRepo(repo.id, "members");
      refetchAccess();
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove collaborator.");
    }
  }

  if (repoLoading || accessLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!repo) {
    return (
      <EmptyState
        icon={<LockClosedIcon className="w-10 h-10 text-text-disabled" />}
        title="Repo settings unavailable"
        description={error || "You do not have access to this repository."}
      />
    );
  }

  if (!repo.can_manage_general && !repo.can_manage_access && !repo.can_manage_rules) {
    return (
      <EmptyState
        icon={<LockClosedIcon className="w-10 h-10 text-text-disabled" />}
        title="Settings unavailable"
        description="You need repository admin or maintainer access to manage this repo."
      />
    );
  }

  const navItems = [
    { id: "general", label: "General Settings", icon: Cog6ToothIcon },
    { id: "access", label: "Collaborators & Access", icon: UserGroupIcon, badgeCount: collaborators.length },
    { id: "binding", label: "Org / Space Binding", icon: KeyIcon },
    { id: "branches", label: "Branch Protection", icon: ShieldCheckIcon, badgeCount: rules.length },
    { id: "danger", label: "Danger Zone", icon: TrashIcon, isDanger: true },
  ];

  return (
    <div className="space-y-6">
      {/* Repository Settings Header Card */}
      <div className="rounded-2xl border border-border-default bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-surface-hover/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-surface-hover p-2.5 border border-border-strong/50">
                <Cog6ToothIcon className="h-6 w-6 text-text-secondary animate-spin-slow" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary tracking-tight flex flex-wrap items-center gap-2">
                  <span>{repo.name} Settings</span>
                </h1>
                <p className="text-xs text-text-disabled font-mono mt-0.5">ID: {repo.id}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Visibility Badge */}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium border ${
                repo.visibility === "public"
                  ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {repo.visibility === "public" ? <GlobeAltIcon className="w-3.5 h-3.5" /> : <LockClosedIcon className="w-3.5 h-3.5" />}
                <span className="capitalize">{repo.visibility}</span>
              </span>

              {/* Default Branch Badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium bg-surface text-text-secondary border border-border-default font-mono">
                <span className="text-text-disabled">branch:</span>
                {repo.default_branch}
              </span>

              {/* Effective Role Badge */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium border ${
                repo.effective_role === "admin"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : repo.effective_role === "maintain"
                  ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20"
              }`}>
                Effective: <span className="font-semibold capitalize">{repo.effective_role || "No Role"}</span>
              </span>

              {/* Inherited Role Info Badge */}
              {repo.inherited_role && repo.attached_space ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-surface/80 text-text-muted border border-border-default">
                  Inherited via <span className="text-sky-400 font-semibold">{repo.attached_space.name}</span>
                </span>
              ) : null}
            </div>

            {repo.description ? (
              <p className="text-sm text-text-muted max-w-2xl">{repo.description}</p>
            ) : (
              <p className="text-sm text-text-disabled italic">No description provided for this repository.</p>
            )}
          </div>
          
          <div className="flex shrink-0">
            <Link
              href={`/repos/${repo.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border-default bg-surface/60 px-4 py-2.5 text-xs font-semibold text-text-secondary transition-all hover:bg-surface-hover hover:text-text-primary"
            >
              <span>View Repository</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Responsive Sidebar + Content Column */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Sidebar Settings Navigation */}
        <div className="lg:col-span-3 space-y-4">
          {/* Mobile responsive navigation scroll */}
          <div className="block lg:hidden border-b border-border-default pb-1 overflow-x-auto no-scrollbar">
            <div className="flex gap-4 pb-1 whitespace-nowrap">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center gap-2 border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
                      isActive
                        ? item.isDanger
                          ? "border-rose-500 text-rose-400 font-semibold"
                          : "border-[#f78166] text-text-primary font-semibold"
                        : "border-transparent text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label.split(" ")[0]}</span>
                    {item.badgeCount !== undefined && item.badgeCount > 0 ? (
                      <span className="rounded-full bg-surface-hover px-1.5 py-0.5 text-[10px] text-text-muted border border-border-default font-bold">
                        {item.badgeCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex flex-col gap-1 rounded-2xl border border-border-default bg-surface/10 p-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? item.isDanger
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-[#f78166]/10 text-text-primary border border-[#f78166]/20 font-semibold"
                      : item.isDanger
                      ? "text-text-disabled hover:bg-rose-500/5 hover:text-rose-400 border border-transparent"
                      : "text-text-muted hover:bg-surface-hover/40 hover:text-text-secondary border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-5 w-5 ${isActive ? (item.isDanger ? "text-rose-400" : "text-[#f78166]") : "text-text-disabled"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badgeCount !== undefined && item.badgeCount > 0 ? (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isActive
                        ? item.isDanger ? "bg-rose-500/20 text-rose-300" : "bg-[#f78166]/20 text-[#f78166]"
                        : "bg-surface-hover text-text-disabled"
                    }`}>
                      {item.badgeCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Column: Settings Content */}
        <div className="lg:col-span-9">
          {/* GENERAL TAB */}
          {activeTab === "general" && (
            <div className="rounded-2xl border border-border-default bg-surface/20 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-text-primary">General Settings</h2>
                <p className="text-xs text-text-disabled mt-1">Configure your repository metadata, defaults, and visibility states.</p>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {saveError && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-400 flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                    <span>{saveError}</span>
                  </div>
                )}
                {saveSuccess && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 shrink-0" />
                    <span>{saveSuccess}</span>
                  </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-disabled mb-2">Repository Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setSaveError(null);
                        setSaveSuccess(null);
                      }}
                      disabled={!repo.can_manage_general || saving}
                      className="w-full rounded-xl border border-border-default bg-app px-4 py-2.5 text-sm text-text-primary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-focus/35 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-disabled mb-2">URL Slug</label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(event) => {
                        setSlug(event.target.value);
                        setSaveError(null);
                        setSaveSuccess(null);
                      }}
                      disabled={!repo.can_manage_general || saving}
                      className="w-full rounded-xl border border-border-default bg-app px-4 py-2.5 text-sm text-text-primary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-focus/35 disabled:opacity-50 font-mono"
                    />
                    <p className="mt-1.5 text-[11px] text-text-disabled font-mono truncate">
                      URL preview: <span className="text-text-muted">logoutdev.com/repos/{slug || "..."}</span>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-disabled mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      setSaveError(null);
                      setSaveSuccess(null);
                    }}
                    rows={3}
                    disabled={!repo.can_manage_general || saving}
                    className="w-full resize-none rounded-xl border border-border-default bg-app px-4 py-2.5 text-sm text-text-primary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-focus/35 disabled:opacity-50"
                    placeholder="Provide a brief description of the code or project..."
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-disabled mb-2">Default Branch</label>
                    <select
                      value={defaultBranch}
                      onChange={(event) => {
                        setDefaultBranch(event.target.value);
                        setSaveError(null);
                        setSaveSuccess(null);
                      }}
                      disabled={!repo.can_manage_general || branches.length === 0 || saving}
                      className="w-full rounded-xl border border-border-default bg-app px-4 py-2.5 text-sm text-text-primary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-focus/35 disabled:opacity-50"
                    >
                      {branches.length === 0 ? (
                        <option value={defaultBranch}>{defaultBranch}</option>
                      ) : (
                        branches.map((branch) => (
                          <option key={branch.name} value={branch.name}>
                            {branch.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-text-disabled mb-2">Visibility</span>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Private option card */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!repo.can_manage_general) return;
                          setVisibility("private");
                          setSaveError(null);
                          setSaveSuccess(null);
                        }}
                        disabled={!repo.can_manage_general || saving}
                        className={`flex flex-col items-start text-left p-3 rounded-xl border transition-all ${
                          visibility === "private"
                            ? "border-amber-500 bg-amber-500/5 text-amber-100"
                            : "border-border-default bg-app/40 text-text-muted hover:border-border-strong"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 font-semibold text-xs text-text-primary">
                          <LockClosedIcon className={`w-4 h-4 ${visibility === "private" ? "text-amber-400" : "text-text-disabled"}`} />
                          Private
                        </span>
                        <span className="text-[10px] text-text-disabled mt-1 leading-normal">Visible only to explicitly added collaborators.</span>
                      </button>
                      
                      {/* Public option card */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!repo.can_manage_general) return;
                          setVisibility("public");
                          setSaveError(null);
                          setSaveSuccess(null);
                        }}
                        disabled={!repo.can_manage_general || saving}
                        className={`flex flex-col items-start text-left p-3 rounded-xl border transition-all ${
                          visibility === "public"
                            ? "border-sky-500 bg-sky-500/5 text-sky-100"
                            : "border-border-default bg-app/40 text-text-muted hover:border-border-strong"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 font-semibold text-xs text-text-primary">
                          <GlobeAltIcon className={`w-4 h-4 ${visibility === "public" ? "text-sky-400" : "text-text-disabled"}`} />
                          Public
                        </span>
                        <span className="text-[10px] text-text-disabled mt-1 leading-normal">Visible to any user on the platform.</span>
                      </button>
                    </div>
                  </div>
                </div>

                {!repo.can_manage_general && (
                  <div className="flex items-start gap-3 rounded-xl border border-border-default bg-app/40 px-4 py-3 text-xs text-text-disabled">
                    <InformationCircleIcon className="h-5 w-5 text-text-disabled shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-text-muted">Admin access required</p>
                      <p className="mt-0.5">Only repository administrators can change settings like name, slug, visibility, and defaults.</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-border-default/60">
                  <button
                    type="submit"
                    disabled={saving || !repo.can_manage_general || !isGeneralDirty}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary-hover disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" className="text-primary-foreground border-black" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save General Settings</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ACCESS TAB */}
          {activeTab === "access" && (
            <div className="rounded-2xl border border-border-default bg-surface/20 shadow-sm p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-text-primary">Access Management</h2>
                  <p className="text-xs text-text-disabled mt-1">Manage direct invites and review inherited organization permissions.</p>
                </div>
                {/* Metrics Dashboard */}
                <div className="grid grid-cols-3 gap-2 shrink-0">
                  <div className="border border-border-default bg-app/50 rounded-xl px-3 py-2 text-center min-w-[70px]">
                    <span className="block text-lg font-bold text-text-primary font-mono">{metrics.total}</span>
                    <span className="text-[9px] uppercase tracking-wider text-text-disabled">Total</span>
                  </div>
                  <div className="border border-border-default bg-app/50 rounded-xl px-3 py-2 text-center min-w-[70px]">
                    <span className="block text-lg font-bold text-sky-400 font-mono">{metrics.direct}</span>
                    <span className="text-[9px] uppercase tracking-wider text-text-disabled">Direct</span>
                  </div>
                  <div className="border border-border-default bg-app/50 rounded-xl px-3 py-2 text-center min-w-[70px]">
                    <span className="block text-lg font-bold text-emerald-400 font-mono">{metrics.inherited}</span>
                    <span className="text-[9px] uppercase tracking-wider text-text-disabled">Inherited</span>
                  </div>
                </div>
              </div>

              {/* Add Collaborator Card */}
              <div className="rounded-xl border border-border-default bg-app/40 p-4 space-y-4">
                <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <PlusIcon className="w-4 h-4 text-text-muted stroke-[2.5]" />
                  Invite Collaborator
                </h3>

                {memberError && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5 text-xs text-rose-400 flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                    <span>{memberError}</span>
                  </div>
                )}
                {memberSuccess && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 shrink-0" />
                    <span>{memberSuccess}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Search Input Container */}
                  <div className="relative">
                    <input
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setSelectedUser(null);
                        setMemberError(null);
                        setMemberSuccess(null);
                      }}
                      placeholder="Search by username, name, or email..."
                      disabled={!repo.can_manage_access}
                      className="w-full rounded-xl border border-border-default bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-focus/35 disabled:opacity-50"
                    />
                    
                    {searching && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        <Spinner size="sm" />
                      </div>
                    )}

                    {/* Results Dropdown */}
                    {!searching && results.length > 0 && !selectedUser && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-60 overflow-y-auto rounded-xl border border-border-default bg-app p-2 shadow-2xl space-y-1">
                        {results.map((candidate) => (
                          <button
                            key={candidate.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(candidate);
                              setSearch(candidate.username || candidate.email || candidate.name);
                            }}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface"
                          >
                            <div>
                              <p className="text-sm font-semibold text-text-primary">{candidate.name}</p>
                              <p className="text-xs text-text-disabled font-mono">@{candidate.username || candidate.email}</p>
                            </div>
                            {candidate.effective_role && (
                              <span className="rounded bg-surface-hover px-2 py-0.5 text-[10px] font-semibold text-text-muted capitalize">
                                {candidate.effective_role}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Indicator */}
                  {selectedUser && (
                    <div className="flex items-center justify-between rounded-xl border border-border-default bg-app/80 p-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={{ id: selectedUser.id, name: selectedUser.name, email: selectedUser.email }} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{selectedUser.name}</p>
                          <p className="text-xs text-text-disabled font-mono">@{selectedUser.username || selectedUser.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(null);
                          setSearch("");
                        }}
                        className="rounded-lg p-1.5 text-text-disabled hover:bg-surface hover:text-text-secondary"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Role and Submit Button Row */}
                  <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
                    <div className="rounded-xl border border-border-default bg-app/50 px-4 py-2.5 text-xs text-text-disabled flex items-center">
                      {selectedUser 
                        ? `Target: ${selectedUser.name} (@${selectedUser.username || selectedUser.email})`
                        : "Select a user from the search dropdown results above"}
                    </div>
                    <select
                      value={candidateRole}
                      onChange={(event) => setCandidateRole(event.target.value as RepoRole)}
                      disabled={!repo.can_manage_access}
                      className="rounded-xl border border-border-default bg-surface px-3 py-2.5 text-sm text-text-primary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-focus/35 disabled:opacity-50"
                    >
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>
                          {role.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      disabled={!selectedUser || memberSaving || !repo.can_manage_access}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary-hover disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {memberSaving ? (
                        <>
                          <Spinner size="sm" className="text-primary-foreground border-black" />
                          <span>Inviting...</span>
                        </>
                      ) : (
                        <span>Send Invite</span>
                      )}
                    </button>
                  </div>

                  {/* Role Meanings Tooltip row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-text-disabled bg-app/20 p-2.5 rounded-lg border border-border-default/40">
                    <div><span className="font-semibold text-text-muted">READ:</span> View repo codebase & PRs.</div>
                    <div><span className="font-semibold text-text-muted">TRIAGE:</span> Manage issues & reviews.</div>
                    <div><span className="font-semibold text-text-muted">WRITE:</span> Read, triage, & push code.</div>
                    <div><span className="font-semibold text-text-muted">MAINTAIN:</span> Modify branch protection.</div>
                  </div>
                </div>
              </div>

              {/* Collaborator List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Collaborators List</h3>
                {collaborators.length === 0 ? (
                  <div className="border border-border-default border-dashed rounded-xl p-8 text-center text-text-disabled text-sm">
                    No collaborators found. Ensure Space binding is active to inherit organization members.
                  </div>
                ) : (
                  <div className="divide-y divide-border-default/60 rounded-xl border border-border-default bg-app/20 overflow-hidden">
                    {collaborators.map((member) => (
                      <div key={member.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 hover:bg-zinc-905/10 transition-colors">
                        {/* Identity */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <Avatar user={member.user ? { id: member.user_id, name: member.user.name, email: member.user.email } : null} size="md" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-text-primary truncate">{member.user?.name ?? member.user_id}</span>
                              {member.status === "pending" && (
                                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-semibold text-amber-400 uppercase tracking-wide">
                                  Pending Invite
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-disabled font-mono truncate">@{member.user?.username || member.user?.email || member.user_id}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {/* Source badge */}
                              <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                member.source === "space_owner" || member.source === "repo_owner"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-surface-hover text-text-muted border-border-strong"
                              }`}>
                                {member.source?.replaceAll("_", " ") || "collaborator"}
                              </span>
                              {member.is_outside_collaborator && (
                                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-hover text-text-muted border border-border-strong">
                                  Outside Collaborator
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Access metrics display */}
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="rounded-xl border border-border-default bg-app/70 px-3.5 py-2 text-xs text-text-muted flex flex-col justify-center min-w-[170px] shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-text-disabled uppercase tracking-wider">Effective:</span>
                              <span className="font-bold text-text-primary uppercase text-[11px]">{member.effective_role || "none"}</span>
                            </div>
                            <div className="text-[9px] text-text-disabled mt-1 flex justify-between gap-3 border-t border-border-default pt-1 font-mono">
                              <span>Direct: {member.direct_role || "none"}</span>
                              <span>Inherited: {member.inherited_role || "none"}</span>
                            </div>
                          </div>

                          {/* Control actions */}
                          {member.direct_role ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={member.direct_role}
                                onChange={(event) => handleRoleChange(member.user_id, event.target.value as RepoRole)}
                                disabled={!repo.can_manage_access}
                                className="rounded-lg border border-border-default bg-surface px-2 py-2 text-xs text-text-primary focus:border-border-strong focus:outline-none disabled:opacity-60 font-medium"
                              >
                                {availableRoles.map((role) => (
                                  <option key={role} value={role}>
                                    {role.toUpperCase()}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleRemove(member.user_id)}
                                disabled={!repo.can_manage_access}
                                className="inline-flex items-center gap-1 rounded-lg border border-border-default px-2.5 py-2 text-xs text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-50 font-bold"
                              >
                                <TrashIcon className="h-4 w-4" />
                                <span>Remove</span>
                              </button>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-border-default bg-app/30 px-3 py-2 text-[11px] text-text-disabled max-w-[240px] leading-relaxed shadow-sm">
                              <span>This access comes from the attached Space and cannot be removed here.</span>
                              {repo.attached_space && (
                                <div className="mt-1">
                                  <Link
                                    href={`/spaces/${repo.attached_space.id}/manage`}
                                    className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                                  >
                                    <span>Manage Space Members</span>
                                    <ArrowRightIcon className="h-3 w-3 stroke-[2.5]" />
                                  </Link>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Explanatory Info Card */}
              <div className="rounded-xl border border-border-default/60 bg-surface/10 p-4 text-xs text-text-muted space-y-2">
                <div className="flex items-center gap-2 text-text-secondary font-semibold">
                  <InformationCircleIcon className="h-4 w-4 text-text-disabled" />
                  <span>How effective permissions are computed</span>
                </div>
                <p className="leading-relaxed">
                  Personal repository owners automatically inherit Admin control. When attached to a Space, Space Owners inherit Admin access, and Space Maintainers inherit Maintain access. Direct collaborators can be invited outside of the Space layer. The system evaluates all roles and grants the highest permission level available.
                </p>
              </div>
            </div>
          )}

          {/* SPACE BINDING TAB */}
          {activeTab === "binding" && (
            <div className="rounded-2xl border border-border-default bg-surface/20 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-text-primary">Space Binding</h2>
                <p className="text-xs text-text-disabled mt-1">Bind this repository to a space. Spaces provide team organization and permissions inheritance.</p>
              </div>

              {attachmentError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-400 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                  <span>{attachmentError}</span>
                </div>
              )}
              {attachmentSuccess && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 shrink-0" />
                  <span>{attachmentSuccess}</span>
                </div>
              )}

              {/* Visual Connector Layout */}
              <div className="flex flex-col items-center justify-center p-8 border border-border-default/80 bg-app/30 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between w-full max-w-md gap-4 relative">
                  {/* Dotted Connection line */}
                  <div className="absolute left-1/4 right-1/4 top-1/2 border-t border-dashed border-border-default -translate-y-1/2 z-0"></div>
                  
                  {/* Repo Box */}
                  <div className="flex flex-col items-center p-4 rounded-xl border border-border-default bg-surface z-10 w-32 text-center shadow-lg">
                    <div className="rounded-full bg-surface-hover p-2 text-text-muted mb-2 border border-border-default">
                      <Cog6ToothIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-text-primary truncate max-w-full">{repo.name}</span>
                    <span className="text-[9px] text-text-disabled uppercase tracking-wider mt-1">Repo</span>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="rounded-full bg-surface border border-border-default px-3 py-1 text-[10px] font-semibold text-text-secondary z-10 shadow-sm flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5 text-text-disabled" />
                    <span>{repo.attached_space ? "Bound" : "Unattached"}</span>
                  </div>

                  {/* Space Box */}
                  <div className={`flex flex-col items-center p-4 rounded-xl border z-10 w-32 text-center shadow-lg transition-colors ${
                    repo.attached_space 
                      ? "border-sky-500/20 bg-sky-950/20 text-sky-200" 
                      : "border-border-default border-dashed bg-surface/30 text-text-disabled"
                  }`}>
                    <div className={`rounded-full p-2 mb-2 border ${repo.attached_space ? "bg-sky-900/50 text-sky-400 border-sky-800/40" : "bg-surface-hover/30 text-text-disabled border-border-default"}`}>
                      <UserGroupIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold truncate max-w-full">
                      {repo.attached_space ? repo.attached_space.name : "Unbound"}
                    </span>
                    <span className="text-[9px] text-text-disabled uppercase tracking-wider mt-1">Space Layer</span>
                  </div>
                </div>
              </div>

              {/* Selection & Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-disabled mb-2">Attached space Layer</label>
                  <select
                    value={selectedSpaceId}
                    onChange={(event) => {
                      setSelectedSpaceId(event.target.value);
                      setAttachmentError(null);
                      setAttachmentSuccess(null);
                    }}
                    disabled={spacesLoading || attachmentSaving || !repo.can_manage_general}
                    className="w-full rounded-xl border border-border-default bg-app px-4 py-2.5 text-sm text-text-primary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-focus/35 disabled:opacity-50"
                  >
                    <option value="">No attached space (Standalone Repository)</option>
                    {spacesLoading && <option value="" disabled>Loading available spaces...</option>}
                    {!spacesLoading && spaces.length === 0 && <option value="" disabled>No spaces found in your profile</option>}
                    {spaces.map((space) => (
                      <option key={space.id} value={space.id}>
                        {space.name}
                      </option>
                    ))}
                  </select>
                  {spacesError && <p className="text-xs text-rose-400 mt-1">{spacesError}</p>}
                </div>

                {/* Explanation details */}
                <div className="p-4 rounded-xl border border-border-default bg-app/30 text-xs text-text-muted space-y-2">
                  <p className="font-semibold text-text-secondary">Organization Space Integration</p>
                  <p className="leading-relaxed">
                    Spaces are LogoutDev's organization boundary. Attaching a repository to a Space transfers permissions control to that Space's owner and maintainer lists:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-text-disabled pl-2">
                    <li>Space Owners automatically obtain full administrator options.</li>
                    <li>Space Maintainers inherit write access and branch-protection options.</li>
                    <li>Removing a Space binding revokes these inherited access roles immediately.</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-border-default/60">
                  <div>
                    {repo.attached_space ? (
                      <Link
                        href={`/spaces/${repo.attached_space.id}/repos`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300"
                      >
                        <span>Open Space Repository Home</span>
                        <ArrowRightIcon className="h-3.5 w-3.5 stroke-[2.5]" />
                      </Link>
                    ) : (
                      <span className="text-xs text-text-disabled italic">Repository is not attached to any space layer.</span>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAttachmentSave}
                    disabled={spacesLoading || attachmentSaving || !repo.can_manage_general || !isAttachmentDirty}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary-hover disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {attachmentSaving ? (
                      <>
                        <Spinner size="sm" className="text-primary-foreground border-black" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Space Binding</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BRANCH RULES TAB */}
          {activeTab === "branches" && (
            <div className="rounded-2xl border border-border-default bg-surface/20 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-text-primary">Branch Rules</h2>
                <p className="text-xs text-text-disabled mt-1">Configure protection rules to safeguard production branch history and verify quality checks.</p>
              </div>

              <div className="rounded-xl border border-border-default bg-app/40 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider text-text-muted">Branch protection status</h3>
                    <p className="text-[11px] text-text-disabled">Active configuration rules for protected branch references.</p>
                  </div>
                  <span className="rounded-full bg-surface border border-border-default px-3 py-1 text-xs font-mono font-bold text-text-muted">
                    {rulesLoading ? "..." : `${rules.length} Rules Active`}
                  </span>
                </div>

                {rulesLoading ? (
                  <div className="py-8 flex justify-center">
                    <Spinner />
                  </div>
                ) : rules.length === 0 ? (
                  <div className="border border-border-default border-dashed rounded-xl p-6 text-center text-text-disabled text-xs">
                    No active rules found. Branch pushes can be made directly by any collaborator with write access.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-border-default bg-surface/30">
                      <CheckCircleIcon className={`h-4 w-4 ${rulesSummary?.requirePr ? "text-emerald-400" : "text-text-disabled"}`} />
                      <span className={rulesSummary?.requirePr ? "text-text-secondary font-medium" : "text-text-disabled"}>Pull Request Requirement</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-border-default bg-surface/30">
                      <CheckCircleIcon className={`h-4 w-4 ${rulesSummary?.requireApprovals ? "text-emerald-400" : "text-text-disabled"}`} />
                      <span className={rulesSummary?.requireApprovals ? "text-text-secondary font-medium" : "text-text-disabled"}>Approvals review count</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-border-default bg-surface/30">
                      <CheckCircleIcon className={`h-4 w-4 ${rulesSummary?.requireStatusChecks ? "text-emerald-400" : "text-text-disabled"}`} />
                      <span className={rulesSummary?.requireStatusChecks ? "text-text-secondary font-medium" : "text-text-disabled"}>Status checks context verification</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-border-default bg-surface/30">
                      <CheckCircleIcon className={`h-4 w-4 ${rulesSummary?.allowForcePush ? "text-emerald-400" : "text-text-disabled"}`} />
                      <span className={rulesSummary?.allowForcePush ? "text-text-secondary font-medium" : "text-text-disabled"}>Blocks forced branch push</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-border-default/60">
                  <Link
                    href={`/repos/${repo.id}/settings/branches`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary-hover"
                  >
                    <span>Manage Branch Protection Rules</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* DANGER ZONE TAB */}
          {activeTab === "danger" && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-950/5 overflow-hidden shadow-lg p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 stroke-[2] text-rose-400" />
                  <span>Danger Zone Actions</span>
                </h2>
                <p className="text-xs text-rose-350/70 mt-1">Destructive actions can affect your repositories irreversibly. Verify constraints before executing.</p>
              </div>

              {deleteError && (
                <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-xs text-rose-400 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="rounded-xl border border-rose-500/10 bg-rose-950/20 p-5 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-rose-200">Delete this repository</h3>
                  <p className="text-xs text-rose-400/60 mt-1 leading-normal">
                    This permanently deletes the repo record, branch history, releases, discussions, stars, collaborators, and forks. This action is irreversible.
                  </p>
                </div>

                {/* Grouped lists of deletion impact */}
                <div className="grid gap-4 md:grid-cols-2 text-xs">
                  <div className="p-3.5 rounded-xl border border-rose-500/10 bg-rose-950/25 space-y-1.5 text-rose-300">
                    <p className="font-bold">What will be permanently deleted:</p>
                    <ul className="list-disc list-inside space-y-1 text-rose-400/70">
                      <li>Git repository storage and history</li>
                      <li>Releases & tag data</li>
                      <li>Pull requests & discussion feeds</li>
                      <li>Stars, watchers, & custom roles</li>
                    </ul>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border-default bg-surface/10 space-y-1.5 text-text-muted">
                    <p className="font-bold text-text-secondary">What will remain:</p>
                    <ul className="list-disc list-inside space-y-1 text-text-disabled">
                      <li>Space work planning updates</li>
                      <li>Discussion posts outside this repository</li>
                    </ul>
                  </div>
                </div>

                {/* Input verification */}
                {repo.can_delete ? (
                  <div className="space-y-3 pt-3 border-t border-rose-500/10">
                    <label className="block text-xs font-semibold text-text-muted">
                      To confirm deletion, please type <span className="font-mono text-text-primary bg-surface px-1.5 py-0.5 rounded border border-border-default">{repo.name}</span>:
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={deleteConfirmName}
                        onChange={(event) => {
                          setDeleteConfirmName(event.target.value);
                          setDeleteError(null);
                        }}
                        placeholder={`Type "${repo.name}"`}
                        disabled={deleting}
                        className="flex-1 rounded-xl border border-border-default bg-app px-4 py-2.5 text-sm text-text-primary focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:opacity-50 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting || deleteConfirmName !== repo.name}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-2.5 text-xs font-bold text-rose-300 transition-all hover:bg-rose-500/20 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {deleting ? (
                          <>
                            <Spinner size="sm" className="text-rose-400 border-rose-400" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <TrashIcon className="h-4 w-4" />
                            <span>Delete Repository</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-border-default bg-surface/25 text-xs text-text-disabled pl-3">
                    Only the repository owner can delete this repository.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
