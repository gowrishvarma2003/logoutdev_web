"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CompanyProfile } from "@/lib/companyApi";
import Button from "@/components/ui/Button";
import ShareMenu from "@/components/profile/ShareMenu";
import {
  MapPinIcon,
  GlobeIcon,
  LinkedInIcon,
  EditIcon,
  CalendarIcon,
  BriefcaseIcon,
  SparklesIcon,
  RocketIcon,
} from "@/components/ui/Icons";

interface CompanyProfileHeaderProps {
  company: CompanyProfile;
  activeJobCount?: number;
  teamCount?: number;
}

export function CompanyProfileHeader({ company, activeJobCount = 0, teamCount = 1 }: CompanyProfileHeaderProps) {
  const companyInitials = (company.display_name || company.legal_name || "CO")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formattedJoinDate = company.approved_at || company.reviewed_at
    ? new Date(company.approved_at || company.reviewed_at!).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently Joined";

  const getStatusBadge = (status: CompanyProfile["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 shadow-sm backdrop-blur-md">
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified Company
          </span>
        );
      case "under_review":
      case "needs_reverification":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 shadow-sm backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Under Verification
          </span>
        );
      case "rejected":
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 shadow-sm backdrop-blur-md">
            Verification Restricted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-500/30 bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-300 shadow-sm backdrop-blur-md">
            Draft Profile
          </span>
        );
    }
  };

  const shareHref = `/company/profile`;

  return (
    <div className="border-b border-border-default bg-app">
      {/* ── Banner Area ── */}
      <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-b border-border-default">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.18),transparent_50%)]" />
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {getStatusBadge(company.status)}
          {company.hiring_intent === "actively_hiring" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
              Actively Hiring
            </span>
          )}
        </div>
      </div>

      {/* ── Header Details Row ── */}
      <div className="px-5 pt-1 pb-6">
        {/* Avatar + Action Row */}
        <div className="flex items-end justify-between gap-3">
          <div className="relative -mt-14 sm:-mt-16">
            <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center rounded-2xl sm:rounded-3xl border-4 border-app bg-gradient-to-br from-indigo-600 to-sky-600 text-3xl font-extrabold text-white shadow-2xl ring-2 ring-sky-500/20">
              {companyInitials}
              {company.status === "approved" && (
                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-app shadow-md">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pb-1">
            <ShareMenu url={shareHref} title={`${company.display_name} — LogoutDev Company Profile`} />
            
            {company.website_url && (
              <a
                href={company.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-default bg-surface text-text-secondary hover:text-text-primary text-sm font-medium transition-colors hover:bg-surface-hover"
              >
                <GlobeIcon className="w-4 h-4 text-sky-400" />
                Website
              </a>
            )}

            <Link
              href="/settings/profile"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm"
            >
              <EditIcon className="w-3.5 h-3.5" />
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Name + Handle */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary leading-tight">
            {company.display_name}
          </h1>
          {company.legal_name && company.legal_name !== company.display_name && (
            <span className="text-xs text-text-disabled font-medium">({company.legal_name})</span>
          )}
        </div>

        <p className="text-sm text-text-disabled mt-0.5 font-mono">@{company.slug || company.primary_domain}</p>

        {/* Bio / Description */}
        <p className="mt-3 text-sm leading-relaxed text-text-secondary max-w-3xl">
          {company.description || "Welcome to our company profile on LogoutDev. Explore open roles, engineering culture, and technical projects."}
        </p>

        {/* Metadata Chips Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-muted">
          {company.primary_domain && (
            <div className="flex items-center gap-1.5">
              <GlobeIcon className="w-4 h-4 text-sky-400" />
              <span className="font-mono text-text-secondary">{company.primary_domain}</span>
            </div>
          )}

          {company.hq_location && (
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="w-4 h-4 text-rose-400" />
              <span>{company.hq_location}</span>
            </div>
          )}

          {company.company_size && (
            <div className="flex items-center gap-1.5">
              <RocketIcon className="w-4 h-4 text-amber-400" />
              <span>{company.company_size} employees</span>
            </div>
          )}

          {company.industry && (
            <div className="flex items-center gap-1.5">
              <SparklesIcon className="w-4 h-4 text-emerald-400" />
              <span>{company.industry}</span>
            </div>
          )}

          {company.careers_url && (
            <div className="flex items-center gap-1.5">
              <BriefcaseIcon className="w-4 h-4 text-purple-400" />
              <a href={company.careers_url} target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 hover:underline">
                Careers Page
              </a>
            </div>
          )}

          {company.linkedin_url && (
            <div className="flex items-center gap-1.5">
              <LinkedInIcon className="w-4 h-4 text-sky-400" />
              <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 hover:underline">
                LinkedIn
              </a>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-text-disabled" />
            <span>Verified {formattedJoinDate}</span>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="mt-5 flex items-center gap-6 border-t border-border-default pt-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-text-primary">{activeJobCount}</span>
            <span className="text-text-disabled text-xs">Active Roles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-text-primary">{teamCount}</span>
            <span className="text-text-disabled text-xs">Team Members</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-emerald-400 capitalize">{company.status}</span>
            <span className="text-text-disabled text-xs">Trust Seal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sky-300 capitalize">{(company.hiring_intent || "Active").replace("_", " ")}</span>
            <span className="text-text-disabled text-xs">Hiring Stance</span>
          </div>
        </div>
      </div>
    </div>
  );
}
