"use client";

/**
 * SkillsPanel — displays up to 10 ranked skills as chip badges.
 * The top-ranked skill is highlighted.
 */

import type { UserProfileSkill } from "@/lib/types";
import EmptyState from "@/components/ui/EmptyState";
import { CodeBracketIcon } from "@/components/ui/Icons";

interface SkillsPanelProps {
  skills: UserProfileSkill[];
  showEmpty?: boolean;
}

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
    <section aria-label="Tech stack skills" id="skills">
      <h2 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-1.5">
        <span className="w-1 h-3.5 rounded-full bg-violet-500 inline-block" />
        Tech Stack
      </h2>

      {skills.length === 0 ? (
        <EmptyState
          icon={<CodeBracketIcon className="h-6 w-6" />}
          title="No skills listed yet"
          description="Add languages, frameworks, and tools so collaborators know where you shine."
          tone="repo"
          size="sm"
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((s, idx) => {
            const isTop = idx === 0;
            return (
              <span
                key={s.id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${
                  isTop
                    ? "bg-primary/10 text-text-primary border-border-strong"
                    : CHIP_COLORS[idx % CHIP_COLORS.length]
                }`}
              >
                {isTop ? <span className="w-1.5 h-1.5 rounded-full bg-primary" /> : null}
                {s.skill}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}
