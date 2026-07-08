"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import { ArrowLeftIcon } from "@/components/ui/Icons";
import { useLaunch } from "@/lib/hooks/useLaunches";
import * as launchesApi from "@/lib/services/launchesApi";
import RichComposer from "@/components/ui/RichComposer";

export default function LaunchCollaboratePage({ params }: { params: Promise<{ launchId: string }> }) {
  const { launchId } = use(params);
  const router = useRouter();
  const { launch, loading, error } = useLaunch(launchId);
  const [message, setMessage] = useState("");
  const [skills, setSkills] = useState("");
  const [availabilityHours, setAvailabilityHours] = useState("");
  const [proofLinks, setProofLinks] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (error || !launch) {
    return <p className="p-4 text-sm text-rose-400">{error || "Launch not found."}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <Link href={`/launches/${launchId}`} className="mb-4 inline-flex items-center gap-1.5 text-xs text-text-disabled hover:text-text-secondary">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to launch
      </Link>

      <div className="rounded-3xl border border-border-default bg-surface/50 p-6">
        <h1 className="text-2xl font-bold text-text-primary">Request collaboration</h1>
        <p className="mt-1 text-sm text-text-disabled">Apply directly from the launch without exposing the linked private space.</p>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            setSaveError(null);
            try {
              await launchesApi.createLaunchCollaborationRequest(launchId, {
                message: message.trim(),
                skills: skills.split(",").map((item) => item.trim()).filter(Boolean),
                availability_hours: availabilityHours ? Number(availabilityHours) : null,
                proof_links: proofLinks.split("\n").map((item) => item.trim()).filter(Boolean),
              });
              router.push(`/launches/${launchId}`);
            } catch (err: unknown) {
              setSaveError(err instanceof Error ? err.message : "Failed to submit collaboration request");
            } finally {
              setSaving(false);
            }
          }}
          className="mt-6 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Why do you want to help?</label>
             <RichComposer value={message} onChange={(value) => setMessage(value)} rows={6} previewClassName="w-full rounded-xl border border-border-default bg-surface px-3 py-2.5 text-sm leading-relaxed text-text-primary" className="w-full px-3 py-2.5 text-sm leading-relaxed text-transparent caret-white focus:outline-none selection:bg-[#1d9bf0]/30" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Relevant skills</label>
            <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Product Design, Growth" className="w-full rounded-xl border border-border-default bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Availability (hours/week)</label>
            <input value={availabilityHours} onChange={(e) => setAvailabilityHours(e.target.value)} type="number" min="1" max="80" className="w-full rounded-xl border border-border-default bg-surface px-3 py-2.5 text-sm text-text-primary focus:border-border-strong focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Proof links</label>
            <textarea value={proofLinks} onChange={(e) => setProofLinks(e.target.value)} rows={3} placeholder={"https://github.com/you/project\nhttps://portfolio.example.com"} className="w-full rounded-xl border border-border-default bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none" />
          </div>

          {saveError ? <p className="text-sm text-rose-400">{saveError}</p> : null}

          <button type="submit" disabled={saving} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">
            {saving ? "Submitting..." : "Submit collaboration request"}
          </button>
        </form>
      </div>
    </div>
  );
}
