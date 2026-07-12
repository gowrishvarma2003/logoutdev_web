"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { useOpportunityProfile } from "@/lib/hooks/useOpportunityProfile";
import {
  opportunitiesApi,
  type CandidateExperience,
  type CandidateExternalProfile,
  type OpportunityPreview,
  type CandidatePreference,
  type EmploymentType,
  type OpportunityVisibility,
  type RemotePreference,
  type SeniorityTarget,
} from "@/lib/services/opportunitiesApi";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  EyeIcon,
  GlobeIcon,
  LinkIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/ui/Icons";

const fieldClass = "w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none";
const labelClass = "block text-xs font-medium text-text-muted mb-1.5";

const employmentTypes: EmploymentType[] = ["internship", "full_time", "part_time", "contract", "freelance", "cofounder", "open_source_maintainer"];
const seniorityTargets: SeniorityTarget[] = ["intern", "junior", "mid", "senior", "lead", "staff", "flexible"];
const remoteOptions: RemotePreference[] = ["remote", "hybrid", "onsite", "flexible"];
const visibilityOptions: OpportunityVisibility[] = ["private", "verified_companies", "public"];

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function joinList(value?: string[] | null) {
  return (value || []).join(", ");
}

function pretty(value: string) {
  return value.replaceAll("_", " ");
}

