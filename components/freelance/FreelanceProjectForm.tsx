"use client";

import { useEffect, useState } from "react";
import type {
  FreelanceEngagementType,
  FreelanceExperienceLevel,
  FreelanceLocationMode,
  FreelancePricingModel,
  FreelanceProject,
} from "@/lib/types";

interface FreelanceProjectFormProps {
  initialProject?: Partial<FreelanceProject> | null;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (payload: {
    title: string;
    summary: string;
    description: string;
    pricing_model: FreelancePricingModel;
    budget_min_cents: number;
    budget_max_cents: number;
    experience_level: FreelanceExperienceLevel;
    engagement_type: FreelanceEngagementType;
    duration_weeks: number | null;
    location_mode: FreelanceLocationMode;
    timezone_note: string;
    skills: string[];
  }) => Promise<void> | void;
}

export default function FreelanceProjectForm({
  initialProject,
  submitLabel,
  loading = false,
  error = null,
  onSubmit,
}: FreelanceProjectFormProps) {
  const [title, setTitle] = useState(initialProject?.title ?? "");
  const [summary, setSummary] = useState(initialProject?.summary ?? "");
  const [description, setDescription] = useState(initialProject?.description ?? "");
  const [pricingModel, setPricingModel] = useState<FreelancePricingModel>(initialProject?.pricing_model ?? "fixed");
  const [budgetMin, setBudgetMin] = useState(
    initialProject?.budget_min_cents ? String(initialProject.budget_min_cents / 100) : ""
  );
  const [budgetMax, setBudgetMax] = useState(
    initialProject?.budget_max_cents ? String(initialProject.budget_max_cents / 100) : ""
  );
  const [experienceLevel, setExperienceLevel] = useState<FreelanceExperienceLevel>(initialProject?.experience_level ?? "mid");
  const [engagementType, setEngagementType] = useState<FreelanceEngagementType>(initialProject?.engagement_type ?? "one_time");
  const [durationWeeks, setDurationWeeks] = useState(initialProject?.duration_weeks ? String(initialProject.duration_weeks) : "");
  const [locationMode, setLocationMode] = useState<FreelanceLocationMode>(initialProject?.location_mode ?? "remote");
  const [timezoneNote, setTimezoneNote] = useState(initialProject?.timezone_note ?? "");
  const [skillsInput, setSkillsInput] = useState((initialProject?.skills ?? []).map((item) => item.skill).join(", "));
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!initialProject) return;
    setTitle(initialProject.title ?? "");
    setSummary(initialProject.summary ?? "");
    setDescription(initialProject.description ?? "");
    setPricingModel(initialProject.pricing_model ?? "fixed");
    setBudgetMin(initialProject.budget_min_cents ? String(initialProject.budget_min_cents / 100) : "");
    setBudgetMax(initialProject.budget_max_cents ? String(initialProject.budget_max_cents / 100) : "");
    setExperienceLevel(initialProject.experience_level ?? "mid");
    setEngagementType(initialProject.engagement_type ?? "one_time");
    setDurationWeeks(initialProject.duration_weeks ? String(initialProject.duration_weeks) : "");
    setLocationMode(initialProject.location_mode ?? "remote");
    setTimezoneNote(initialProject.timezone_note ?? "");
    setSkillsInput((initialProject.skills ?? []).map((item) => item.skill).join(", "));
  }, [initialProject]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError("");

    const skills = skillsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const min = Math.round(Number(budgetMin) * 100);
    const max = Math.round(Number(budgetMax) * 100);

    if (skills.length < 1) {
      setLocalError("Add at least one required skill.");
      return;
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      setLocalError("Enter valid budget values.");
      return;
    }

    await onSubmit({
      title: title.trim(),
      summary: summary.trim(),
      description: description.trim(),
      pricing_model: pricingModel,
      budget_min_cents: min,
      budget_max_cents: max,
      experience_level: experienceLevel,
      engagement_type: engagementType,
      duration_weeks: durationWeeks ? Number(durationWeeks) : null,
      location_mode: locationMode,
      timezone_note: timezoneNote.trim(),
      skills,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Project Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Summary</label>
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Pricing Model</label>
          <select
            value={pricingModel}
            onChange={(e) => setPricingModel(e.target.value as FreelancePricingModel)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
          >
            <option value="fixed">Fixed</option>
            <option value="hourly">Hourly</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Experience Level</label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value as FreelanceExperienceLevel)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
          >
            <option value="any">Any</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">
            {pricingModel === "hourly" ? "Min Rate (USD/hr)" : "Min Budget (USD)"}
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">
            {pricingModel === "hourly" ? "Max Rate (USD/hr)" : "Max Budget (USD)"}
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Engagement</label>
          <select
            value={engagementType}
            onChange={(e) => setEngagementType(e.target.value as FreelanceEngagementType)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
          >
            <option value="one_time">One-time</option>
            <option value="ongoing">Ongoing</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Duration (weeks)</label>
          <input
            type="number"
            min="1"
            max="52"
            value={durationWeeks}
            onChange={(e) => setDurationWeeks(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Location Mode</label>
          <select
            value={locationMode}
            onChange={(e) => setLocationMode(e.target.value as FreelanceLocationMode)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
          >
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Timezone Note</label>
          <input
            value={timezoneNote}
            onChange={(e) => setTimezoneNote(e.target.value)}
            placeholder="e.g. overlaps with EST mornings"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Required Skills</label>
          <input
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="React, Node.js, PostgreSQL"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
        </div>
      </div>

      {(localError || error) && (
        <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {localError || error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-60"
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
