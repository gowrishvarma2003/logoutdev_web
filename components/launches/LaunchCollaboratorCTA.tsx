"use client";

import Link from "next/link";
import type { Launch } from "@/lib/types";
import { UsersIcon } from "@/components/ui/Icons";

export default function LaunchCollaboratorCTA({
  launch,
  isAuthenticated,
}: {
  launch: Launch;
  isAuthenticated: boolean;
}) {
  if (launch.viewer_state?.is_owner) return null;
  if (launch.collaboration_mode !== "looking" || !launch.linked_space_id) return null;

  const roles = launch.collaboration_roles ?? [];

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-zinc-950/80 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="shrink-0 rounded-xl bg-emerald-500/10 p-2 text-emerald-400 ring-1 ring-emerald-500/20">
          <UsersIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text-primary">Looking for Collaborators</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
            {launch.collaboration_note ||
              "This launch is open to new developers. Apply to build next features together."}
          </p>
        </div>
      </div>

      {roles.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-disabled mb-2">Target Roles</p>
          <div className="flex flex-wrap gap-1.5">
            {roles.map((role) => (
              <span
                key={role}
                className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-xs text-emerald-300 font-medium"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {isAuthenticated ? (
        launch.viewer_state?.can_request_collaboration ? (
          <Link
            href={`/launches/${launch.id}/collaborate`}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors shadow-lg shadow-emerald-500/10"
          >
            Request to Collaborate
          </Link>
        ) : launch.viewer_state?.is_space_member ? (
          <p className="text-xs text-emerald-400 bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20 text-center font-medium">
            ✓ You are already a collaborator in this project space.
          </p>
        ) : launch.viewer_state?.has_pending_collaboration_request ? (
          <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg p-3 border border-amber-500/20 text-center font-medium">
            ⏳ Your request to collaborate is currently under review by the builder.
          </p>
        ) : (
          <p className="text-xs text-text-disabled bg-surface/50 rounded-lg p-3 border border-border-default text-center">
            Collaboration applications are currently closed or already handled.
          </p>
        )
      ) : (
        <Link
          href="/login"
          className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-border-default hover:border-border-strong bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors"
        >
          Sign in to collaborate
        </Link>
      )}
    </div>
  );
}
