"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import * as actionsApi from "@/lib/services/actionsApi";
import type { WorkflowJob, WorkflowLog } from "@/lib/services/actionsApi";
import Spinner from "@/components/ui/Spinner";

export default function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params); const [job, setJob] = useState<WorkflowJob | null>(null); const [logs, setLogs] = useState<WorkflowLog[]>([]); const end = useRef<HTMLDivElement>(null);
  const poll = useCallback(async () => { const [{ job: next }, { logs: lines }] = await Promise.all([actionsApi.getJob(jobId), actionsApi.getLogs(jobId, logs.at(-1)?.sequence || 0)]); setJob(next); if (lines.length) setLogs((current) => [...current, ...lines]); }, [jobId, logs]);
  useEffect(() => { poll(); const timer = window.setInterval(poll, 2000); return () => window.clearInterval(timer); }, [poll]);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [logs]);
  if (!job) return <div className="flex min-h-64 items-center justify-center"><Spinner size="lg" /></div>;
  return <div className="space-y-4"><div><h1 className="text-2xl font-semibold text-white">{job.name}</h1><p className="mt-1 text-sm capitalize text-zinc-400">{job.status} · attempt {job.attempt} · {job.image}</p></div><div className="max-h-[65vh] overflow-auto rounded-xl border border-zinc-800 bg-black p-4 font-mono text-xs leading-5">{logs.length ? logs.map((line) => <div key={`${line.sequence}-${line.id}`} className={line.log_type === "stderr" ? "text-rose-300" : line.log_type === "system" ? "text-blue-300" : "text-zinc-300"}><span className="mr-3 select-none text-zinc-700">{String(line.sequence).padStart(5, "0")}</span>{line.content}</div>) : <p className="text-zinc-600">Waiting for logs…</p>}<div ref={end} /></div></div>;
}
