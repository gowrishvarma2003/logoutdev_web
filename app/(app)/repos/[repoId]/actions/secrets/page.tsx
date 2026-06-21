"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import * as actionsApi from "@/lib/services/actionsApi";
import type { RepositorySecret } from "@/lib/services/actionsApi";

export default function SecretsPage({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = use(params);
  const [secrets, setSecrets] = useState<RepositorySecret[]>([]);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(() => actionsApi.listSecrets(repoId).then((data) => setSecrets(data.secrets)).catch((err) => setError(err.message)), [repoId]);
  useEffect(() => { load(); }, [load]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try { await actionsApi.saveSecret(repoId, name.trim().toUpperCase(), value); setName(""); setValue(""); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save secret"); }
    finally { setSaving(false); }
  }

  return <div className="mx-auto max-w-3xl space-y-6">
    <div><Link href={`/repos/${repoId}/actions`} className="text-sm text-blue-400 hover:underline">← Actions</Link><h1 className="mt-3 text-2xl font-semibold text-white">Repository secrets</h1><p className="mt-1 text-sm text-zinc-400">Values are encrypted and never displayed after saving.</p></div>
    {error ? <p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p> : null}
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-zinc-800 p-4"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="DEPLOY_TOKEN" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" required /><input type="password" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Secret value" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" required /><button disabled={saving} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50">{saving ? "Saving…" : "Add or update secret"}</button></form>
    <div className="overflow-hidden rounded-xl border border-zinc-800">{secrets.length ? secrets.map((secret) => <div key={secret.id} className="flex items-center justify-between border-b border-zinc-800 p-4 last:border-0"><div><p className="font-mono text-sm text-zinc-100">{secret.name}</p><p className="mt-1 text-xs text-zinc-500">Updated {new Date(secret.updated_at).toLocaleString()}</p></div><button onClick={() => actionsApi.deleteSecret(repoId, secret.id).then(load)} className="text-sm text-rose-400 hover:text-rose-300">Delete</button></div>) : <p className="p-6 text-center text-sm text-zinc-500">No secrets configured.</p>}</div>
  </div>;
}
