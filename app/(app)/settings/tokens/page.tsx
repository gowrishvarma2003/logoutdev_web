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
  const [readScope, setReadScope] = useState(true);
  const [writeScope, setWriteScope] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tokenToRevoke, setTokenToRevoke] = useState<{ id: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopyToken() {
    try {
      await navigator.clipboard.writeText(plaintext);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Token name is required.");
      return;
    }
    if (!readScope && !writeScope) {
      setFormError("Choose at least one scope.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const response = await api.createAccessToken({
        name: name.trim(),
        expires_at: expiresAt || undefined,
        scopes: [readScope ? "git:read" : null, writeScope ? "git:write" : null].filter(Boolean) as Array<"git:read" | "git:write">,
      });
      setPlaintext(response.plaintext_token);
      setName("");
      setExpiresAt("");
      setReadScope(true);
      setWriteScope(true);
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create token.");
    } finally {
      setSubmitting(false);
    }
  }

  function confirmRevoke(tokenId: string, tokenName: string) {
    setTokenToRevoke({ id: tokenId, name: tokenName });
    setFormError("");
  }

  function cancelRevoke() {
    if (revokingId) return;
    setTokenToRevoke(null);
  }

  async function handleRevoke() {
    if (!tokenToRevoke) return;
    setRevokingId(tokenToRevoke.id);
    setFormError("");
    try {
      await api.revokeAccessToken(tokenToRevoke.id);
      await refetch();
      setSuccessMessage("Token has been revoked successfully.");
      setTokenToRevoke(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to revoke token.");
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-border-default bg-app/90 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/settings/profile"
            className="rounded-full p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <KeyIcon className="w-4 h-4 text-text-muted" />
            <h1 className="text-[15px] font-bold text-text-primary">Git Access Tokens</h1>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-5 py-6">
        <section className="rounded-2xl border border-border-default bg-surface/50 p-4">
          <h2 className="text-sm font-semibold text-text-primary">Create a repo access token</h2>
          <p className="mt-1 text-sm text-text-disabled">
            Use this token as your Git password when cloning or pushing LogoutDev repositories over HTTPS.
          </p>
          <p className="mt-1 text-xs text-text-disabled">
            Username: your LogoutDev username. Password: the token you create here.
          </p>
          <p className="mt-1 text-xs text-text-disabled">
            If you set an expiry date, the token will remain valid until the end of that day.
          </p>

          <form onSubmit={handleCreate} className="mt-4 space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Laptop Git token"
              className="w-full rounded-xl border border-border-default bg-app px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none"
            />
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-xl border border-border-default bg-app px-3 py-2 text-sm text-text-primary focus:border-border-strong focus:outline-none"
            />
            <div className="rounded-xl border border-border-default bg-app px-4 py-3 text-sm text-text-secondary">
              <p className="font-medium text-text-primary">Scopes</p>
              <label className="mt-3 flex items-center gap-2">
                <input type="checkbox" checked={readScope} onChange={(e) => setReadScope(e.target.checked)} />
                <span>git:read</span>
              </label>
              <label className="mt-2 flex items-center gap-2">
                <input type="checkbox" checked={writeScope} onChange={(e) => setWriteScope(e.target.checked)} />
                <span>git:write</span>
              </label>
            </div>
            {formError && <p className="text-sm text-rose-400">{formError}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {submitting ? "Creating..." : "Create token"}
            </button>
          </form>
        </section>

        {plaintext && (
          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-amber-300">Copy this token now</h2>
                <p className="mt-1 text-sm text-amber-100/80">
                  This value is shown only once. Store it somewhere safe.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyToken}
                className="shrink-0 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/10 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-app p-3 text-sm text-text-primary select-all">{plaintext}</pre>
          </section>
        )}

        <section className="rounded-2xl border border-border-default bg-surface/50 p-4">
          <h2 className="text-sm font-semibold text-text-primary">Existing tokens</h2>

          {successMessage && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <p className="text-sm text-emerald-400">{successMessage}</p>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="ml-auto shrink-0 text-xs text-emerald-400 hover:text-emerald-300"
              >
                Dismiss
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : error ? (
            <p className="mt-4 text-sm text-rose-400">{error}</p>
          ) : tokens.length === 0 ? (
            <p className="mt-3 text-sm text-text-disabled">No tokens created yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-border-default/60">
              {tokens.map((token) => {
                const isRevoked = Boolean(token.revoked_at);

                return (
                  <div key={token.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`truncate text-sm font-medium ${isRevoked ? "text-text-disabled" : "text-text-primary"}`}>{token.name}</p>
                        {isRevoked && (
                          <span className="rounded-full border border-border-strong bg-surface-hover/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                            Token revoked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-disabled">
                        {isRevoked ? "Token revoked" : `Prefix: ${token.token_prefix}`}
                        {token.last_used_at ? ` · Last used ${new Date(token.last_used_at).toLocaleString()}` : " · Never used"}
                        {isRevoked && token.revoked_at ? ` · Revoked ${new Date(token.revoked_at).toLocaleString()}` : ""}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-text-disabled">{token.scopes.join(" · ")}</p>
                    </div>
                    {isRevoked ? (
                      <span className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-disabled">Revoked</span>
                    ) : (
                      <button
                        onClick={() => confirmRevoke(token.id, token.name)}
                        disabled={revokingId === token.id}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                      >
                        {revokingId === token.id ? "Revoking..." : "Revoke"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tokenToRevoke && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="mx-4 w-full max-w-sm rounded-2xl border border-border-default bg-app p-6 shadow-2xl">
                <p className="text-sm font-semibold text-text-primary">Revoke access token?</p>
                <p className="mt-2 text-sm text-text-muted">
                  Any scripts or Git clients using <span className="font-medium text-text-primary">{tokenToRevoke.name}</span> will stop working immediately.
                </p>
                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={cancelRevoke}
                    disabled={Boolean(revokingId)}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRevoke}
                    disabled={Boolean(revokingId)}
                    className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-text-primary hover:bg-rose-500 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {revokingId ? (
                      <>
                        <Spinner size="sm" />
                        Revoking...
                      </>
                    ) : (
                      "Revoke token"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
