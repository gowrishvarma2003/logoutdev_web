"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as actionsApi from "@/lib/services/actionsApi";
import type { RunWorkflowLog, WorkflowRun } from "@/lib/services/actionsApi";
import Spinner from "@/components/ui/Spinner";

export default function RunPage({ params }: { params: Promise<{ repoId: string; runId: string }> }) {
  const { repoId, runId } = use(params);
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [logs, setLogs] = useState<RunWorkflowLog[]>([]);
  const [error, setError] = useState("");
  const logCursor = useRef(0);
  const loadingLogs = useRef(false);
  const load = useCallback(() => actionsApi.getRun(runId).then((data) => { setRun(data.run); setError(""); }).catch((err) => setError(err.message)), [runId]);
  const loadLogs = useCallback(async () => {
    if (loadingLogs.current) return;
    loadingLogs.current = true;
    try {
      let hasMore = true;
      while (hasMore) {
        const data = await actionsApi.getRunLogs(runId, logCursor.current);
        if (data.logs.length) {
          setLogs((current) => [...current, ...data.logs]);
          logCursor.current = Number(data.logs[data.logs.length - 1].id);
        }
        hasMore = data.has_more && data.logs.length > 0;
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load workflow logs"); }
    finally { loadingLogs.current = false; }
  }, [runId]);
  useEffect(() => {
    load(); loadLogs();
    const timer = window.setInterval(() => { load(); loadLogs(); }, 3000);
    return () => window.clearInterval(timer);
  }, [load, loadLogs]);
  if (!run && !error) return <div className="flex min-h-64 items-center justify-center"><Spinner size="lg" /></div>;
  if (!run) return <p className="text-rose-400">{error}</p>;
  const active = ["queued", "running"].includes(run.status);
  return <div className="space-y-6">
    <div className="flex items-start justify-between gap-4"><div><Link href={`/repos/${repoId}/actions`} className="text-sm text-blue-400 hover:underline">← All runs</Link><h1 className="mt-3 text-2xl font-semibold text-text-primary">{run.workflow?.name || "Workflow run"}</h1><p className="mt-1 text-sm text-text-muted">{run.branch} · <code>{run.commit_sha}</code></p></div><div className="flex gap-2">{active ? <button onClick={() => actionsApi.cancelRun(run.id).then(load)} className="rounded-lg border border-rose-500/30 px-3 py-2 text-sm text-rose-300">Cancel</button> : <button onClick={() => actionsApi.rerunRun(run.id).then(({ run: next }) => { window.location.href = `/repos/${repoId}/actions/runs/${next.id}`; })} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Run again</button>}</div></div>
    <div className="rounded-xl border border-border-default bg-surface/30 p-4"><span className="text-xs font-semibold uppercase tracking-wider text-text-disabled">Status</span><p className="mt-2 text-lg font-semibold capitalize text-text-primary">{run.status}</p></div>
    <section className="space-y-3">{run.jobs?.map((job) => <Link key={job.id} href={`/repos/${repoId}/actions/jobs/${job.id}`} className="block rounded-xl border border-border-default p-4 hover:bg-surface/40"><div className="flex justify-between"><span className="font-medium text-text-primary">{job.name}</span><span className="text-xs font-semibold uppercase text-text-muted">{job.status}</span></div><div className="mt-3 space-y-1">{job.steps?.map((step) => <div key={step.id} className="flex justify-between text-sm text-text-muted"><span>{step.name}</span><span>{step.status}{step.exit_code != null ? ` (${step.exit_code})` : ""}</span></div>)}</div>{job.error_message ? <p className="mt-3 rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{job.error_message}</p> : null}</Link>)}</section>
    <section className="overflow-hidden rounded-xl border border-border-default">
      <div className="flex items-center justify-between border-b border-border-default bg-surface/50 px-4 py-3"><h2 className="text-sm font-semibold text-text-secondary">Complete workflow logs</h2><span className="text-xs text-text-disabled">{logs.length.toLocaleString()} entries</span></div>
      <div className="max-h-[70vh] overflow-auto bg-black p-4 font-mono text-xs leading-5">
        {logs.length ? logs.map((line) => <div key={line.id} className={`grid grid-cols-[minmax(7rem,12rem)_1fr] gap-3 ${line.log_type === "stderr" ? "text-rose-300" : line.log_type === "system" ? "text-blue-300" : "text-text-secondary"}`}><span className="truncate text-text-disabled" title={line.job?.name}>{line.job?.name || "workflow"}</span><span className="whitespace-pre-wrap break-words">{line.content}</span></div>) : <p className="text-text-disabled">{active ? "Waiting for logs…" : "This workflow run did not produce any logs."}</p>}
      </div>
    </section>
  </div>;
}
