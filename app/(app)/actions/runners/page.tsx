"use client";

import { useCallback, useEffect, useState } from "react";
import * as actionsApi from "@/lib/services/actionsApi";
import type { ActionRunner } from "@/lib/services/actionsApi";
import Spinner from "@/components/ui/Spinner";

export default function RunnersPage() {
  const [runners, setRunners] = useState<ActionRunner[] | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => actionsApi.listRunners().then((data) => { setRunners(data.runners); setError(""); }).catch((err) => setError(err.message)), []);
  useEffect(() => { load(); const timer = window.setInterval(load, 10000); return () => window.clearInterval(timer); }, [load]);
  if (!runners && !error) return <div className="flex min-h-64 items-center justify-center"><Spinner size="lg" /></div>;
  return <div className="mx-auto max-w-5xl space-y-6"><div><h1 className="text-2xl font-semibold text-text-primary">Actions runners</h1><p className="mt-1 text-sm text-text-muted">Execution-plane health and available capacity.</p></div>{error ? <p className="rounded-lg bg-rose-500/10 p-3 text-rose-300">{error}</p> : null}<div className="grid gap-4 md:grid-cols-2">{runners?.map((runner) => <article key={runner.id} className="rounded-xl border border-border-default bg-surface/30 p-4"><div className="flex items-center justify-between"><h2 className="font-semibold text-text-primary">{runner.name}</h2><span className={`rounded-full px-2 py-1 text-xs font-semibold ${runner.status === "online" ? "bg-emerald-500/10 text-emerald-400" : "bg-surface-hover text-text-disabled"}`}>{runner.status}</span></div><p className="mt-3 text-sm text-text-muted">{runner.current_running_jobs} running · {runner.max_concurrent_jobs} maximum</p><div className="mt-3 flex flex-wrap gap-1">{runner.labels.map((label) => <span key={label} className="rounded bg-surface-hover px-2 py-1 text-xs text-text-muted">{label}</span>)}</div><p className="mt-3 text-xs text-text-disabled">{runner.last_heartbeat_at ? `Last heartbeat ${new Date(runner.last_heartbeat_at).toLocaleString()}` : "Never connected"}{runner.version ? ` · v${runner.version}` : ""}</p></article>)}{runners?.length === 0 ? <p className="text-sm text-text-disabled">No runners provisioned.</p> : null}</div></div>;
}
