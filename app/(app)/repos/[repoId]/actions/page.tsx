"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRepoContext } from "../layout";
import * as actionsApi from "@/lib/services/actionsApi";
import type { Workflow, WorkflowRun } from "@/lib/services/actionsApi";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { ArrowPathIcon, KeyIcon, PlayIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

const colors: Record<string, string> = { success: "text-emerald-400", failed: "text-rose-400", running: "text-blue-400", queued: "text-amber-400", cancelled: "text-zinc-500", timeout: "text-orange-400", skipped: "text-zinc-500" };
const starterWorkflow = `name: CI
on:
  push:
  manual:

jobs:
  build:
    name: Build and test
    image: node:20
    steps:
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
`;

export default function ActionsPage() {
  const { repo } = useRepoContext();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [filename, setFilename] = useState("ci.yml");
  const [yaml, setYaml] = useState(starterWorkflow);
  const [commitMessage, setCommitMessage] = useState("Add CI workflow");

  const load = useCallback(async () => {
    try {
      const [workflowData, runData] = await Promise.all([actionsApi.listWorkflows(repo.id), actionsApi.listRuns(repo.id)]);
      setWorkflows(workflowData.workflows); setRuns(runData.runs); setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load Actions"); }
    finally { setLoading(false); }
  }, [repo.id]);

  useEffect(() => { load(); const timer = window.setInterval(load, 5000); return () => window.clearInterval(timer); }, [load]);

  async function refresh() { setBusy("refresh"); try { await actionsApi.refreshWorkflows(repo.id); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Refresh failed"); } finally { setBusy(""); } }
  async function dispatch(workflow: Workflow) { setBusy(workflow.id); try { await actionsApi.dispatchWorkflow(workflow.id, repo.default_branch); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Dispatch failed"); } finally { setBusy(""); } }
  async function createWorkflow(event: React.FormEvent) {
    event.preventDefault(); setBusy("create"); setError("");
    try {
      await actionsApi.createWorkflow(repo.id, { filename, content: yaml, branch: repo.default_branch, message: commitMessage });
      setShowEditor(false); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create workflow"); }
    finally { setBusy(""); }
  }

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Spinner size="lg" /></div>;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-semibold text-white">Actions</h1><p className="mt-1 text-sm text-zinc-400">Workflows from <code>.logoutdev/workflows</code></p></div>
      <div className="flex gap-2">
        <Link href="/actions/runners" className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">Runners</Link>
        {repo.can_manage_general ? <Link href={`/repos/${repo.id}/actions/secrets`} className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"><KeyIcon className="h-4 w-4" /> Secrets</Link> : null}
        {repo.can_push ? <button onClick={() => setShowEditor((value) => !value)} disabled={Boolean(busy)} className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50">{showEditor ? <XMarkIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}{showEditor ? "Close editor" : "New workflow"}</button> : null}
        {repo.can_push ? <button onClick={refresh} disabled={Boolean(busy)} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"><ArrowPathIcon className="h-4 w-4" /> Scan workflows</button> : null}
      </div>
    </div>
    {error ? <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div> : null}
    {showEditor ? <form onSubmit={createWorkflow} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-900/50 p-3">
        <span className="font-mono text-sm text-zinc-500">.logoutdev/workflows/</span>
        <input value={filename} onChange={(event) => setFilename(event.target.value)} required pattern="[A-Za-z0-9._-]+[.]ya?ml" title="Use a .yml or .yaml filename" className="min-w-48 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 font-mono text-sm text-white outline-none focus:border-blue-500" />
      </div>
      <textarea value={yaml} onChange={(event) => setYaml(event.target.value)} required spellCheck={false} className="h-96 w-full resize-y bg-transparent p-4 font-mono text-sm leading-6 text-zinc-200 outline-none" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 p-4">
        <input value={commitMessage} onChange={(event) => setCommitMessage(event.target.value)} required placeholder="Commit message" className="min-w-64 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
        <button type="submit" disabled={Boolean(busy)} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50">{busy === "create" ? "Committing…" : `Commit to ${repo.default_branch}`}</button>
      </div>
    </form> : null}
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Workflows</p>
        {workflows.length ? workflows.map((workflow) => <div key={workflow.id} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-200 hover:bg-zinc-800/70"><span className="min-w-0 flex-1 truncate">{workflow.name}</span>{repo.can_push ? <button title="Run workflow" onClick={() => dispatch(workflow)} disabled={Boolean(busy)} className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-white"><PlayIcon className="h-4 w-4" /></button> : null}</div>) : <EmptyState icon={<PlayIcon className="h-6 w-6" />} title="No workflows" description="Add a YAML workflow and scan again." tone="repo" size="sm" className="border-0 bg-transparent px-2 py-6" />}
      </aside>
      <section className="overflow-hidden rounded-xl border border-zinc-800">
        <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm font-semibold text-zinc-200">Recent runs</div>
        {runs.length ? runs.map((run) => <Link key={run.id} href={`/repos/${repo.id}/actions/runs/${run.id}`} className="flex items-center gap-4 border-b border-zinc-900 px-4 py-4 last:border-0 hover:bg-zinc-900/40"><span className={`text-xs font-semibold uppercase ${colors[run.status]}`}>{run.status}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-zinc-100">{run.workflow?.name || "Workflow run"}</p><p className="mt-1 text-xs text-zinc-500">{run.branch} · {run.commit_sha.slice(0, 8)} · {run.trigger_event}</p></div><time className="text-xs text-zinc-500">{new Date(run.queued_at).toLocaleString()}</time></Link>) : <div className="p-4"><EmptyState icon={<ArrowPathIcon className="h-7 w-7" />} title="No workflow runs yet" description="Runs will appear here after a workflow is triggered." tone="repo" size="md" /></div>}
      </section>
    </div>
  </div>;
}
