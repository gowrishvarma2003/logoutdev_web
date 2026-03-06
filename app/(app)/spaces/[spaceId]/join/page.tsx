"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useSpace } from "@/lib/hooks/useSpaces";
import { ArrowLeftIcon, RocketIcon } from "@/components/ui/Icons";
import * as api from "@/lib/services/spacesApi";
import Link from "next/link";

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
  const { space } = useSpace(spaceId);

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

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
          <RocketIcon className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Request Sent!</h2>
        <p className="text-sm text-zinc-400 max-w-sm mb-6">
          The project owner will review your request. You&apos;ll be notified once they respond.
        </p>
        <Link
          href={`/spaces/${spaceId}`}
          className="px-4 py-2 rounded-xl bg-zinc-800 text-sm text-white hover:bg-zinc-700 transition-colors"
        >
          Back to Space
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-3 pb-4 border-b border-zinc-800">
        <Link
          href={`/spaces/${spaceId}`}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-3"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Back to Overview
        </Link>
        <h2 className="text-base font-bold text-white">
          Request to Join {space?.name ?? "this space"}
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Tell the project owner why you&apos;d be a great fit.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 space-y-5">
        {/* Why join */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
            Why do you want to join? <span className="text-rose-400">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your motivation, what you can contribute…"
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none transition-colors"
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
            Relevant Skills
          </label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. React, Node.js, PostgreSQL (comma-separated)"
            className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
            Availability (hours/week)
          </label>
          <input
            type="number"
            min={1}
            max={80}
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="e.g. 10"
            className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        {/* Proof links */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
            Proof / Portfolio Links
          </label>
          <textarea
            value={proofLinks}
            onChange={(e) => setProofLinks(e.target.value)}
            placeholder={"https://github.com/yourname\nhttps://portfolio.dev"}
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none transition-colors"
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
          className="w-full py-3 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Submitting…" : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
