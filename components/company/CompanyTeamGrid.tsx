"use client";

import React from "react";
import { CompanyMember } from "@/lib/companyApi";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

interface CompanyTeamGridProps {
  members: CompanyMember[];
}

export function CompanyTeamGrid({ members }: CompanyTeamGridProps) {
  const getRoleBadge = (role: CompanyMember["role"]) => {
    switch (role) {
      case "owner":
        return <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-300">Owner</span>;
      case "admin":
        return <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-300">Admin</span>;
      case "recruiter":
        return <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">Recruiter</span>;
      default:
        return <span className="rounded-full border border-slate-500/30 bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-300">Member</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Company Leadership & Team</h2>
          <p className="text-xs text-text-muted">Verified team members with access to company portal permissions.</p>
        </div>
      </div>

      {members.length === 0 ? (
        <Card className="border-border-default bg-surface py-10 text-center">
          <CardContent>
            <p className="text-xs text-text-muted">No team members loaded or logged in.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const acc = member.account;
            const initials = (acc?.name || acc?.email || "M")
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <Card key={member.id} className="border-border-default bg-surface hover:border-sky-500/30 transition-all">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 font-bold text-white shadow-md">
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-text-primary">{acc?.name || "Team Member"}</h3>
                        <p className="text-xs text-text-muted truncate max-w-[140px]">{acc?.email || ""}</p>
                      </div>
                    </div>
                    {getRoleBadge(member.role)}
                  </div>

                  {acc?.title && (
                    <div className="rounded-lg border border-border-default bg-surface-muted p-2.5 text-xs text-text-secondary">
                      <span className="text-text-muted font-medium block text-[10px] uppercase tracking-wider">Role Title</span>
                      <span>{acc.title}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-border-default/50 pt-3 text-[11px] text-text-muted">
                    <span>Joined {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "Recently"}</span>
                    <span className="capitalize text-emerald-400 font-medium">{member.status}</span>
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
