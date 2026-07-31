"use client";

import React, { useEffect, useState } from "react";
import { companyPortalApi, CompanyProfile, CompanyVerification, CompanyJob, CompanyMember } from "@/lib/companyApi";
import { CompanyProfileHeader } from "@/components/company/CompanyProfileHeader";
import { CompanyProfileOverview } from "@/components/company/CompanyProfileOverview";
import { CompanyJobsList } from "@/components/company/CompanyJobsList";
import { CompanyTeamGrid } from "@/components/company/CompanyTeamGrid";
import { CompanyTrustCard } from "@/components/company/CompanyTrustCard";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";

const FALLBACK_COMPANY: CompanyProfile = {
  id: "demo-company-1",
  legal_name: "Acme Technologies Inc.",
  display_name: "Acme Technologies",
  slug: "acme-tech",
  website_url: "https://acme.example.com",
  primary_domain: "acme.example.com",
  description: "Acme Technologies builds high-scale developer platform infrastructure, real-time sync systems, and distributed cloud tools. We are a team of passionate engineers solving complex distributed systems problems.",
  hq_location: "San Francisco, CA",
  company_size: "51-200",
  industry: "Developer Tools & Cloud Infrastructure",
  linkedin_url: "https://linkedin.com/company/acme-tech",
  careers_url: "https://acme.example.com/careers",
  hiring_contact_name: "Sarah Jenkins",
  hiring_contact_email: "sarah@acme.example.com",
  hiring_contact_title: "VP of Engineering & Talent",
  hiring_intent: "actively_hiring",
  status: "approved",
  public_review_note: "Verified work email domain and official corporate records match.",
  rejection_reason: null,
  approved_at: new Date().toISOString(),
  reviewed_at: new Date().toISOString(),
  missing_profile_fields: [],
};

const FALLBACK_VERIFICATION: CompanyVerification = {
  id: "ver-1",
  status: "approved",
  reviewer_decision: "approved",
  public_note: "Official work domain verified via company DNS and business registration.",
  submitted_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  reviewed_at: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString(),
};

