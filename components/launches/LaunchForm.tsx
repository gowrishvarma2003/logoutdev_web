"use client";

import { useState } from "react";
import { useSpaceList } from "@/lib/hooks/useSpaces";
import type {
  Launch,
  LaunchDevelopmentStage,
  LaunchPhase,
  LaunchProductType,
} from "@/lib/types";

interface LaunchFormProps {
  initialLaunch?: Partial<Launch> | null;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  sourceHint?: string | null;
  publishOnSubmit?: boolean;
  onSubmit: (payload: {
    name: string;
    tagline: string;
    description: string;
    product_type: LaunchProductType;
    development_stage: LaunchDevelopmentStage;
    launch_phase: LaunchPhase;
    beta_capacity?: number | null;
    beta_access_url?: string;
    live_url?: string;
    demo_url?: string;
    website_url?: string;
    github_url?: string;
    docs_url?: string;
    collaboration_mode: "off" | "looking";
    collaboration_note?: string;
    collaboration_roles: string[];
    linked_space_id?: string | null;
    screenshots: string[];
    tech_stack: string[];
  }) => Promise<void> | void;
}

function joinTechStack(launch?: Partial<Launch> | null) {
  return (launch?.tech_stack ?? []).map((item) => item.technology).join(", ");
}

function joinScreenshots(launch?: Partial<Launch> | null) {
  return (launch?.screenshots ?? []).map((item) => item.image_url).join("\n");
}

function joinRoles(launch?: Partial<Launch> | null) {
  return (launch?.collaboration_roles ?? []).join(", ");
}

const inputClass =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none transition-colors";

const selectClass =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none transition-colors";

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      {description ? <p className="mt-0.5 text-xs text-zinc-500">{description}</p> : null}
    </div>
  );
}

