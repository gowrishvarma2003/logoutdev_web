"use client";

import { useEffect, useRef, useState } from "react";
import { useSpaceList } from "@/lib/hooks/useSpaces";
import { useRepositoryList } from "@/lib/hooks/useRepos";
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
    is_open_source: boolean;
    repo_ids: string[];
    screenshots: string[];
    image_files: File[];
    tech_stack: string[];
  }) => Promise<void> | void;
}

function joinTechStack(launch?: Partial<Launch> | null) {
  return (launch?.tech_stack ?? []).map((item) => item.technology).join(", ");
}

function joinRoles(launch?: Partial<Launch> | null) {
  return (launch?.collaboration_roles ?? []).join(", ");
}

function initialRepoIds(launch?: Partial<Launch> | null) {
  return (launch?.linked_repos ?? []).map((entry) => entry.repo_id).filter(Boolean);
}

const inputClass =
  "w-full rounded-xl border border-border-default bg-app px-3 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none transition-colors";

const selectClass =
  "w-full rounded-xl border border-border-default bg-app px-3 py-2.5 text-sm text-text-primary focus:border-border-strong focus:outline-none transition-colors";

const MIN_LAUNCH_IMAGES = 4;
const MAX_LAUNCH_IMAGES = 6;
const MAX_LAUNCH_REPOS = 6;

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
      {description ? <p className="mt-0.5 text-xs text-text-disabled">{description}</p> : null}
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
  const { repos: myRepos, loading: reposLoading } = useRepositoryList({ scope: "mine", limit: 100 });
  const [isOpenSource, setIsOpenSource] = useState(initialLaunch?.is_open_source ?? false);
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>(initialRepoIds(initialLaunch));
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
  const [existingScreenshots, setExistingScreenshots] = useState(
    (initialLaunch?.screenshots ?? []).map((item) => item.image_url)
  );
  const [pendingImages, setPendingImages] = useState<Array<{ file: File; previewUrl: string }>>([]);
  const [techStack, setTechStack] = useState(joinTechStack(initialLaunch));
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef(new Set<string>());

  const linkedSpaceOptions = mySpacesData?.spaces ?? [];

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function handleImageSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    setLocalError(null);
    const currentCount = existingScreenshots.length + pendingImages.length;
    if (currentCount + files.length > MAX_LAUNCH_IMAGES) {
      const remaining = Math.max(0, MAX_LAUNCH_IMAGES - currentCount);
      setLocalError(`You can add ${remaining} more image${remaining === 1 ? "" : "s"}.`);
      return;
    }
    const invalidFile = files.find((file) => !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type));
    if (invalidFile) {
      setLocalError("Only PNG, JPG, WebP, or GIF images can be uploaded.");
      return;
    }
    if (files.some((file) => file.size > 10 * 1024 * 1024)) {
      setLocalError("Each image must be 10MB or smaller.");
      return;
    }

    const selected = files.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      return { file, previewUrl };
    });
    setPendingImages((current) => [...current, ...selected]);
  }

  function removeScreenshot(index: number) {
    if (index < existingScreenshots.length) {
      setExistingScreenshots((current) => current.filter((_, itemIndex) => itemIndex !== index));
      return;
    }

    const pendingIndex = index - existingScreenshots.length;
    setPendingImages((current) => current.filter((image, itemIndex) => {
      if (itemIndex !== pendingIndex) return true;
      URL.revokeObjectURL(image.previewUrl);
      previewUrlsRef.current.delete(image.previewUrl);
      return false;
    }));
  }

  function toggleRepo(repoId: string) {
    setSelectedRepoIds((current) => {
      if (current.includes(repoId)) {
        return current.filter((id) => id !== repoId);
      }
      if (current.length >= MAX_LAUNCH_REPOS) return current;
      return [...current, repoId];
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);

    const imageCount = existingScreenshots.length + pendingImages.length;
    const techStackList = techStack
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const roles = collaborationRoles
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (imageCount > MAX_LAUNCH_IMAGES) {
      setLocalError(`You can add at most ${MAX_LAUNCH_IMAGES} screenshots.`);
      return;
    }
    if (publishOnSubmit && imageCount < MIN_LAUNCH_IMAGES) {
      setLocalError(`Add at least ${MIN_LAUNCH_IMAGES} product images before launching.`);
      return;
    }
    if (isOpenSource) {
      if (selectedRepoIds.length < 1) {
        setLocalError("Open source launches must link at least one repo.");
        return;
      }
      if (!linkedSpaceId.trim()) {
        setLocalError("Open source launches must be linked to a space.");
        return;
      }
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
      is_open_source: isOpenSource,
      repo_ids: isOpenSource ? selectedRepoIds : [],
      screenshots: existingScreenshots,
      image_files: pendingImages.map((image) => image.file),
      tech_stack: techStackList,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-2xl border border-border-default bg-surface/50 p-5">
        <SectionHeader
          title="Source & workspace"
          description="Open source launches connect your repos and a workspace so contributors can jump in."
        />

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              { value: true, label: "Open source", hint: "Link repos and a workspace for contributors." },
              { value: false, label: "Closed source", hint: "Private project. A workspace is optional." },
            ] as const).map((option) => {
              const active = isOpenSource === option.value;
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setIsOpenSource(option.value)}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    active
                      ? "border-sky-500/40 bg-sky-500/10"
                      : "border-border-default bg-app/60 hover:border-border-strong"
                  }`}
                >
                  <p className="text-sm font-semibold text-text-primary">{option.label}</p>
                  <p className="mt-1 text-xs leading-6 text-text-muted">{option.hint}</p>
                </button>
              );
            })}
          </div>

          {isOpenSource ? (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Repos <span className="text-text-disabled">(required · up to {MAX_LAUNCH_REPOS})</span>
              </label>
              {reposLoading ? (
                <p className="rounded-xl border border-border-default bg-app/70 px-3 py-3 text-xs text-text-disabled">
                  Loading your repos…
                </p>
              ) : myRepos.length === 0 ? (
                <p className="rounded-xl border border-border-default bg-app/70 px-3 py-3 text-xs text-text-disabled">
                  You don&apos;t have any repos yet. Create a repo first, then link it here.
                </p>
              ) : (
                <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {myRepos.map((repo) => {
                    const selected = selectedRepoIds.includes(repo.id);
                    const disabled = !selected && selectedRepoIds.length >= MAX_LAUNCH_REPOS;
                    return (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => toggleRepo(repo.id)}
                        disabled={disabled}
                        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          selected
                            ? "border-sky-500/40 bg-sky-500/10 text-text-primary"
                            : "border-border-default bg-app/60 text-text-secondary hover:border-border-strong"
                        }`}
                      >
                        <span className="truncate">{repo.name}</span>
                        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] uppercase ${repo.visibility === "public" ? "bg-emerald-500/10 text-emerald-400" : "bg-surface-hover text-text-muted"}`}>
                          {repo.visibility}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedRepoIds.length > 0 ? (
                <p className="mt-1.5 text-[11px] text-text-disabled">
                  {selectedRepoIds.length} repo{selectedRepoIds.length === 1 ? "" : "s"} selected.
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              Linked space {isOpenSource ? <span className="text-text-disabled">(required)</span> : null}
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
            <p className="mt-1 text-[11px] text-text-disabled">
              {spacesLoading
                ? "Loading your spaces…"
                : isOpenSource
                  ? "Open source launches must connect to one of your owner or maintainer spaces."
                  : "Optional. Connect to one of your owner or maintainer spaces."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border-default bg-surface/50 p-5">
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
                    : "border-border-default bg-app/60 hover:border-border-strong"
                }`}
              >
                <p className="text-sm font-semibold text-text-primary">{phase === "beta" ? "Beta launch" : "Live launch"}</p>
                <p className="mt-1 text-xs leading-6 text-text-muted">
                  {phase === "beta"
                    ? "Public page, private beta access, and manual approvals."
                    : "Public product link, reviews, and open launch feedback."}
                </p>
              </button>
            );
          })}
        </div>

        {sourceHint ? (
          <p className="mt-4 rounded-xl border border-border-default bg-app/70 px-3 py-2 text-xs text-text-muted">
            {sourceHint}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border-default bg-surface/50 p-5">
        <SectionHeader
          title="Product basics"
          description="The first screen should make the product and audience clear immediately."
        />
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Product name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Devboard" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Tagline</label>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One-sentence pitch" className={inputClass} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Product type</label>
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
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Development stage</label>
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
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={7} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border-default bg-surface/50 p-5">
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
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Beta seats</label>
                <input
                  value={betaCapacity}
                  onChange={(e) => setBetaCapacity(e.target.value)}
                  inputMode="numeric"
                  placeholder="50"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Beta access link</label>
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
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Public product link</label>
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

      <div className="rounded-2xl border border-border-default bg-surface/50 p-5">
        <SectionHeader
          title="Media & stack"
          description="Keep the public page light, but include enough proof for people to decide quickly."
        />
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Product images</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="sr-only"
              onChange={handleImageSelection}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={existingScreenshots.length + pendingImages.length >= MAX_LAUNCH_IMAGES}
              className="flex w-full items-center justify-center rounded-xl border border-dashed border-border-strong bg-app/70 px-4 py-6 text-sm font-medium text-text-secondary transition-colors hover:border-zinc-500 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Choose images from your device
            </button>
            <p className="mt-1.5 text-[11px] text-text-disabled">PNG, JPG, WebP, or GIF. {MIN_LAUNCH_IMAGES}–{MAX_LAUNCH_IMAGES} images, 10MB each.</p>

            {existingScreenshots.length + pendingImages.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ...existingScreenshots,
                  ...pendingImages.map((image) => image.previewUrl),
                ].map((url, index) => (
                  <div key={`${url}-${index}`} className="group relative aspect-video overflow-hidden rounded-xl border border-border-default bg-app">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Launch image ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(index)}
                      aria-label={`Remove launch image ${index + 1}`}
                      className="absolute right-1.5 top-1.5 rounded-lg bg-app/85 px-2 py-1 text-xs text-text-secondary opacity-100 transition-opacity hover:bg-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Tech stack</label>
            <input
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="Next.js, Tailwind, PostgreSQL"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <details className="rounded-2xl border border-border-default bg-surface/50 p-5">
        <summary className="cursor-pointer list-none text-sm font-semibold text-text-secondary">Advanced details</summary>

        <div className="mt-5 space-y-8">
          <div>
            <SectionHeader title="Extra links" description="Add supporting links without crowding the first screen." />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Website URL</label>
                <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">GitHub URL</label>
                <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/you/repo" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Docs URL</label>
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
        className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