const FALLBACK_JOBS: CompanyJob[] = [
  {
    id: "job-1",
    title: "Senior Staff Backend Engineer (Distributed Systems)",
    slug: "senior-staff-backend-engineer",
    description: "Looking for an experienced backend engineer to architect our high-throughput event streaming engine. Deep experience with Node.js, Go, PostgreSQL, and WebSockets required.",
    location: "San Francisco, CA (Remote Allowed)",
    workplace_type: "remote",
    employment_type: "full_time",
    seniority: "senior",
    skills: ["Node.js", "Go", "PostgreSQL", "Redis", "Distributed Systems"],
    salary_min: 180000,
    salary_max: 240000,
    salary_currency: "$",
    hiring_manager_name: "Sarah Jenkins",
    hiring_manager_email: "sarah@acme.example.com",
    status: "published",
    approval_requested_at: new Date().toISOString(),
    approved_at: new Date().toISOString(),
    closed_at: null,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "job-2",
    title: "Lead Frontend Systems Engineer (Next.js & Design Systems)",
    slug: "lead-frontend-systems-engineer",
    description: "Lead the creation of our modern web app framework, canvas editors, and dark-mode UI design primitives using Next.js, React, and TypeScript.",
    location: "San Francisco, CA",
    workplace_type: "hybrid",
    employment_type: "full_time",
    seniority: "lead",
    skills: ["Next.js", "TypeScript", "React", "TailwindCSS", "Canvas"],
    salary_min: 170000,
    salary_max: 220000,
    salary_currency: "$",
    hiring_manager_name: "Sarah Jenkins",
    hiring_manager_email: "sarah@acme.example.com",
    status: "published",
    approval_requested_at: new Date().toISOString(),
    approved_at: new Date().toISOString(),
    closed_at: null,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const FALLBACK_TEAM: CompanyMember[] = [
  {
    id: "mem-1",
    role: "owner",
    status: "active",
    joined_at: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString(),
    permissions: ["*"],
    account: {
      id: "acc-1",
      name: "Alex Vance",
      email: "alex@acme.example.com",
      title: "Co-Founder & CEO",
      status: "active",
    },
  },
  {
    id: "mem-2",
    role: "recruiter",
    status: "active",
    joined_at: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(),
    permissions: ["hiring.*"],
    account: {
      id: "acc-2",
      name: "Sarah Jenkins",
      email: "sarah@acme.example.com",
      title: "VP of Engineering & Talent",
      status: "active",
    },
  },
];

export default function CompanyProfilePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "jobs" | "team" | "trust">("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [company, setCompany] = useState<CompanyProfile>(FALLBACK_COMPANY);
  const [verification, setVerification] = useState<CompanyVerification | null>(FALLBACK_VERIFICATION);
  const [jobs, setJobs] = useState<CompanyJob[]>(FALLBACK_JOBS);
  const [team, setTeam] = useState<CompanyMember[]>(FALLBACK_TEAM);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, verRes, jobsRes, teamRes] = await Promise.all([
        companyPortalApi.getProfile().catch(() => null),
        companyPortalApi.getVerificationStatus().catch(() => null),
        companyPortalApi.getJobs().catch(() => null),
        companyPortalApi.getTeam().catch(() => null),
      ]);

      if (profileRes?.company) {
        setCompany(profileRes.company);
        setIsDemoMode(false);
      } else {
        setIsDemoMode(true);
      }

      if (verRes?.verification) setVerification(verRes.verification);
      if (jobsRes?.jobs) setJobs(jobsRes.jobs);
      if (teamRes?.members) setTeam(teamRes.members);
    } catch {
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeJobCount = jobs.filter((j) => j.status === "published").length;

  return (
    <div className="min-h-screen bg-app">
      {/* Top Banner Notice if in Demo Mode */}
      {isDemoMode && !loading && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-xs text-sky-200 shadow-md">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Company Profile Preview Mode:</strong> Showing live company showcase page. Log in with a company account to connect live backend fields.
              </span>
            </div>
            <Button size="sm" variant="ghost" className="text-sky-300 hover:text-white text-xs h-7 px-2" onClick={fetchData}>
              Refresh API
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <div className="space-y-4 pt-4">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto">
          {/* Header Component (Banner, Avatar, Info, Meta Chips, Stats) */}
          <CompanyProfileHeader company={company} activeJobCount={activeJobCount} teamCount={team.length} />

          {/* Sub-Navigation Tabs Bar */}
          <div className="border-b border-border-default px-5">
            <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto">
              {[
                { id: "overview", label: "Overview", count: null },
                { id: "jobs", label: "Open Roles", count: jobs.length },
                { id: "team", label: "Team", count: team.length },
                { id: "trust", label: "Trust & Verification", count: null },
              ].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`relative px-3.5 sm:px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      active
                        ? "text-text-primary font-semibold"
                        : "text-text-disabled hover:text-text-secondary"
                    }`}
                  >
                    {tab.label}
                    {typeof tab.count === "number" && tab.count > 0 ? (
                      <span className={`text-[11px] tabular-nums rounded-full px-1.5 py-0.5 ${active ? "bg-surface-hover text-text-secondary" : "bg-surface text-text-disabled"}`}>
                        {tab.count}
                      </span>
                    ) : null}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Main Content */}
          <div className="px-5 py-6">
            {activeTab === "overview" && <CompanyProfileOverview company={company} verification={verification} />}
            {activeTab === "jobs" && <CompanyJobsList jobs={jobs} />}
            {activeTab === "team" && <CompanyTeamGrid members={team} />}
            {activeTab === "trust" && <CompanyTrustCard company={company} verification={verification} />}
          </div>
        </div>
      )}
    </div>
  );
}
