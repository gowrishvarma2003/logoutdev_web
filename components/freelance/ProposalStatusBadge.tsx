"use client";

import type { FreelanceProjectStatus, FreelanceProposalStatus } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  in_review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  awarded: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  completed: "bg-zinc-700/60 text-zinc-200 border-zinc-600",
  cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  submitted: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  shortlisted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  accepted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  withdrawn: "bg-zinc-800 text-zinc-400 border-zinc-700",
};

function labelize(value: string): string {
  return value.replace(/_/g, " ");
}

export default function ProposalStatusBadge({
  status,
}: {
  status: FreelanceProposalStatus | FreelanceProjectStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.open}`}
    >
      {labelize(status)}
    </span>
  );
}
