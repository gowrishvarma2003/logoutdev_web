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
  return <div className="mx-auto max-w-5xl space-y-6"><div><h1 className="text-2xl font-semibold text-white">Actions runners</h1><p className="mt-1 text-sm text-zinc-400">Execution-plane health and available capacity.</p></div>{error ? <p className="rounded-lg bg-rose-500/10 p-3 text-rose-300">{error}</p> : null}<div className="grid gap-4 md:grid-cols-2">{runners?.map((runner) => <article key={runner.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4"><div className="flex items-center justify-between"><h2 className="font-semibold text-white">{runner.name}</h2><span className={`rounded-full px-2 py-1 text-xs font-semibold ${runner.status === "online" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>{runner.status}</span></div><p className="mt-3 text-sm text-zinc-400">{runner.current_running_jobs} running · {runner.max_concurrent_jobs} maximum</p><div className="mt-3 flex flex-wrap gap-1">{runner.labels.map((label) => <span key={label} className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-400">{label}</span>)}</div><p className="mt-3 text-xs text-zinc-600">{runner.last_heartbeat_at ? `Last heartbeat ${new Date(runner.last_heartbeat_at).toLocaleString()}` : "Never connected"}{runner.version ? ` · v${runner.version}` : ""}</p></article>)}{runners?.length === 0 ? <p className="text-sm text-zinc-500">No runners provisioned.</p> : null}</div></div>;
}
