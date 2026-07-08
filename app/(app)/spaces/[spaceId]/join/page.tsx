"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useSpace } from "@/lib/hooks/useSpaces";
import Spinner from "@/components/ui/Spinner";
import { ArrowLeftIcon, RocketIcon } from "@/components/ui/Icons";
import * as api from "@/lib/services/spacesApi";
import Link from "next/link";
import RichComposer from "@/components/ui/RichComposer";

/**
 * /spaces/[spaceId]/join — Guided join request form.
 */
export default function JoinRequestPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);
  const router = useRouter();
  const { space, loading: spaceLoading } = useSpace(spaceId);

  const [message, setMessage] = useState("");
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState("");
  const [proofLinks, setProofLinks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please share why you want to join.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const skillList = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const links = proofLinks
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      await api.createJoinRequest(spaceId, {
        message: message.trim(),
        skills: skillList.length ? skillList : undefined,
        availability_hours: availability ? parseInt(availability, 10) : undefined,
        proof_links: links.length ? links : undefined,
      });

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  if (spaceLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
          <RocketIcon className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Request Sent!</h2>
        <p className="text-sm text-text-muted max-w-sm mb-6">
          The project owner will review your request. You&apos;ll be notified once they respond.
        </p>
        <Link
          href={`/spaces/${spaceId}`}
          className="px-4 py-2 rounded-xl bg-surface-hover text-sm text-text-primary hover:bg-surface-active transition-colors"
        >
          Back to Space
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-3 pb-4 border-b border-border-default">
        <Link
          href={`/spaces/${spaceId}`}
          className="inline-flex items-center gap-1 text-xs text-text-disabled hover:text-text-secondary transition-colors mb-3"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Back to Overview
        </Link>
        <h2 className="text-base font-bold text-text-primary">
          Request to Join {space?.name ?? "this space"}
        </h2>
        <p className="text-sm text-text-disabled mt-1">
          Tell the project owner why you&apos;d be a great fit.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 space-y-5">
        {/* Why join */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            Why do you want to join? <span className="text-rose-400">*</span>
          </label>
          <RichComposer
            value={message}
            onChange={(value) => setMessage(value)}
            placeholder="Share your motivation, what you can contribute…"
            rows={4}
            previewClassName="w-full rounded-xl border border-border-default bg-surface px-3 py-2.5 text-sm leading-relaxed text-text-primary"
             className="w-full resize-none px-3 py-2.5 text-sm leading-relaxed text-transparent caret-white placeholder:text-text-disabled focus:outline-none transition-colors selection:bg-[#1d9bf0]/30"
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            Relevant Skills
          </label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. React, Node.js, PostgreSQL (comma-separated)"
            className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-default text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-strong transition-colors"
          />
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            Availability (hours/week)
          </label>
          <input
            type="number"
            min={1}
            max={80}
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="e.g. 10"
            className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-default text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-strong transition-colors"
          />
        </div>

        {/* Proof links */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            Proof / Portfolio Links
          </label>
          <textarea
            value={proofLinks}
            onChange={(e) => setProofLinks(e.target.value)}
            placeholder={"https://github.com/yourname\nhttps://portfolio.dev"}
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-default text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-strong resize-none transition-colors"
          />
        </div>

        {error && (
          <p className="text-sm text-rose-400 bg-rose-500/10 px-4 py-2.5 rounded-xl">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Submitting…" : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