export default function LaunchForm({
  initialLaunch,
  submitLabel,
  loading = false,
  error = null,
  sourceHint = null,
  publishOnSubmit = false,
  onSubmit,
}: LaunchFormProps) {
  const { data: mySpacesData, loading: spacesLoading } = useSpaceList({ mine: true, limit: 100 });
  const [name, setName] = useState(initialLaunch?.name ?? "");
  const [tagline, setTagline] = useState(initialLaunch?.tagline ?? "");
  const [description, setDescription] = useState(initialLaunch?.description ?? "");
  const [productType, setProductType] = useState<LaunchProductType>(initialLaunch?.product_type ?? "web-app");
  const [developmentStage, setDevelopmentStage] = useState<LaunchDevelopmentStage>(
    initialLaunch?.development_stage ?? "mvp"
  );
  const [launchPhase, setLaunchPhase] = useState<LaunchPhase>(initialLaunch?.launch_phase ?? "beta");
  const [betaCapacity, setBetaCapacity] = useState(
    initialLaunch?.beta_capacity ? String(initialLaunch.beta_capacity) : "50"
  );
  const [betaAccessUrl, setBetaAccessUrl] = useState(initialLaunch?.beta_access_url ?? "");
  const [liveUrl, setLiveUrl] = useState(initialLaunch?.live_url ?? initialLaunch?.demo_url ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initialLaunch?.website_url ?? "");
  const [githubUrl, setGithubUrl] = useState(initialLaunch?.github_url ?? "");
  const [docsUrl, setDocsUrl] = useState(initialLaunch?.docs_url ?? "");
  const [collaborationMode, setCollaborationMode] = useState<"off" | "looking">(
    initialLaunch?.collaboration_mode ?? "off"
  );
  const [collaborationNote, setCollaborationNote] = useState(initialLaunch?.collaboration_note ?? "");
  const [collaborationRoles, setCollaborationRoles] = useState(joinRoles(initialLaunch));
  const [linkedSpaceId, setLinkedSpaceId] = useState(
    initialLaunch?.linked_space?.id ?? initialLaunch?.linked_space_id ?? ""
  );
  const [screenshots, setScreenshots] = useState(joinScreenshots(initialLaunch));
  const [techStack, setTechStack] = useState(joinTechStack(initialLaunch));
  const [localError, setLocalError] = useState<string | null>(null);

  const linkedSpaceOptions = mySpacesData?.spaces ?? [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);

    const screenshotList = screenshots
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    const techStackList = techStack
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const roles = collaborationRoles
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (screenshotList.length > 6) {
      setLocalError("You can add at most 6 screenshot URLs.");
      return;
    }
    if (publishOnSubmit && screenshotList.length < 1) {
      setLocalError("Add at least one screenshot before launching.");
      return;
    }
    if (techStackList.length > 12) {
      setLocalError("You can add at most 12 tech stack items.");
      return;
    }
    if (launchPhase === "beta") {
      const parsedCapacity = Number(betaCapacity);
      if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
        setLocalError("Beta launches need a seat limit of at least 1.");
        return;
      }
      if (!betaAccessUrl.trim()) {
        setLocalError("Beta launches need a beta access link.");
        return;
      }
    }
    if (launchPhase === "live" && !liveUrl.trim()) {
      setLocalError("Live launches need a public product link.");
      return;
    }

    await onSubmit({
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      product_type: productType,
      development_stage: developmentStage,
      launch_phase: launchPhase,
      beta_capacity: launchPhase === "beta" ? Number(betaCapacity) : null,
      beta_access_url: launchPhase === "beta" ? betaAccessUrl.trim() || undefined : undefined,
      live_url: launchPhase === "live" ? liveUrl.trim() || undefined : undefined,
      website_url: websiteUrl.trim() || undefined,
      github_url: githubUrl.trim() || undefined,
      docs_url: docsUrl.trim() || undefined,
      demo_url: launchPhase === "live" ? liveUrl.trim() || undefined : undefined,
      collaboration_mode: collaborationMode,
      collaboration_note: collaborationNote.trim() || undefined,
      collaboration_roles: roles,
      linked_space_id: linkedSpaceId.trim() || null,
      screenshots: screenshotList,
      tech_stack: techStackList,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <SectionHeader
          title="Launch mode"
          description="Choose whether you are gathering beta users or shipping the public product."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {(["beta", "live"] as LaunchPhase[]).map((phase) => {
            const active = launchPhase === phase;
            return (
              <button
                key={phase}
                type="button"
                onClick={() => setLaunchPhase(phase)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  active
                    ? "border-sky-500/40 bg-sky-500/10"
                    : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                }`}
              >
                <p className="text-sm font-semibold text-white">{phase === "beta" ? "Beta launch" : "Live launch"}</p>
                <p className="mt-1 text-xs leading-6 text-zinc-400">
                  {phase === "beta"
                    ? "Public page, private beta access, and manual approvals."
                    : "Public product link, reviews, and open launch feedback."}
                </p>
              </button>
            );
          })}
        </div>

        {sourceHint ? (
          <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-400">
            {sourceHint}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <SectionHeader
          title="Product basics"
          description="The first screen should make the product and audience clear immediately."
        />
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Product name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Devboard" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Tagline</label>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One-sentence pitch" className={inputClass} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Product type</label>
              <select value={productType} onChange={(e) => setProductType(e.target.value as LaunchProductType)} className={selectClass}>
                <option value="web-app">Web App</option>
                <option value="mobile-app">Mobile App</option>
                <option value="developer-tool">Developer Tool</option>
                <option value="api">API</option>
                <option value="ai-tool">AI Tool</option>
                <option value="open-source">Open Source</option>
                <option value="experimental">Experimental</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Development stage</label>
              <select value={developmentStage} onChange={(e) => setDevelopmentStage(e.target.value as LaunchDevelopmentStage)} className={selectClass}>
                <option value="prototype">Prototype</option>
                <option value="mvp">MVP</option>
                <option value="beta">Beta</option>
                <option value="live">Live</option>
                <option value="maintained">Maintained</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={7} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <SectionHeader
          title={launchPhase === "beta" ? "Beta access" : "Live access"}
          description={launchPhase === "beta"
            ? "Keep the launch public while controlling who gets the beta link."
            : "Share the public product link you want everyone to try on launch day."}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {launchPhase === "beta" ? (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Beta seats</label>
                <input
                  value={betaCapacity}
                  onChange={(e) => setBetaCapacity(e.target.value)}
                  inputMode="numeric"
                  placeholder="50"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Beta access link</label>
                <input
                  value={betaAccessUrl}
                  onChange={(e) => setBetaAccessUrl(e.target.value)}
                  placeholder="https://beta.example.com/invite"
                  className={inputClass}
                />
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Public product link</label>
              <input
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://example.com"
                className={inputClass}
              />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <SectionHeader
          title="Media & stack"
          description="Keep the public page light, but include enough proof for people to decide quickly."
        />
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Screenshot URLs</label>
            <textarea
              value={screenshots}
              onChange={(e) => setScreenshots(e.target.value)}
              rows={4}
              placeholder={"https://example.com/screenshot-1.png\nhttps://example.com/screenshot-2.png"}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Tech stack</label>
            <input
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="Next.js, Tailwind, PostgreSQL"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <details className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-200">Advanced details</summary>

        <div className="mt-5 space-y-8">
          <div>
            <SectionHeader title="Workspace connection" description="Link the launch to the space where the product is being built." />
            <select
              value={linkedSpaceId}
              onChange={(e) => setLinkedSpaceId(e.target.value)}
              className={selectClass}
              disabled={spacesLoading}
            >
              <option value="">No linked space</option>
              {linkedSpaceOptions.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-zinc-600">
              {spacesLoading ? "Loading your spaces…" : "Connect to one of your owner or maintainer spaces."}
            </p>
          </div>

          <div>
            <SectionHeader title="Extra links" description="Add supporting links without crowding the first screen." />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Website URL</label>
                <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">GitHub URL</label>
                <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/you/repo" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Docs URL</label>
                <input value={docsUrl} onChange={(e) => setDocsUrl(e.target.value)} placeholder="https://docs.example.com" className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <SectionHeader title="Collaboration" description="Only surface this if you want contributors from the linked space flow." />
            <div className="space-y-4">
              <select value={collaborationMode} onChange={(e) => setCollaborationMode(e.target.value as "off" | "looking")} className={selectClass}>
                <option value="off">Not looking right now</option>
                <option value="looking">Actively looking</option>
              </select>

              {collaborationMode === "looking" ? (
                <>
                  <input
                    value={collaborationRoles}
                    onChange={(e) => setCollaborationRoles(e.target.value)}
                    placeholder="Frontend, Design, Growth"
                    className={inputClass}
                  />
                  <textarea
                    value={collaborationNote}
                    onChange={(e) => setCollaborationNote(e.target.value)}
                    rows={3}
                    placeholder="Describe what collaborators will help with"
                    className={inputClass}
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>
      </details>

      {(localError || error) ? (
        <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{localError || error}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
