"use client";

import { useEffect, useState } from "react";
import { useSpaceList } from "@/lib/hooks/useSpaces";
import type { Launch, LaunchDevelopmentStage, LaunchProductType } from "@/lib/types";

interface LaunchFormProps {
  initialLaunch?: Partial<Launch> | null;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (payload: {
    name: string;
    tagline: string;
    description: string;
    product_type: LaunchProductType;
    development_stage: LaunchDevelopmentStage;
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
      {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
    </div>
  );
}

export default function LaunchForm({
  initialLaunch,
  submitLabel,
  loading = false,
  error = null,
  onSubmit,
}: LaunchFormProps) {
  const { data: mySpacesData, loading: spacesLoading } = useSpaceList({ mine: true, limit: 100 });
  const [name, setName] = useState(initialLaunch?.name ?? "");
  const [tagline, setTagline] = useState(initialLaunch?.tagline ?? "");
  const [description, setDescription] = useState(initialLaunch?.description ?? "");
  const [productType, setProductType] = useState<LaunchProductType>(
    initialLaunch?.product_type ?? "web-app"
  );
  const [developmentStage, setDevelopmentStage] = useState<LaunchDevelopmentStage>(
    initialLaunch?.development_stage ?? "mvp"
  );
  const [demoUrl, setDemoUrl] = useState(initialLaunch?.demo_url ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initialLaunch?.website_url ?? "");
  const [githubUrl, setGithubUrl] = useState(initialLaunch?.github_url ?? "");
  const [docsUrl, setDocsUrl] = useState(initialLaunch?.docs_url ?? "");
  const [collaborationMode, setCollaborationMode] = useState<"off" | "looking">(
    initialLaunch?.collaboration_mode ?? "off"
  );
  const [collaborationNote, setCollaborationNote] = useState(
    initialLaunch?.collaboration_note ?? ""
  );
  const [collaborationRoles, setCollaborationRoles] = useState(joinRoles(initialLaunch));
  const [linkedSpaceId, setLinkedSpaceId] = useState(
    initialLaunch?.linked_space?.id ?? initialLaunch?.linked_space_id ?? ""
  );
  const [screenshots, setScreenshots] = useState(joinScreenshots(initialLaunch));
  const [techStack, setTechStack] = useState(joinTechStack(initialLaunch));
  const [localError, setLocalError] = useState<string | null>(null);

  const linkedSpaceOptions = mySpacesData?.spaces ?? [];

  useEffect(() => {
    if (!initialLaunch) return;
    setName(initialLaunch.name ?? "");
    setTagline(initialLaunch.tagline ?? "");
    setDescription(initialLaunch.description ?? "");
    setProductType(initialLaunch.product_type ?? "web-app");
    setDevelopmentStage(initialLaunch.development_stage ?? "mvp");
    setDemoUrl(initialLaunch.demo_url ?? "");
    setWebsiteUrl(initialLaunch.website_url ?? "");
    setGithubUrl(initialLaunch.github_url ?? "");
    setDocsUrl(initialLaunch.docs_url ?? "");
    setCollaborationMode(initialLaunch.collaboration_mode ?? "off");
    setCollaborationNote(initialLaunch.collaboration_note ?? "");
    setCollaborationRoles(joinRoles(initialLaunch));
    setLinkedSpaceId(initialLaunch.linked_space?.id ?? initialLaunch.linked_space_id ?? "");
    setScreenshots(joinScreenshots(initialLaunch));
    setTechStack(joinTechStack(initialLaunch));
  }, [initialLaunch]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);

    const screenshotList = screenshots
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const techStackList = techStack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const roles = collaborationRoles
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (screenshotList.length > 6) {
      setLocalError("You can add at most 6 screenshot URLs.");
      return;
    }
    if (techStackList.length > 12) {
      setLocalError("You can add at most 12 tech stack items.");
      return;
    }

    await onSubmit({
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      product_type: productType,
      development_stage: developmentStage,
      demo_url: demoUrl.trim() || undefined,
      website_url: websiteUrl.trim() || undefined,
      github_url: githubUrl.trim() || undefined,
      docs_url: docsUrl.trim() || undefined,
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
      {/* ── Section 1: Product identity ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <SectionHeader
          title="Product identity"
          description="The core information about what you are building."
        />
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Product name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Devboard"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Tagline</label>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="One-sentence pitch"
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Product type</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value as LaunchProductType)}
                className={selectClass}
              >
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
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Development stage
              </label>
              <select
                value={developmentStage}
                onChange={(e) => setDevelopmentStage(e.target.value as LaunchDevelopmentStage)}
                className={selectClass}
              >
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
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Description
              <span className="ml-1 text-zinc-600">(explain the problem, solution, and who it is for)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={7}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── Section 2: Media & tech ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <SectionHeader
          title="Media & tech stack"
          description="Paste screenshot URLs (one per line, up to 6) and list the technologies used."
        />
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Screenshot URLs
            </label>
            <textarea
              value={screenshots}
              onChange={(e) => setScreenshots(e.target.value)}
              rows={4}
              placeholder={"https://example.com/screenshot-1.png\nhttps://example.com/screenshot-2.png"}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Tech stack
              <span className="ml-1 text-zinc-600">(comma-separated)</span>
            </label>
            <input
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="Next.js, Tailwind, PostgreSQL"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: Links ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <SectionHeader
          title="External links"
          description="Help the community try your product and explore your code."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Demo URL</label>
            <input
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://demo.example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Website URL</label>
            <input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">GitHub URL</label>
            <input
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/you/repo"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Docs URL</label>
            <input
              value={docsUrl}
              onChange={(e) => setDocsUrl(e.target.value)}
              placeholder="https://docs.example.com"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── Section 4: Collaboration ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <SectionHeader
          title="Collaboration"
          description="Tell the community whether you are looking for contributors and what kind of help you need."
        />
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Collaboration mode
              </label>
              <select
                value={collaborationMode}
                onChange={(e) => setCollaborationMode(e.target.value as "off" | "looking")}
                className={selectClass}
              >
                <option value="off">Not looking right now</option>
                <option value="looking">Actively looking</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Linked space
              </label>
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
                {spacesLoading
                  ? "Loading your spaces…"
                  : "Connect to one of your owner or maintainer spaces."}
              </p>
            </div>
          </div>

          {collaborationMode === "looking" && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Roles you need
                  <span className="ml-1 text-zinc-600">(comma-separated)</span>
                </label>
                <input
                  value={collaborationRoles}
                  onChange={(e) => setCollaborationRoles(e.target.value)}
                  placeholder="Frontend, Design, Growth"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Collaboration note
                </label>
                <textarea
                  value={collaborationNote}
                  onChange={(e) => setCollaborationNote(e.target.value)}
                  rows={3}
                  placeholder="Describe what collaborators will work on and what you expect from them"
                  className={inputClass}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error + submit */}
      {(localError || error) && (
        <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {localError || error}
        </p>
      )}

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
            <option value="open-source">Open Source</option>
            <option value="experimental">Experimental</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Development stage</label>
          <select value={developmentStage} onChange={(e) => setDevelopmentStage(e.target.value as LaunchDevelopmentStage)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none">
            <option value="prototype">Prototype</option>
            <option value="mvp">MVP</option>
            <option value="beta">Beta</option>
            <option value="live">Live</option>
            <option value="maintained">Maintained</option>
            <option value="paused">Paused</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Demo URL</label>
          <input value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Website URL</label>
          <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">GitHub URL</label>
          <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Docs URL</label>
          <input value={docsUrl} onChange={(e) => setDocsUrl(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Collaboration mode</label>
          <select value={collaborationMode} onChange={(e) => setCollaborationMode(e.target.value as "off" | "looking")} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none">
            <option value="off">Off</option>
            <option value="looking">Looking</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Linked space</label>
          <select value={linkedSpaceId} onChange={(e) => setLinkedSpaceId(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none" disabled={spacesLoading}>
            <option value="">No linked space</option>
            {linkedSpaceOptions.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-zinc-500">
            {spacesLoading ? "Loading your spaces..." : "Choose one of your owner or maintainer spaces to connect this launch."}
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Collaboration note</label>
          <textarea value={collaborationNote} onChange={(e) => setCollaborationNote(e.target.value)} rows={3} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Collaboration roles</label>
          <input value={collaborationRoles} onChange={(e) => setCollaborationRoles(e.target.value)} placeholder="Frontend, Growth, Design" className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Screenshot URLs</label>
          <textarea value={screenshots} onChange={(e) => setScreenshots(e.target.value)} rows={4} placeholder={"https://example.com/shot-1.png\nhttps://example.com/shot-2.png"} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Tech stack</label>
          <input value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="Next.js, Express, PostgreSQL" className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none" />
        </div>
      </div>

      {(localError || error) && (
        <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{localError || error}</p>
      )}

      <button type="submit" disabled={loading} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 disabled:opacity-60">
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}