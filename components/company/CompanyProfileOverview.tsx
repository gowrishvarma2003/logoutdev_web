"use client";

import React from "react";
import { CompanyProfile, CompanyVerification } from "@/lib/companyApi";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

interface CompanyProfileOverviewProps {
  company: CompanyProfile;
  verification: CompanyVerification | null;
}

export function CompanyProfileOverview({ company, verification }: CompanyProfileOverviewProps) {
  const missing = company.missing_profile_fields || [];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Main Bio / Overview Column */}
      <div className="space-y-6 md:col-span-2">
        <Card className="border-border-default bg-surface">
          <CardHeader>
            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <svg className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              About {company.display_name}
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-line">
              {company.description ||
                `${company.display_name} has not added a full company description yet. Edit profile settings to add your mission, engineering culture, and tech stack details.`}
            </p>

            {company.hiring_intent && (
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-400">Current Hiring Stance</h3>
                <p className="mt-1 text-sm font-medium text-text-primary capitalize">
                  {company.hiring_intent.replace("_", " ")}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  This status is displayed to discoverable candidates across LogoutDev.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hiring Contact Card */}
        {(company.hiring_contact_name || company.hiring_contact_email) && (
          <Card className="border-border-default bg-surface">
            <CardHeader>
              <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Primary Hiring Contact
              </h2>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border-default bg-surface-muted p-4">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    {company.hiring_contact_name || "Hiring Lead"}
                  </h3>
                  {company.hiring_contact_title && (
                    <p className="text-xs text-text-muted">{company.hiring_contact_title}</p>
                  )}
                </div>

                {company.hiring_contact_email && (
                  <a
                    href={`mailto:${company.hiring_contact_email}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {company.hiring_contact_email}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Side Specs & Verification Column */}
      <div className="space-y-6">
        {/* Company Specifications Card */}
        <Card className="border-border-default bg-surface">
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Company Details</h2>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-border-default/50">
              <span className="text-text-muted">Display Name</span>
              <span className="font-semibold text-text-primary">{company.display_name}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-border-default/50">
              <span className="text-text-muted">Legal Name</span>
              <span className="font-semibold text-text-primary">{company.legal_name || "—"}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-border-default/50">
              <span className="text-text-muted">Primary Domain</span>
              <span className="font-mono text-sky-400">{company.primary_domain || "—"}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-border-default/50">
              <span className="text-text-muted">Headquarters</span>
              <span className="font-semibold text-text-primary">{company.hq_location || "Not specified"}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-border-default/50">
              <span className="text-text-muted">Company Size</span>
              <span className="font-semibold text-text-primary">{company.company_size || "Not specified"}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-border-default/50">
              <span className="text-text-muted">Industry</span>
              <span className="font-semibold text-text-primary">{company.industry || "Not specified"}</span>
            </div>

            {company.careers_url && (
              <div className="flex justify-between items-center py-1.5 border-b border-border-default/50">
                <span className="text-text-muted">Careers Page</span>
                <a
                  href={company.careers_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sky-400 hover:underline truncate max-w-[140px]"
                >
                  Careers Link
                </a>
              </div>
            )}

            {company.linkedin_url && (
              <div className="flex justify-between items-center py-1.5">
                <span className="text-text-muted">LinkedIn</span>
                <a
                  href={company.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sky-400 hover:underline truncate max-w-[140px]"
                >
                  LinkedIn Profile
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification Overview */}
        <Card className="border-border-default bg-surface">
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Trust & Verification
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border-default bg-surface-muted p-3">
              <p className="text-xs font-semibold text-text-primary capitalize">
                Status: <span className="text-emerald-400">{company.status.replace("_", " ")}</span>
              </p>
              {verification?.public_note && (
                <p className="mt-1.5 text-xs text-text-secondary">{verification.public_note}</p>
              )}
            </div>

            {missing.length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                <span className="font-semibold block mb-1">Incomplete Profile Fields:</span>
                <ul className="list-disc list-inside space-y-0.5 text-amber-300/80">
                  {missing.map((field) => (
                    <li key={field}>{field.replace("_", " ")}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
