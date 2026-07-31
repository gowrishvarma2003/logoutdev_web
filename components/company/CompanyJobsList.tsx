"use client";

import React, { useState } from "react";
import { CompanyJob } from "@/lib/companyApi";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface CompanyJobsListProps {
  jobs: CompanyJob[];
}

export function CompanyJobsList({ jobs }: CompanyJobsListProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = filterStatus === "all" || job.status === filterStatus;
    const matchesSearch =
      searchQuery.trim() === "" ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getWorkplaceBadge = (type: CompanyJob["workplace_type"]) => {
    switch (type) {
      case "remote":
        return <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">Remote</span>;
      case "hybrid":
        return <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-400 border border-sky-500/20">Hybrid</span>;
      case "onsite":
        return <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/20">Onsite</span>;
    }
  };

  const getStatusBadge = (status: CompanyJob["status"]) => {
    switch (status) {
      case "published":
        return <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">Active</span>;
      case "pending_review":
        return <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">Pending Review</span>;
      case "closed":
        return <span className="rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/30">Closed</span>;
      case "draft":
        return <span className="rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-300 border border-slate-500/30">Draft</span>;
      default:
        return <span className="rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/30">{status}</span>;
    }
  };

  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return null;
    const curr = currency || "$";
    if (min && max) return `${curr}${min.toLocaleString()} - ${curr}${max.toLocaleString()}`;
    if (min) return `From ${curr}${min.toLocaleString()}`;
    return `Up to ${curr}${max?.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jobs by title or skills..."
            className="w-full rounded-xl border border-border-default bg-surface px-3 py-2 pl-9 text-xs text-text-primary placeholder:text-text-disabled focus:border-sky-500 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {["all", "published", "pending_review", "closed", "draft"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filterStatus === st
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                  : "bg-surface-muted text-text-muted hover:text-text-primary border border-border-default"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <Card className="border-border-default bg-surface py-12 text-center">
          <CardContent className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted text-text-muted">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-text-primary">No Job Postings Found</h3>
            <p className="max-w-md mx-auto text-xs text-text-muted">
              {searchQuery || filterStatus !== "all"
                ? "No job postings match your current filter or search criteria."
                : "Your company has not published any open technical job postings yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map((job) => {
            const salaryText = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
            return (
              <Card key={job.id} className="border-border-default bg-surface hover:border-sky-500/30 transition-all shadow-md">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-lg font-bold text-text-primary">{job.title}</h3>
                        {getStatusBadge(job.status)}
                        {getWorkplaceBadge(job.workplace_type)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted">
                        <span className="capitalize font-medium text-text-secondary">{job.employment_type.replace("_", " ")}</span>
                        <span>•</span>
                        <span className="capitalize font-medium text-text-secondary">{job.seniority} Level</span>
                        <span>•</span>
                        <span>{job.location}</span>
                        {salaryText && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-emerald-400">{salaryText}</span>
                          </>
                        )}
                      </div>

                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Skill Tags */}
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.skills.map((skill) => (
                            <span key={skill} className="rounded-md border border-border-default bg-surface-muted px-2 py-0.5 text-[11px] font-mono text-sky-300">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
