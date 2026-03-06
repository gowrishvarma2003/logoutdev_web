"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, PlusIcon, RocketIcon } from "@/components/ui/Icons";
import Link from "next/link";
import * as api from "@/lib/services/spacesApi";
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
        primary_repo_url: repoUrl.trim() || undefined,
      });

      // Add stack if any
      if (stack.length > 0) {
        await api.replaceStack(space.id, stack);
      }

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
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/spaces" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-white">Create Space</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-6">
        {/* ── Section 1: Basic Info ────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Project Info</h2>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-1.5">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DevBoard"
              maxLength={120}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-colors"
            />
          </div>

          {/* Summary */}
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-zinc-400 mb-1.5">
              Summary <span className="text-rose-400">*</span>
            </label>
            <input
              id="summary"
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One-line description of your project"
              maxLength={300}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-colors"
            />
            <p className="text-[11px] text-zinc-600 mt-1">{summary.length}/300</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-400 mb-1.5">
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goals, target users, what problem you're solving… (min 20 chars)"
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-colors resize-none"
            />
            <p className="text-[11px] text-zinc-600 mt-1">{description.length} chars (min 20)</p>
          </div>

          {/* Repo URL */}
          <div>
            <label htmlFor="repo" className="block text-sm font-medium text-zinc-400 mb-1.5">
              Repository URL
            </label>
            <input
              id="repo"
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-colors"
            />
          </div>
        </section>

        {/* ── Section 2: Status & Visibility ──────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Status & Visibility</h2>

          {/* Status cards */}
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  status === opt.value
                    ? "border-white bg-zinc-800"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <p className={`text-sm font-semibold ${status === opt.value ? "text-white" : "text-zinc-400"}`}>
                  {opt.label}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{opt.desc}</p>
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
                    ? "border-white bg-zinc-800 text-white"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {v === "public" ? "🌐 Public" : "🔒 Private"}
              </button>
            ))}
          </div>
        </section>

        {/* ── Section 3: Tech Stack ───────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Tech Stack</h2>

          {/* Stack list */}
          {stack.length > 0 && (
            <div className="space-y-1.5">
              {stack.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-zinc-500 uppercase w-16">
                      {item.category}
                    </span>
                    <span className="text-sm text-white font-medium">
                      {item.technology}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      ({item.maturity})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStackItem(i)}
                    className="text-zinc-600 hover:text-rose-400 transition-colors text-xs"
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
              className="px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-600"
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
              className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
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
              className="px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-600"
            >
              <option value="in-use">In Use</option>
              <option value="planned">Planned</option>
              <option value="deprecated">Deprecated</option>
            </select>
            <button
              type="button"
              onClick={addStackItem}
              className="px-3 py-2 rounded-lg bg-zinc-800 text-sm text-white font-medium hover:bg-zinc-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
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
          className="w-full py-3 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
