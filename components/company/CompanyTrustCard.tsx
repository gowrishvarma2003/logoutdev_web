"use client";

import React from "react";
import { CompanyProfile, CompanyVerification } from "@/lib/companyApi";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

interface CompanyTrustCardProps {
  company: CompanyProfile;
  verification: CompanyVerification | null;
}

export function CompanyTrustCard({ company, verification }: CompanyTrustCardProps) {
  const isVerified = company.status === "approved";

  return (
    <div className="space-y-6">
      <Card className="border-border-default bg-surface">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isVerified ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"}`}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">LogoutDev Verification Seal</h2>
              <p className="text-xs text-text-muted">Authenticity badge for developer candidates & hiring ecosystem</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`rounded-xl border p-4 ${isVerified ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-amber-500/30 bg-amber-500/5 text-amber-300"}`}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              {isVerified ? "Verified Company Status Active" : "Pending Verification Review"}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">
              {isVerified
                ? "This company profile has verified work email domains, valid legal details, and approved trust status on LogoutDev."
                : "Your company verification is currently undergoing review. Ensure work email OTP verification and profile fields are complete."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="rounded-xl border border-border-default bg-surface-muted p-4 space-y-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">Domain Verification</span>
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {company.primary_domain || "Work Domain Verified"}
              </div>
              <p className="text-xs text-text-muted">Work email matches official company domain.</p>
            </div>

            <div className="rounded-xl border border-border-default bg-surface-muted p-4 space-y-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">Review Status</span>
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary capitalize">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                {verification?.status || company.status.replace("_", " ")}
              </div>
              <p className="text-xs text-text-muted">
                {verification?.reviewed_at ? `Reviewed on ${new Date(verification.reviewed_at).toLocaleDateString()}` : "Submitted for verification"}
              </p>
            </div>
          </div>

          {verification?.public_note && (
            <div className="rounded-xl border border-border-default bg-surface-muted p-4">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Reviewer Note</h4>
              <p className="mt-1 text-xs text-text-secondary">{verification.public_note}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
