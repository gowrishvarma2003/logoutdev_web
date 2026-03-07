"use client";

import Link from "next/link";
import { SearchIcon, PlusIcon } from "@/components/ui/Icons";

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
  return (
    <div className="space-y-3 border-b border-zinc-800 px-4 pb-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Freelance Projects</h2>
          <p className="text-sm text-zinc-500">Find clients, bids, and delivery workspaces.</p>
        </div>
        <Link
          href="/freelance/create"
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
        >
          <PlusIcon className="h-4 w-4" />
          Post Project
        </Link>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search by title, scope, or deliverable"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <input
          type="text"
          value={skill}
          onChange={(e) => onSkillChange(e.target.value)}
          placeholder="Skill, e.g. React"
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
        <select
          value={pricingModel}
          onChange={(e) => onPricingModelChange(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
        >
          <option value="">Any pricing</option>
          <option value="fixed">Fixed budget</option>
          <option value="hourly">Hourly</option>
        </select>
        <select
          value={engagementType}
          onChange={(e) => onEngagementTypeChange(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
        >
          <option value="">Any engagement</option>
          <option value="one_time">One-time</option>
          <option value="ongoing">Ongoing</option>
        </select>
      </div>
    </div>
  );
}
