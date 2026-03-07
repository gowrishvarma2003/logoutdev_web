"use client";

import { useEffect, useState } from "react";
import type { FreelancePricingModel, FreelanceProposal } from "@/lib/types";

interface ProposalFormProps {
  pricingModel: FreelancePricingModel;
  initialProposal?: Partial<FreelanceProposal> | null;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (payload: {
    cover_note: string;
    pricing_model: FreelancePricingModel;
    bid_amount_cents: number;
    estimated_duration_weeks: number | null;
    availability_hours: number | null;
    proof_links: string[];
  }) => Promise<void> | void;
}

export default function ProposalForm({
  pricingModel,
  initialProposal,
  submitLabel,
  loading = false,
  error = null,
  onSubmit,
}: ProposalFormProps) {
  const [coverNote, setCoverNote] = useState(initialProposal?.cover_note ?? "");
  const [bidAmount, setBidAmount] = useState(
    initialProposal?.bid_amount_cents ? String(initialProposal.bid_amount_cents / 100) : ""
  );
  const [durationWeeks, setDurationWeeks] = useState(initialProposal?.estimated_duration_weeks ? String(initialProposal.estimated_duration_weeks) : "");
  const [availabilityHours, setAvailabilityHours] = useState(initialProposal?.availability_hours ? String(initialProposal.availability_hours) : "");
  const [proofLinks, setProofLinks] = useState((initialProposal?.proof_links ?? []).join("\n"));
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!initialProposal) return;
    setCoverNote(initialProposal.cover_note ?? "");
    setBidAmount(initialProposal.bid_amount_cents ? String(initialProposal.bid_amount_cents / 100) : "");
    setDurationWeeks(initialProposal.estimated_duration_weeks ? String(initialProposal.estimated_duration_weeks) : "");
    setAvailabilityHours(initialProposal.availability_hours ? String(initialProposal.availability_hours) : "");
    setProofLinks((initialProposal.proof_links ?? []).join("\n"));
  }, [initialProposal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError("");

    const amount = Math.round(Number(bidAmount) * 100);
    if (!Number.isFinite(amount) || amount <= 0) {
      setLocalError("Enter a valid bid amount.");
      return;
    }

    await onSubmit({
      cover_note: coverNote.trim(),
      pricing_model: pricingModel,
      bid_amount_cents: amount,
      estimated_duration_weeks: durationWeeks ? Number(durationWeeks) : null,
      availability_hours: availabilityHours ? Number(availabilityHours) : null,
      proof_links: proofLinks
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">Why are you a fit?</label>
        <textarea
          value={coverNote}
          onChange={(e) => setCoverNote(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">
            {pricingModel === "hourly" ? "Hourly Rate (USD)" : "Bid Amount (USD)"}
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">ETA (weeks)</label>
          <input
            type="number"
            min="1"
            max="52"
            value={durationWeeks}
            onChange={(e) => setDurationWeeks(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Availability (hrs/week)</label>
          <input
            type="number"
            min="1"
            max="80"
            value={availabilityHours}
            onChange={(e) => setAvailabilityHours(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">Proof Links</label>
        <textarea
          value={proofLinks}
          onChange={(e) => setProofLinks(e.target.value)}
          rows={3}
          placeholder={"https://github.com/you/project\nhttps://portfolio.dev"}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none"
        />
      </div>

      {(localError || error) && (
        <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {localError || error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-60"
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
