"use client";

/**
 * SkillsPanel — displays up to 10 ranked skills as chip badges.
 * Optionally shows an "Edit" trigger if the user is viewing their own profile.
 */

import type { UserProfileSkill } from "@/lib/types";

interface SkillsPanelProps {
  skills: UserProfileSkill[];
  /** Show section even when empty (useful on own profile to prompt editing) */
  showEmpty?: boolean;
}

/** Stable background gradient per skill index for visual variety */
const CHIP_COLORS = [
  "bg-violet-500/15 text-violet-300 border-violet-500/30",
  "bg-sky-500/15 text-sky-300 border-sky-500/30",
  "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "bg-orange-500/15 text-orange-300 border-orange-500/30",
  "bg-pink-500/15 text-pink-300 border-pink-500/30",
  "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  "bg-teal-500/15 text-teal-300 border-teal-500/30",
  "bg-red-500/15 text-red-300 border-red-500/30",
  "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
];

export default function SkillsPanel({ skills, showEmpty = false }: SkillsPanelProps) {
  if (skills.length === 0 && !showEmpty) return null;

  return (
    <section aria-label="Tech stack skills">
      <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-1.5">
        <span className="w-1 h-3.5 rounded-full bg-violet-500 inline-block" />
        Tech Stack
      </h2>

      {skills.length === 0 ? (
        <p className="text-sm text-zinc-600 italic">No skills listed yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((s, idx) => (
            <span
              key={s.id}
              className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-medium ${
                CHIP_COLORS[idx % CHIP_COLORS.length]
              }`}
            >
              {s.skill}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
