"use client";

import Link from "next/link";
import { useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { CheckCircleIcon, FolderIcon, XCircleIcon } from "@/components/ui/Icons";
import { useRepositoryInvitations } from "@/lib/hooks/useRepos";
import * as reposApi from "@/lib/services/reposApi";
import type { RepoInvitation } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

function repoOwnerName(invitation: RepoInvitation) {
  return invitation.repo?.owner?.username || invitation.repo?.owner?.name || "unknown";
}

function roleLabel(role: string) {
  return role.replaceAll("_", " ");
}

export default function RepoInvitationsPage() {
  const { invitations, loading, error, refetch } = useRepositoryInvitations();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAction(invitationId: string, action: "accept" | "reject") {
    if (savingId) return;
    setSavingId(invitationId);
    setMessage(null);
    try {
      if (action === "accept") {
        await reposApi.acceptRepositoryInvitation(invitationId);
        setMessage("Invitation accepted.");
      } else {
        await reposApi.rejectRepositoryInvitation(invitationId);
        setMessage("Invitation declined.");
      }
      refetch();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update invitation.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-app">
      <header className="border-b border-border-default px-4 py-5 md:px-8">
        <div className="mx-auto max-w-[900px]">
          <Link href="/repos" className="text-sm font-medium text-sky-300 hover:text-sky-200">
            Back to repositories
          </Link>
          <h1 className="mt-3 text-xl font-semibold text-text-primary">Repository invitations</h1>
          <p className="mt-1 text-sm text-text-disabled">
            Accept contributor invites before they appear in Shared repos.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-4 py-6 md:px-8">
        {message ? <p className="mb-4 text-sm text-text-secondary">{message}</p> : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : null}

        {error ? <p className="py-12 text-center text-sm text-rose-400">{error}</p> : null}

        {!loading && !error && invitations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-default px-4 py-16 text-center">
            <FolderIcon className="mx-auto h-11 w-11 text-zinc-700" />
            <h2 className="mt-4 text-base font-semibold text-text-primary">No pending invitations</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-text-disabled">
              New contributor invitations will appear here before repo access is enabled.
            </p>
          </div>
        ) : null}

        {invitations.length > 0 ? (
          <div className="grid gap-3">
            {invitations.map((invitation) => (
              <article key={invitation.id} className="rounded-lg border border-border-default bg-app px-4 py-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-base font-semibold text-text-primary">
                      {repoOwnerName(invitation)}/{invitation.repo?.name || "repository"}
                    </h2>
                    <p className="mt-1 text-sm text-text-muted">
                      Invited as {roleLabel(invitation.role)} · {formatRelativeTime(invitation.created_at)}
                    </p>
                    {invitation.repo?.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-text-disabled">{invitation.repo.description}</p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => void handleAction(invitation.id, "accept")}
                      disabled={Boolean(savingId)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-green-600 px-3 text-sm font-semibold text-text-primary transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleAction(invitation.id, "reject")}
                      disabled={Boolean(savingId)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-strong px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface disabled:opacity-50"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      Decline
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}
