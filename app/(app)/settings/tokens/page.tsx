"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccessTokens } from "@/lib/hooks/useAccessTokens";
import * as api from "@/lib/services/tokensApi";
import Spinner from "@/components/ui/Spinner";
import { ArrowLeftIcon, KeyIcon } from "@/components/ui/Icons";

export default function SettingsTokensPage() {
  const { tokens, loading, error, refetch } = useAccessTokens();
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [plaintext, setPlaintext] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Token name is required.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const response = await api.createAccessToken({
        name: name.trim(),
        expires_at: expiresAt || undefined,
      });
      setPlaintext(response.plaintext_token);
      setName("");
      setExpiresAt("");
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create token.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(tokenId: string) {
    await api.revokeAccessToken(tokenId);
    refetch();
  }

  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/settings/profile"
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <KeyIcon className="w-4 h-4 text-zinc-400" />
            <h1 className="text-[15px] font-bold text-white">Access Tokens</h1>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-5 py-6">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="text-sm font-semibold text-white">Create a Git access token</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Use this token as the Git password when pushing to LogoutDev repositories over HTTPS. The same token works for attached space repos and top-level repos.
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            If you set an expiry date, the token will remain valid until the end of that day.
          </p>

          <form onSubmit={handleCreate} className="mt-4 space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Laptop Git token"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
            />
            {formError && <p className="text-sm text-rose-400">{formError}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Creating..." : "Create token"}
            </button>
          </form>
        </section>

        {plaintext && (
          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <h2 className="text-sm font-semibold text-amber-300">Copy this token now</h2>
            <p className="mt-1 text-sm text-amber-100/80">
              This value is shown only once. Store it somewhere safe.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950 p-3 text-sm text-white">{plaintext}</pre>
          </section>
        )}

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="text-sm font-semibold text-white">Existing tokens</h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : error ? (
            <p className="mt-4 text-sm text-rose-400">{error}</p>
          ) : tokens.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No tokens created yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-zinc-800/60">
              {tokens.map((token) => (
                <div key={token.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{token.name}</p>
                    <p className="text-xs text-zinc-500">
                      Prefix: {token.token_prefix}
                      {token.last_used_at ? ` · Last used ${new Date(token.last_used_at).toLocaleString()}` : " · Never used"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevoke(token.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
