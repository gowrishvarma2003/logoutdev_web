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

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
      <div className="mb-3 flex items-start gap-3">
        <div className="shrink-0 rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
          <UsersIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white">Builder is looking for collaborators</h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400 [overflow-wrap:anywhere]">
            {launch.collaboration_note ||
              "This launch is connected to a project space and open to collaboration requests."}
          </p>
        </div>
      </div>

      {(launch.collaboration_roles ?? []).length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {launch.collaboration_roles.map((role) => (
            <span
              key={role}
              className="rounded-full border border-emerald-500/20 bg-zinc-900 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 [overflow-wrap:anywhere]"
            >
              {role}
            </span>
          ))}
        </div>
      )}

      {isAuthenticated ? (
        launch.viewer_state?.can_request_collaboration ? (
          <Link
            href={`/launches/${launch.id}/collaborate`}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 sm:w-auto"
          >
            Request to collaborate
          </Link>
        ) : (
          <p className="text-xs text-zinc-500">
            Collaboration is already handled for your account or not available right now.
          </p>
        )
      ) : (
        <Link
          href="/login"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 sm:w-auto"
        >
          Sign in to collaborate
        </Link>
      )}
    </div>
  );
}
