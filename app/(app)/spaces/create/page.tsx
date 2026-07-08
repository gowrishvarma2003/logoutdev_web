"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, PlusIcon, RocketIcon } from "@/components/ui/Icons";
import Link from "next/link";
import * as api from "@/lib/services/spacesApi";
import * as cache from "@/lib/services/requestCache";
import type { SpaceStatus, SpaceVisibility, StackCategory, StackMaturity } from "@/lib/types";

const STATUS_OPTIONS: Array<{ value: SpaceStatus; label: string; desc: string }> = [
  { value: "idea",     label: "Idea",     desc: "Just an idea — looking for feedback" },
  { value: "building", label: "Building", desc: "Active development in progress" },
  { value: "shipping", label: "Shipping", desc: "Live and available to users" },
];

const CATEGORY_OPTIONS: StackCategory[] = [
  "frontend", "backend", "database", "infra", "tooling", "other",
];

interface StackRow {
  category: StackCategory;
  technology: string;
  maturity: StackMaturity;
}

/**
 * /spaces/create — Multi-section form to create a new project space.
 */
export default function CreateSpacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Basic info
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<SpaceStatus>("idea");
  const [visibility, setVisibility] = useState<SpaceVisibility>("public");
  const [repoUrl, setRepoUrl] = useState("");
  const [workingInPublic, setWorkingInPublic] = useState(true);
  const [currentFocus, setCurrentFocus] = useState("");
  const [openRoles, setOpenRoles] = useState("");
  const [neededSkills, setNeededSkills] = useState("");
  const [contributionGuide, setContributionGuide] = useState("");
  const [responseSla, setResponseSla] = useState("");

  // Stack
  const [stack, setStack] = useState<StackRow[]>([]);
  const [newTech, setNewTech] = useState("");
  const [newCat, setNewCat] = useState<StackCategory>("backend");
  const [newMaturity, setNewMaturity] = useState<StackMaturity>("in-use");

  function addStackItem() {
    const tech = newTech.trim();
    if (!tech) return;
    setStack((prev) => [...prev, { category: newCat, technology: tech, maturity: newMaturity }]);
    setNewTech("");
  }

  function removeStackItem(index: number) {
    setStack((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !summary.trim() || description.trim().length < 20) {
      setError("Name, summary, and description (at least 20 characters) are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { space } = await api.createSpace({
        name: name.trim(),
        summary: summary.trim(),
        description: description.trim(),
        status,
        visibility,
        working_in_public: workingInPublic,
        current_focus: currentFocus.trim() || undefined,
        open_roles: openRoles.split(",").map((item) => item.trim()).filter(Boolean),
        needed_skills: neededSkills.split(",").map((item) => item.trim()).filter(Boolean),
        contribution_guide: contributionGuide.trim() || undefined,
        response_sla: responseSla.trim() || undefined,
      });

      // Add stack if any
      if (stack.length > 0) {
        await api.replaceStack(space.id, stack);
      }

      if (repoUrl.trim()) {
        await api.createAttachment(space.id, {
          external_url: repoUrl.trim(),
          label: "Project repo",
          is_primary: true,
        });
      }

      // A new space changes the listings; bust them so /spaces is fresh.
      cache.invalidateSpaceListings();
      router.push(`/spaces/${space.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create space");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-app/80 backdrop-blur-md border-b border-border-default px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/spaces" className="text-text-disabled hover:text-text-secondary transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-text-primary">Create Space</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-6">
        {/* ── Section 1: Basic Info ────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Project Info</h2>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-muted mb-1.5">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DevBoard"
              maxLength={120}
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-default text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-focus/35 transition-colors"
            />
          </div>

          {/* Summary */}
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-text-muted mb-1.5">
              Summary <span className="text-rose-400">*</span>
            </label>
            <input
              id="summary"
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One-line description of your project"
              maxLength={300}
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-default text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-focus/35 transition-colors"
            />
            <p className="text-[11px] text-text-disabled mt-1">{summary.length}/300</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text-muted mb-1.5">
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goals, target users, what problem you're solving… (min 20 chars)"
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-default text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-focus/35 transition-colors resize-none"
            />
            <p className="text-[11px] text-text-disabled mt-1">{description.length} chars (min 20)</p>
          </div>

          {/* Repo URL */}
          <div>
            <label htmlFor="repo" className="block text-sm font-medium text-text-muted mb-1.5">
              External Repo Or Docs Link
            </label>
            <input
              id="repo"
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-default text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-focus/35 transition-colors"
            />
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-border-default bg-surface px-3 py-2.5 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={workingInPublic}
              onChange={(e) => setWorkingInPublic(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong bg-app"
            />
            This project is working in public
          </label>
          <input
            type="text"
            value={currentFocus}
            onChange={(e) => setCurrentFocus(e.target.value)}
            placeholder="Current focus, like shipping onboarding or stabilizing API"
            className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-default text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-focus/35 transition-colors"
          />
        </section>

        {/* ── Section 2: Status & Visibility ──────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Status & Visibility</h2>

          {/* Status cards */}
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  status === opt.value
                    ? "border-white bg-surface-hover"
                    : "border-border-default bg-surface hover:border-border-strong"
                }`}
              >
                <p className={`text-sm font-semibold ${status === opt.value ? "text-text-primary" : "text-text-muted"}`}>
                  {opt.label}
                </p>
                <p className="text-[11px] text-text-disabled mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>

          {/* Visibility toggle */}
          <div className="flex gap-2">
            {(["public", "private"] as SpaceVisibility[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  visibility === v
                    ? "border-white bg-surface-hover text-text-primary"
                    : "border-border-default bg-surface text-text-muted hover:border-border-strong"
                }`}
              >
                {v === "public" ? "🌐 Public" : "🔒 Private"}
              </button>
            ))}
          </div>
        </section>

        {/* ── Section 3: Tech Stack ───────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Tech Stack</h2>

          {/* Stack list */}
          {stack.length > 0 && (
            <div className="space-y-1.5">
              {stack.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface border border-border-default"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-text-disabled uppercase w-16">
                      {item.category}
                    </span>
                    <span className="text-sm text-text-primary font-medium">
                      {item.technology}
                    </span>
                    <span className="text-[11px] text-text-disabled">
                      ({item.maturity})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStackItem(i)}
                    className="text-text-disabled hover:text-rose-400 transition-colors text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add stack item */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={newCat}
              onChange={(e) => setNewCat(e.target.value as StackCategory)}
              className="px-2.5 py-2 rounded-lg bg-surface border border-border-default text-sm text-text-primary focus:outline-none focus:border-border-strong"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
              placeholder="Technology name"
              className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-surface border border-border-default text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-strong"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addStackItem();
                }
              }}
            />
            <select
              value={newMaturity}
              onChange={(e) => setNewMaturity(e.target.value as StackMaturity)}
              className="px-2.5 py-2 rounded-lg bg-surface border border-border-default text-sm text-text-primary focus:outline-none focus:border-border-strong"
            >
              <option value="in-use">In Use</option>
              <option value="planned">Planned</option>
              <option value="deprecated">Deprecated</option>
            </select>
            <button
              type="button"
              onClick={addStackItem}
              className="px-3 py-2 rounded-lg bg-surface-hover text-sm text-text-primary font-medium hover:bg-surface-active transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Collaboration Profile</h2>

          <input
            type="text"
            value={openRoles}
            onChange={(e) => setOpenRoles(e.target.value)}
            placeholder="Open roles, comma separated"
            className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-default text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-focus/35 transition-colors"
          />

          <input
            type="text"
            value={neededSkills}
            onChange={(e) => setNeededSkills(e.target.value)}
            placeholder="Needed skills, comma separated"
            className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-default text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-focus/35 transition-colors"
          />

          <textarea
            value={contributionGuide}
            onChange={(e) => setContributionGuide(e.target.value)}
            placeholder="How should people contribute? What do you expect from collaborators?"
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-default text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-focus/35 transition-colors resize-none"
          />

          <input
            type="text"
            value={responseSla}
            onChange={(e) => setResponseSla(e.target.value)}
            placeholder="Expected response time, like within 48 hours"
            className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-default text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-focus/35 transition-colors"
          />
        </section>

        {/* ── Error message ───────────────────────────────────────────────── */}
        {error && (
          <p className="text-sm text-rose-400 bg-rose-500/10 px-4 py-2.5 rounded-xl">
            {error}
          </p>
        )}

        {/* ── Submit ──────────────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>Creating…</>
          ) : (
            <>
              <RocketIcon className="w-4 h-4" />
              Launch Space
            </>
          )}
        </button>
      </form>
    </div>
  );
}
