"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/ui/Icons";
import type { QuestionListFilters } from "@/lib/services/questionsApi";

const ROLE_OPTIONS = [
  "frontend", "backend", "fullstack", "mobile", "devops",
  "data", "ai-ml", "security", "qa", "product", "design", "career",
];

function parseCsv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export default function QuestionFilters({
  filters,
  onChange,
  isAuthenticated,
}: {
  filters: QuestionListFilters;
  onChange: (patch: Partial<QuestionListFilters>) => void;
  isAuthenticated: boolean;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters =
    Boolean(filters.type) ||
    Boolean(filters.status) ||
    (filters.sort || "active") !== "active" ||
    (filters.role && filters.role.length > 0) ||
    (filters.stack && filters.stack.length > 0) ||
    (filters.topic && filters.topic.length > 0);

  const activeCount =
    (filters.type ? 1 : 0) +
    (filters.status ? 1 : 0) +
    ((filters.sort || "active") !== "active" ? 1 : 0) +
    (filters.role && filters.role.length > 0 ? 1 : 0) +
    (filters.stack && filters.stack.length > 0 ? 1 : 0) +
    (filters.topic && filters.topic.length > 0 ? 1 : 0);

  return (
    <div className="border-b border-border-default/60 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Filters dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
              hasActiveFilters
                ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                : "border-border-default bg-surface/40 text-text-muted hover:text-text-secondary"
            }`}
          >
            Filters
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-text-primary">
                {activeCount}
              </span>
            )}
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>

          {filtersOpen && (
            <>
              <div className="fixed inset-0 z-10 cursor-pointer" onClick={() => setFiltersOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-xl border border-border-strong bg-surface p-4 shadow-xl">
                <div className="space-y-4">
                  {/* Row 1: Type + Status + Sort */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-text-disabled">Type</label>
                      <select
                        value={filters.type ?? ""}
                        onChange={(e) => onChange({ type: (e.target.value as QuestionListFilters["type"]) || "" })}
                        aria-label="Question type"
                        className="w-full rounded-lg border border-border-strong bg-surface-hover px-2 py-2 text-sm text-text-primary outline-none focus:border-border-strong"
                      >
                        <option value="">All</option>
                        <option value="open">Open</option>
                        <option value="mcq">MCQ</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-text-disabled">Status</label>
                      <select
                        value={filters.status ?? ""}
                        onChange={(e) => onChange({ status: (e.target.value as QuestionListFilters["status"]) || "" })}
                        aria-label="Question status"
                        className="w-full rounded-lg border border-border-strong bg-surface-hover px-2 py-2 text-sm text-text-primary outline-none focus:border-border-strong"
                      >
                        <option value="">All</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-text-disabled">Sort</label>
                      <select
                        value={filters.sort ?? "active"}
                        onChange={(e) => onChange({ sort: e.target.value as QuestionListFilters["sort"] })}
                        aria-label="Sort questions"
                        className="w-full rounded-lg border border-border-strong bg-surface-hover px-2 py-2 text-sm text-text-primary outline-none focus:border-border-strong"
                      >
                        <option value="active">Active</option>
                        <option value="newest">Newest</option>
                        <option value="unanswered">Unanswered</option>
                        <option value="top">Top</option>
                      </select>
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-text-disabled">Role</label>
                    <select
                      value={filters.role?.[0] ?? ""}
                      onChange={(e) => onChange({ role: e.target.value ? [e.target.value] : [] })}
                      aria-label="Filter by role"
                      className="w-full rounded-lg border border-border-strong bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none focus:border-border-strong"
                    >
                      <option value="">Any role</option>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  {/* Stack tags */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-text-disabled">Stack Tags</label>
                    <input
                      value={(filters.stack ?? []).join(",")}
                      onChange={(e) => onChange({ stack: parseCsv(e.target.value) })}
                      placeholder="react,nodejs"
                      aria-label="Filter by stack tags"
                      className="w-full rounded-lg border border-border-strong bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-disabled focus:border-border-strong"
                    />
                  </div>

                  {/* Topic tags */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-text-disabled">Topic Tags</label>
                    <input
                      value={(filters.topic ?? []).join(",")}
                      onChange={(e) => onChange({ topic: parseCsv(e.target.value) })}
                      placeholder="testing,interview"
                      aria-label="Filter by topic tags"
                      className="w-full rounded-lg border border-border-strong bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-disabled focus:border-border-strong"
                    />
                  </div>

                  {/* Clear */}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ type: "", status: "", sort: "active", role: [], stack: [], topic: [] });
                      }}
                      className="w-full rounded-lg border border-border-strong py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text-secondary"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Needs my answer — stays inline */}
        {isAuthenticated && (
          <label className="inline-flex items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={Boolean(filters.needs_my_answer)}
              onChange={(e) => onChange({ needs_my_answer: e.target.checked })}
              className="h-4 w-4 rounded border-border-strong bg-surface text-text-primary"
            />
            Needs my answer
          </label>
        )}
      </div>
    </div>
  );
}