function StatusPill({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs ${active ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-border-default bg-surface-muted text-text-muted"}`}>
      {children}
    </span>
  );
}

export default function OpportunitySettings() {
  const { profile, loading, error, refetch } = useOpportunityProfile();
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [preview, setPreview] = useState<OpportunityPreview | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const preference = profile?.preference;
  const [form, setForm] = useState<CandidatePreference | null>(null);
  const editable = form || preference || null;

  useEffect(() => {
    if (preference && !form) setForm(preference);
  }, [preference, form]);

  async function run<T>(key: string, action: () => Promise<T>, onDone?: (value: T) => void) {
    setSaving(key);
    setFailure(null);
    setMessage(null);
    try {
      const result = await action();
      onDone?.(result);
      setMessage("Saved.");
      await refetch();
    } catch (err) {
      setFailure(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(null);
    }
  }

  async function savePreference() {
    if (!editable) return;
    await run("preference", () => opportunitiesApi.savePreference(editable), (result) => setForm(result.preference));
  }

  async function addExperience() {
    await run("experience", () => opportunitiesApi.createExperience({
      organization_name: "Organization",
      title: "Developer",
      employment_type: "full_time",
      remote_type: "flexible",
      start_date: new Date().toISOString().slice(0, 10),
      skills: [],
      visibility: "verified_companies",
      display_order: profile?.experiences.length || 0,
    }));
  }

  async function saveExperience(item: CandidateExperience) {
    await run(`experience-${item.id}`, () => opportunitiesApi.updateExperience(item.id, item));
  }

  async function addExternalProfile() {
    await run("external", () => opportunitiesApi.createExternalProfile({
      type: "github",
      label: "GitHub",
      url: "https://github.com/",
      visibility: "verified_companies",
      display_order: profile?.external_profiles.length || 0,
    }));
  }

  async function uploadResume() {
    if (!resumeFile) return;
    await run("resume", () => opportunitiesApi.uploadResume(resumeFile), () => setResumeFile(null));
  }

  async function downloadResume() {
    await run("resume-download", () => opportunitiesApi.getResumeDownloadUrl(), (result) => {
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  async function loadPreview() {
    await run("preview", () => opportunitiesApi.getPreview(), (result) => setPreview(result.preview));
  }

  async function toggleOpportunityRequests() {
    if (!editable) return;
    const paused = !editable.opportunity_requests_paused_at;
    await run("pause-requests", () => opportunitiesApi.pauseOpportunityRequests(paused), (result) => {
      setForm({ ...editable, opportunity_requests_paused_at: result.paused_at });
    });
  }

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (error || !profile || !editable) {
    return (
      <div className="px-5 py-8">
        <Alert tone="danger" title="Opportunity settings unavailable">{error || "Could not load settings."}</Alert>
        <Button className="mt-4" variant="outline" onClick={refetch}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-border-default bg-app/90 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/settings/profile" className="rounded-full p-1.5 text-text-muted transition-colors hover:bg-surface-hover" aria-label="Back to profile settings">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <BriefcaseIcon className="h-4 w-4 text-text-muted" />
          <h1 className="text-[15px] font-bold text-text-primary">Opportunity Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-5 py-6">
        {failure ? <Alert tone="danger">{failure}</Alert> : null}
        {message ? <Alert tone="success">{message}</Alert> : null}

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Status and Visibility</h2>
                <p className="mt-1 text-xs text-text-disabled">Companies cannot discover you unless you explicitly choose an open status and company visibility.</p>
              </div>
              <StatusPill active={editable.company_visible}>{editable.company_visible ? "Company visible" : "Hidden from companies"}</StatusPill>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <label>
                <span className={labelClass}>Opportunity status</span>
                <select className={fieldClass} value={editable.status} onChange={(event) => setForm({ ...editable, status: event.target.value as CandidatePreference["status"] })}>
                  <option value="not_looking">Not looking</option>
                  <option value="casually_open">Casually open</option>
                  <option value="actively_looking">Actively looking</option>
                  <option value="available_soon">Available soon</option>
                </select>
              </label>
              <label>
                <span className={labelClass}>Visibility</span>
                <select className={fieldClass} value={editable.visibility} onChange={(event) => setForm({ ...editable, visibility: event.target.value as OpportunityVisibility })}>
                  {visibilityOptions.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
                </select>
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label>
                <span className={labelClass}>Hiring headline</span>
                <input className={fieldClass} value={editable.headline || ""} maxLength={160} onChange={(event) => setForm({ ...editable, headline: event.target.value })} />
              </label>
              <label>
                <span className={labelClass}>Remote preference</span>
                <select className={fieldClass} value={editable.remote_preference} onChange={(event) => setForm({ ...editable, remote_preference: event.target.value as RemotePreference })}>
                  {remoteOptions.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
                </select>
              </label>
            </div>
            <label>
              <span className={labelClass}>Summary</span>
              <textarea className={`${fieldClass} min-h-28 resize-y`} value={editable.summary || ""} maxLength={1200} onChange={(event) => setForm({ ...editable, summary: event.target.value })} />
            </label>
            <Button onClick={savePreference} loading={saving === "preference"} type="button">Save status</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-text-primary">Roles, Availability, and Location</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <TagInput label="Desired roles" value={joinList(editable.desired_roles)} onChange={(value) => setForm({ ...editable, desired_roles: splitList(value) })} />
              <TagInput label="Preferred skills" value={joinList(editable.preferred_skills)} onChange={(value) => setForm({ ...editable, preferred_skills: splitList(value) })} />
              <TagInput label="Domains" value={joinList(editable.domains)} onChange={(value) => setForm({ ...editable, domains: splitList(value) })} />
              <TagInput label="Locations" value={joinList(editable.locations)} onChange={(value) => setForm({ ...editable, locations: splitList(value) })} />
              <TagInput label="Time zones" value={joinList(editable.time_zones)} onChange={(value) => setForm({ ...editable, time_zones: splitList(value) })} />
              <label>
                <span className={labelClass}>Earliest start date</span>
                <input className={fieldClass} type="date" value={editable.earliest_start_date || ""} onChange={(event) => setForm({ ...editable, earliest_start_date: event.target.value || null })} />
              </label>
            </div>
            <Checklist label="Employment types" values={employmentTypes} selected={editable.employment_types} onChange={(next) => setForm({ ...editable, employment_types: next as EmploymentType[] })} />
            <Checklist label="Seniority targets" values={seniorityTargets} selected={editable.seniority_targets} onChange={(next) => setForm({ ...editable, seniority_targets: next as SeniorityTarget[] })} />
            <div className="grid gap-3 md:grid-cols-3">
              <label>
                <span className={labelClass}>Notice days</span>
                <input className={fieldClass} type="number" min={0} max={365} value={editable.notice_period_days ?? ""} onChange={(event) => setForm({ ...editable, notice_period_days: event.target.value ? Number(event.target.value) : null })} />
              </label>
              <label>
                <span className={labelClass}>Weekly hours</span>
                <input className={fieldClass} type="number" min={0} max={80} value={editable.weekly_availability_hours ?? ""} onChange={(event) => setForm({ ...editable, weekly_availability_hours: event.target.value ? Number(event.target.value) : null })} />
              </label>
              <label className="flex items-end gap-2 pb-2 text-sm text-text-secondary">
                <input type="checkbox" checked={editable.relocation_open} onChange={(event) => setForm({ ...editable, relocation_open: event.target.checked })} />
                Open to relocate
              </label>
            </div>
            <Button onClick={savePreference} loading={saving === "preference"} type="button">Save preferences</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-text-primary">Experience</h2>
              <Button size="sm" variant="outline" onClick={addExperience} loading={saving === "experience"} type="button"><PlusIcon className="h-4 w-4" />Add</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.experiences.length === 0 ? <p className="text-sm text-text-disabled">No experience records yet.</p> : null}
            {profile.experiences.map((item) => <ExperienceEditor key={item.id} item={item} saving={saving === `experience-${item.id}`} onSave={saveExperience} onDelete={(id) => run(`delete-experience-${id}`, () => opportunitiesApi.deleteExperience(id))} />)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-text-primary">External Proof Links</h2>
              <Button size="sm" variant="outline" onClick={addExternalProfile} loading={saving === "external"} type="button"><LinkIcon className="h-4 w-4" />Add</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.external_profiles.length === 0 ? <p className="text-sm text-text-disabled">Add GitHub, LeetCode, portfolio, or other proof links.</p> : null}
            {profile.external_profiles.map((item) => <ExternalProfileEditor key={item.id} item={item} saving={saving === `external-${item.id}`} onSave={(next) => run(`external-${next.id}`, () => opportunitiesApi.updateExternalProfile(next.id, next))} onDelete={(id) => run(`delete-external-${id}`, () => opportunitiesApi.deleteExternalProfile(id))} />)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-text-primary">Resume</h2></CardHeader>
          <CardContent className="space-y-4">
            {profile.resume ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-muted px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">Private PDF resume</p>
                  <p className="text-xs text-text-disabled">{Math.round(profile.resume.file_size / 1024)} KB · scan {profile.resume.scan_status}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={downloadResume} loading={saving === "resume-download"} type="button">Download</Button>
                  <Button variant="danger" size="sm" onClick={() => run("delete-resume", () => opportunitiesApi.deleteResume())} type="button">Delete</Button>
                </div>
              </div>
            ) : <p className="text-sm text-text-disabled">No resume uploaded. Resumes stay private until a future accepted outreach grants access.</p>}
            <div className="flex flex-wrap items-center gap-3">
              <input className={fieldClass} type="file" accept="application/pdf" onChange={(event) => setResumeFile(event.target.files?.[0] || null)} />
              <Button onClick={uploadResume} loading={saving === "resume"} disabled={!resumeFile} type="button"><PlusIcon className="h-4 w-4" />Upload PDF</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-text-primary">Request and Resume Controls</h2></CardHeader>
          <CardContent className="space-y-4">
            <label>
              <span className={labelClass}>Resume sharing after acceptance</span>
              <select className={fieldClass} value={editable.resume_sharing_preference || "ask_each_time"} onChange={(event) => setForm({ ...editable, resume_sharing_preference: event.target.value as CandidatePreference["resume_sharing_preference"] })}>
                <option value="never">Never share through the platform</option>
                <option value="ask_each_time">Ask me each time</option>
                <option value="share_after_acceptance">Share after I accept</option>
              </select>
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-muted p-4">
              <div>
                <p className="text-sm font-medium text-text-primary">Opportunity requests</p>
                <p className="mt-1 text-xs text-text-disabled">{editable.opportunity_requests_paused_at ? "New company requests are paused. Existing requests remain in your inbox." : "Verified companies can request your attention when you are discoverable."}</p>
              </div>
              <Button variant={editable.opportunity_requests_paused_at ? "success" : "outline"} loading={saving === "pause-requests"} onClick={toggleOpportunityRequests} type="button">{editable.opportunity_requests_paused_at ? "Resume requests" : "Pause requests"}</Button>
            </div>
            <Button onClick={savePreference} loading={saving === "preference"} type="button">Save sharing preference</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-text-primary">Company Privacy</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label>
                <span className={labelClass}>Current company name</span>
                <input className={fieldClass} value={editable.current_company_name || ""} onChange={(event) => setForm({ ...editable, current_company_name: event.target.value })} />
              </label>
              <label>
                <span className={labelClass}>Current company domain</span>
                <input className={fieldClass} value={editable.current_company_domain || ""} onChange={(event) => setForm({ ...editable, current_company_domain: event.target.value })} />
              </label>
            </div>
            <label className="flex gap-2 text-sm text-text-secondary">
              <input type="checkbox" checked={editable.hide_from_current_company} onChange={(event) => setForm({ ...editable, hide_from_current_company: event.target.checked })} />
              Hide from current-company matches when company identity is verified enough to enforce it
            </label>
            <Button onClick={savePreference} loading={saving === "preference"} type="button">Save privacy</Button>
            <CompanyBlocks blocks={profile.company_blocks} saving={saving} run={run} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-text-primary">Company Preview</h2>
              <Button size="sm" variant="outline" onClick={loadPreview} loading={saving === "preview"} type="button"><EyeIcon className="h-4 w-4" />Refresh</Button>
            </div>
          </CardHeader>
          <CardContent>
            {preview ? <PreviewCard preview={preview} /> : <p className="text-sm text-text-disabled">Preview what a verified company would see after discovery is enabled.</p>}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function TagInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className={labelClass}>{label}</span><input className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Comma separated" /></label>;
}

function Checklist({ label, values, selected, onChange }: { label: string; values: string[]; selected: string[]; onChange: (value: string[]) => void }) {
  return (
    <fieldset>
      <legend className={labelClass}>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const active = selected.includes(value);
          return <button key={value} type="button" onClick={() => onChange(active ? selected.filter((item) => item !== value) : [...selected, value])} className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${active ? "border-sky-500/40 bg-sky-500/10 text-sky-100" : "border-border-default bg-surface text-text-secondary hover:border-border-strong"}`}>{pretty(value)}</button>;
        })}
      </div>
    </fieldset>
  );
}

function ExperienceEditor({ item, saving, onSave, onDelete }: { item: CandidateExperience; saving: boolean; onSave: (item: CandidateExperience) => void; onDelete: (id: string) => void }) {
  const [draft, setDraft] = useState(item);
  return (
    <div className="rounded-xl border border-border-default bg-surface-muted p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <input className={fieldClass} value={draft.organization_name} onChange={(event) => setDraft({ ...draft, organization_name: event.target.value })} />
        <input className={fieldClass} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        <select className={fieldClass} value={draft.employment_type} onChange={(event) => setDraft({ ...draft, employment_type: event.target.value as EmploymentType })}>{employmentTypes.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select>
        <select className={fieldClass} value={draft.remote_type} onChange={(event) => setDraft({ ...draft, remote_type: event.target.value as RemotePreference })}>{remoteOptions.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select>
        <input className={fieldClass} type="date" value={draft.start_date} onChange={(event) => setDraft({ ...draft, start_date: event.target.value })} />
        <input className={fieldClass} type="date" value={draft.end_date || ""} onChange={(event) => setDraft({ ...draft, end_date: event.target.value || null })} />
      </div>
      <textarea className={`${fieldClass} mt-3 min-h-20 resize-y`} value={draft.description || ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => onDelete(item.id)} type="button"><TrashIcon className="h-4 w-4" />Delete</Button>
        <Button size="sm" onClick={() => onSave(draft)} loading={saving} type="button">Save</Button>
      </div>
    </div>
  );
}

function ExternalProfileEditor({ item, saving, onSave, onDelete }: { item: CandidateExternalProfile; saving: boolean; onSave: (item: CandidateExternalProfile) => void; onDelete: (id: string) => void }) {
  const [draft, setDraft] = useState(item);
  return (
    <div className="grid gap-3 rounded-xl border border-border-default bg-surface-muted p-4 md:grid-cols-[140px_1fr_150px_auto]">
      <input className={fieldClass} value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} />
      <input className={fieldClass} value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} />
      <select className={fieldClass} value={draft.visibility} onChange={(event) => setDraft({ ...draft, visibility: event.target.value as OpportunityVisibility })}>{visibilityOptions.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => onDelete(item.id)} type="button"><TrashIcon className="h-4 w-4" /></Button>
        <Button size="sm" onClick={() => onSave(draft)} loading={saving} type="button">Save</Button>
      </div>
    </div>
  );
}

function CompanyBlocks({ blocks, saving, run }: { blocks: Array<{ id: string; company_name: string | null; company_domain: string | null; reason: string | null }>; saving: string | null; run: <T>(key: string, action: () => Promise<T>, onDone?: (value: T) => void) => Promise<void> }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  return (
    <div className="space-y-3 border-t border-border-subtle pt-4">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Company name" />
        <input className={fieldClass} value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="company.com" />
        <Button type="button" variant="outline" loading={saving === "block"} onClick={() => run("block", () => opportunitiesApi.createCompanyBlock({ company_name: name, company_domain: domain, reason: "specific_company" }), () => { setName(""); setDomain(""); })}>Block</Button>
      </div>
      {blocks.map((block) => (
        <div key={block.id} className="flex items-center justify-between gap-3 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm">
          <span className="text-text-secondary">{block.company_name || block.company_domain} <span className="text-text-disabled">{block.reason ? `· ${pretty(block.reason)}` : null}</span></span>
          <Button size="sm" variant="ghost" onClick={() => run(`delete-block-${block.id}`, () => opportunitiesApi.deleteCompanyBlock(block.id))} type="button">Remove</Button>
        </div>
      ))}
    </div>
  );
}

function PreviewCard({ preview }: { preview: OpportunityPreview }) {
  return (
    <div className="space-y-4">
      <Alert tone={preview.company_visible ? "success" : "warning"} title={preview.company_visible ? "Visible to eligible companies" : "Hidden from company discovery"}>
        Resume URLs and private company blocks are never shown in this preview.
      </Alert>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border-default bg-surface-muted p-4">
          <GlobeIcon className="mb-2 h-4 w-4 text-sky-300" />
          <p className="text-sm font-semibold text-text-primary">{preview.public_profile?.name || "Profile"}</p>
          <p className="text-xs text-text-disabled">{preview.public_profile?.headline || "No public headline"}</p>
        </div>
        <div className="rounded-xl border border-border-default bg-surface-muted p-4">
          <CheckCircleIcon className="mb-2 h-4 w-4 text-emerald-300" />
          <p className="text-sm font-semibold text-text-primary">{preview.opportunity?.status ? pretty(String(preview.opportunity.status)) : "Not visible"}</p>
          <p className="text-xs text-text-disabled">{preview.opportunity?.desired_roles?.join(", ") || "No visible roles"}</p>
        </div>
        <div className="rounded-xl border border-border-default bg-surface-muted p-4">
          <BriefcaseIcon className="mb-2 h-4 w-4 text-amber-300" />
          <p className="text-sm font-semibold text-text-primary">{preview.experiences.length} experience records</p>
          <p className="text-xs text-text-disabled">{preview.external_profiles.length} external links · resume {preview.resume.available ? "available after consent" : "hidden"}</p>
        </div>
      </div>
    </div>
  );
}
