"use client";

/**
 * SkillsPanel — displays skills grouped by category with tabs for filtering.
 * Shows ranked skills as chip badges, organized by technology category.
 * Features: Search, proficiency filter, sorting, and results count.
 */

import { useState, useMemo } from "react";
import type { UserProfileSkill } from "@/lib/types";
import {
  categorizeSkill,
  getCategoryLabel,
  getCategoryIcon,
  getCategoryColorClass,
  type SkillCategoryKey,
} from "@/lib/constants/skillCategories";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

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

/** Determine proficiency level based on rank (1-5 scale) */
function getProficiencyLevel(
  rank: number
): "Beginner" | "Intermediate" | "Advanced" | "Expert" {
  if (rank <= 1) return "Beginner";
  if (rank <= 2) return "Intermediate";
  if (rank <= 3) return "Advanced";
  return "Expert";
}

type SortOption =
  | "alphabetical-asc"
  | "alphabetical-desc"
  | "proficiency-desc"
  | "proficiency-asc";

type ProficiencyFilter =
  | "All"
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Expert";

export default function SkillsPanel({ skills, showEmpty = false }: SkillsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    SkillCategoryKey | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [proficiencyFilter, setProficiencyFilter] =
    useState<ProficiencyFilter>("All");
  const [sortOption, setSortOption] = useState<SortOption>("alphabetical-asc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Group skills by category
  const skillsByCategory = useMemo(() => {
    const grouped: Record<SkillCategoryKey, UserProfileSkill[]> = {
      languages: [],
      frameworks: [],
      databases: [],
      tools: [],
      other: [],
    };

    skills.forEach((skill) => {
      const category = categorizeSkill(skill.skill);
      grouped[category].push(skill);
    });

    return grouped;
  }, [skills]);

  // Get categories with skills
  const categoriesWithSkills = useMemo(() => {
    return (Object.keys(skillsByCategory) as SkillCategoryKey[]).filter(
      (cat) => skillsByCategory[cat].length > 0
    );
  }, [skillsByCategory]);

  // Filter and sort skills
  const filteredAndSortedSkills = useMemo(() => {
    let result = skills;

    // Apply category filter
    if (selectedCategory !== "all") {
      result = result.filter(
        (s) => categorizeSkill(s.skill) === selectedCategory
      );
    }

    // Apply search filter (case-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((s) =>
        s.skill.toLowerCase().includes(query)
      );
    }

    // Apply proficiency filter
    if (proficiencyFilter !== "All") {
      result = result.filter(
        (s) => getProficiencyLevel(s.rank) === proficiencyFilter
      );
    }

    // Apply sorting
    const sorted = [...result];
    switch (sortOption) {
      case "alphabetical-asc":
        sorted.sort((a, b) => a.skill.localeCompare(b.skill));
        break;
      case "alphabetical-desc":
        sorted.sort((a, b) => b.skill.localeCompare(a.skill));
        break;
      case "proficiency-desc":
        sorted.sort((a, b) => b.rank - a.rank);
        break;
      case "proficiency-asc":
        sorted.sort((a, b) => a.rank - b.rank);
        break;
    }

    return sorted;
  }, [skills, selectedCategory, searchQuery, proficiencyFilter, sortOption]);

  if (skills.length === 0 && !showEmpty) return null;

  return (
    <section aria-label="Tech stack skills" className="px-4 sm:px-6">
      <h2 className="text-xs sm:text-sm font-semibold text-zinc-300 mb-3 sm:mb-4 flex items-center gap-1.5">
        <span className="w-1 h-3.5 rounded-full bg-violet-500 inline-block flex-shrink-0" />
        Tech Stack
      </h2>

      {skills.length === 0 ? (
        <p className="text-xs sm:text-sm text-zinc-600 italic">
          No skills listed yet.
        </p>
      ) : (
        <>
          {/* Category Tabs */}
          {categoriesWithSkills.length > 1 && (
            <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-5 flex-wrap">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px] whitespace-nowrap ${
                  selectedCategory === "all"
                    ? "bg-violet-500/30 text-violet-300 border border-violet-500/50"
                    : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-800"
                }`}
              >
                All ({skills.length})
              </button>

              {categoriesWithSkills.map((category) => {
                const count = skillsByCategory[category].length;
                const label = getCategoryLabel(category);
                const icon = getCategoryIcon(category);
                const colorClass = getCategoryColorClass(category);

                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 min-h-[36px] whitespace-nowrap ${
                      selectedCategory === category
                        ? `bg-${colorClass}-500/30 text-${colorClass}-300 border border-${colorClass}-500/50`
                        : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-800"
                    }`}
                  >
                    <span className="flex-shrink-0">{icon}</span>
                    <span className="hidden sm:inline">
                      {label} ({count})
                    </span>
                    <span className="sm:hidden">{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-4 sm:mb-5">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg pl-9 pr-9 py-2 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:bg-zinc-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filters and Sort Controls */}
          <div className="mb-4 sm:mb-5 flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap items-start sm:items-center">
            {/* Proficiency Filter Buttons */}
            <div className="flex gap-1.5 flex-wrap">
              {(["All", "Beginner", "Intermediate", "Advanced", "Expert"] as ProficiencyFilter[]).map(
                (level) => (
                  <button
                    key={level}
                    onClick={() => setProficiencyFilter(level)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[32px] whitespace-nowrap ${
                      proficiencyFilter === level
                        ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                        : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-800"
                    }`}
                  >
                    {level}
                  </button>
                )
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative ml-auto">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-800 transition-colors min-h-[32px] whitespace-nowrap"
              >
                <span>Sort</span>
                <ChevronDownIcon
                  className={`w-3 h-3 transition-transform ${
                    showSortDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-zinc-900 border border-zinc-700/50 rounded-lg shadow-lg z-10 min-w-[200px]">
                  {[
                    {
                      value: "alphabetical-asc",
                      label: "A-Z",
                    },
                    {
                      value: "alphabetical-desc",
                      label: "Z-A",
                    },
                    {
                      value: "proficiency-desc",
                      label: "Proficiency (Highest)",
                    },
                    {
                      value: "proficiency-asc",
                      label: "Proficiency (Lowest)",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortOption(option.value as SortOption);
                        setShowSortDropdown(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-xs hover:bg-zinc-800 transition-colors ${
                        sortOption === option.value
                          ? "text-violet-300 bg-zinc-800/50"
                          : "text-zinc-400"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results Count */}
          {filteredAndSortedSkills.length > 0 && (
            <p className="text-xs text-zinc-500 mb-3 sm:mb-4">
              Showing {filteredAndSortedSkills.length} of {skills.length} skills
            </p>
          )}

          {/* Skills Display */}
          {filteredAndSortedSkills.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs sm:text-sm text-zinc-600 italic">
                {searchQuery || proficiencyFilter !== "All"
                  ? "No skills match your filters."
                  : "No skills in this category."}
              </p>
            </div>
          ) : (
            <>
              {selectedCategory === "all" &&
              (searchQuery.trim() === "" && proficiencyFilter === "All") ? (
                // Show all skills grouped by category (only when no active search/filter)
                <div className="space-y-3 sm:space-y-4">
                  {categoriesWithSkills.map((category) => {
                    const categorySkills = skillsByCategory[category];
                    const label = getCategoryLabel(category);
                    const icon = getCategoryIcon(category);

                    return (
                      <div key={category}>
                        <h3 className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
                          <span className="flex-shrink-0">{icon}</span>
                          <span className="truncate">{label}</span>
                          <span className="ml-auto text-zinc-600 flex-shrink-0">
                            {categorySkills.length}
                          </span>
                        </h3>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {categorySkills.map((s, idx) => (
                            <span
                              key={s.id}
                              className={`inline-flex items-center px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-medium whitespace-nowrap flex-shrink-0 min-h-[32px] flex items-center ${
                                CHIP_COLORS[idx % CHIP_COLORS.length]
                              }`}
                              title={`Proficiency: ${getProficiencyLevel(
                                s.rank
                              )}`}
                            >
                              {s.skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Show filtered/sorted skills flat
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {filteredAndSortedSkills.map((s, idx) => (
                    <span
                      key={s.id}
                      className={`inline-flex items-center px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-medium whitespace-nowrap flex-shrink-0 min-h-[32px] flex items-center ${
                        CHIP_COLORS[idx % CHIP_COLORS.length]
                      }`}
                      title={`Proficiency: ${getProficiencyLevel(s.rank)}`}
                    >
                      {s.skill}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
