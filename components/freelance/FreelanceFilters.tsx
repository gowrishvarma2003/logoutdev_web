"use client";

import { useState } from "react";
import { SearchIcon, ChevronDownIcon } from "@/components/ui/Icons";

interface FreelanceFiltersProps {
  q: string;
  onQChange: (value: string) => void;
  skill: string;
  onSkillChange: (value: string) => void;
  pricingModel: string;
  onPricingModelChange: (value: string) => void;
  engagementType: string;
  onEngagementTypeChange: (value: string) => void;
}

const PRICING_OPTIONS = [
  { value: "", label: "Any pricing" },
  { value: "fixed", label: "Fixed budget" },
  { value: "hourly", label: "Hourly" },
];

const ENGAGEMENT_OPTIONS = [
  { value: "", label: "Any engagement" },
  { value: "one_time", label: "One-time" },
  { value: "ongoing", label: "Ongoing" },
];

export default function FreelanceFilters({
  q,
  onQChange,
  skill,
  onSkillChange,
  pricingModel,
  onPricingModelChange,
  engagementType,
  onEngagementTypeChange,
}: FreelanceFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasActiveFilters = skill.trim().length > 0 || pricingModel !== "" || engagementType !== "";
  const activeCount = (skill.trim().length > 0 ? 1 : 0) + (pricingModel ? 1 : 0) + (engagementType ? 1 : 0);

  return (
    <div className="border-b border-zinc-800/60 px-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder="Search by title, scope, or deliverable"
            aria-label="Search freelance projects"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:bg-zinc-900/60 focus:outline-none transition-colors"
          />
        </div>

        {/* Filters dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
              hasActiveFilters
                ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Filters
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>

          {filtersOpen && (
            <>
              <div className="fixed inset-0 z-10 cursor-pointer" onClick={() => setFiltersOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
                <div className="space-y-4">
                  {/* Skill filter */}
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Skill
                    </label>
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => onSkillChange(e.target.value)}
                      placeholder="e.g. React, Node..."
                      aria-label="Filter by skill"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
                    />
                  </div>

                  {/* Pricing */}
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Pricing
                    </label>
                    <div className="flex flex-col gap-1">
                      {PRICING_OPTIONS.map((option) => (
                        <button
                          key={option.value || "any"}
                          type="button"
                          onClick={() => onPricingModelChange(option.value)}
                          className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            pricingModel === option.value
                              ? "bg-zinc-800 text-white"
                              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Engagement */}
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Engagement
                    </label>
                    <div className="flex flex-col gap-1">
                      {ENGAGEMENT_OPTIONS.map((option) => (
                        <button
                          key={option.value || "any"}
                          type="button"
                          onClick={() => onEngagementTypeChange(option.value)}
                          className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            engagementType === option.value
                              ? "bg-zinc-800 text-white"
                              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear */}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        onSkillChange("");
                        onPricingModelChange("");
                        onEngagementTypeChange("");
                      }}
                      className="w-full rounded-lg border border-zinc-700 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
