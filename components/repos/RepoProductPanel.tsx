"use client";

import Link from "next/link";
import { useRepoAiProduct } from "@/lib/hooks/useRepos";
import type { Repository } from "@/lib/types";

const AI_BRANCH = "logoutdev/ai-docs";
const PRODUCT_MODEL_PATH = ".logoutdev/pm/current/product-model.json";

export default function RepoProductPanel({ repo }: { repo: Repository }) {
  const { product, loading, error } = useRepoAiProduct(repo.id);

  if (loading && !product) {
    return (
      <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">Product Brain</p>
        <p className="mt-2 text-sm text-sky-100/80">Loading the PM agent&apos;s structured product model.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200">Product Brain</p>
        <p className="mt-2 text-sm text-rose-100/85">{error}</p>
      </div>
    );
  }

  if (!product?.available || !product.product_model) {
    return (
      <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">Product Brain</p>
        <h2 className="mt-2 text-lg font-semibold text-white">The PM model has not been published yet</h2>
        <p className="mt-1 text-sm text-sky-100/85">
          Once the PM agent completes a run, this panel will show the product identity, features, flows, and PM suggestions from the AI branch.
        </p>
      </div>
    );
  }

  const model = product.product_model;
  const featurePreview = model.features.slice(0, 4);
  const flowPreview = model.user_flows.slice(0, 3);
  const suggestionPreview = product.suggestions.slice(0, 3);
  const history = product.history_summary;
  const productHref = `/repos/${repo.id}?ref=${encodeURIComponent(AI_BRANCH)}&path=${encodeURIComponent(PRODUCT_MODEL_PATH)}&view=blob`;

  return (
    <div className="rounded-3xl border border-sky-500/20 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_45%),linear-gradient(135deg,rgba(8,47,73,0.92),rgba(15,23,42,0.96))] p-5 text-white shadow-[0_24px_80px_-32px_rgba(56,189,248,0.45)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">Product Brain</p>
          <h2 className="mt-2 text-2xl font-semibold">{model.product_identity.name}</h2>
          <p className="mt-2 text-sm leading-6 text-sky-50/85">{model.product_identity.description}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-sky-100/80">
            <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1">
              Confidence: {model.product_identity.confidence}
            </span>
            <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1">
              Features: {model.features.length}
            </span>
            <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1">
              Flows: {model.user_flows.length}
            </span>
            <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1">
              Modules: {model.modules.length}
            </span>
          </div>
        </div>

        <Link
          href={productHref}
          className="rounded-xl border border-sky-300/25 bg-white/10 px-4 py-2 text-sm font-semibold text-sky-50 transition-colors hover:bg-white/15"
        >
          Open Product JSON
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/75">Tracked Features</p>
          <div className="mt-3 space-y-3">
            {featurePreview.length ? featurePreview.map((feature) => (
              <div key={feature.id} className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                  <span className="rounded-full border border-sky-300/15 px-2 py-0.5 text-[11px] text-sky-100/75">
                    {feature.confidence}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-200/82">{feature.description}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-300/75">No feature summaries are available yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/75">User Flows</p>
            <div className="mt-3 space-y-3">
              {flowPreview.length ? flowPreview.map((flow) => (
                <div key={flow.id} className="rounded-2xl border border-white/8 bg-white/5 p-3">
                  <h3 className="text-sm font-semibold text-white">{flow.name}</h3>
                  <p className="mt-1 text-sm text-slate-200/82">{flow.summary}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-300/75">No flow summaries are available yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/75">PM Suggestions</p>
            <div className="mt-3 space-y-3">
              {suggestionPreview.length ? suggestionPreview.map((suggestion) => (
                <div key={suggestion.id} className="rounded-2xl border border-white/8 bg-white/5 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">{suggestion.title}</h3>
                    <span className="text-[11px] uppercase tracking-[0.12em] text-sky-100/70">
                      {suggestion.confidence}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-200/82">{suggestion.description}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-300/75">No PM suggestions are currently recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {history ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/75">Latest PM Change</p>
          <p className="mt-2 text-sm text-slate-200/82">
            {history.recent_changes[0]?.summary || "The PM agent has started tracking product history on the AI branch."}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Source commit: {history.source_commit?.slice(0, 12)} • Recorded changes: {history.change_count}
          </p>
        </div>
      ) : null}
    </div>
  );
}
