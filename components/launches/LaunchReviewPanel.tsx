"use client";

import { useState } from "react";
import type { LaunchReview, User } from "@/lib/types";
import RichComposer from "@/components/ui/RichComposer";
import RichText from "@/components/ui/RichText";

interface LaunchReviewPanelProps {
  reviews: LaunchReview[];
  currentUser?: User | null;
  myReviewId?: string | null;
  canReview?: boolean;
  disabledMessage?: string | null;
  loading?: boolean;
  error?: string | null;
  onSubmitReview: (payload: { headline: string; body: string; recommendation: string }) => Promise<void> | void;
  onDeleteReview: () => Promise<void> | void;
}

const REC_CONFIG: Record<string, { label: string; short: string; color: string }> = {
  recommend: { label: "I recommend this", short: "Recommends", color: "emerald" },
  mixed: { label: "Mixed feelings", short: "Mixed", color: "amber" },
  not_recommend: { label: "Not recommended", short: "Not recommended", color: "rose" },
};

type Recommendation = keyof typeof REC_CONFIG;

export default function LaunchReviewPanel({
  reviews,
  currentUser,
  myReviewId,
  canReview = true,
  disabledMessage = null,
  loading = false,
  error = null,
  onSubmitReview,
  onDeleteReview,
}: LaunchReviewPanelProps) {
  const myReview = reviews.find((r) => r.id === myReviewId) ?? null;
  const [headline, setHeadline] = useState(myReview?.headline ?? "");
  const [body, setBody] = useState(myReview?.body ?? "");
  const [recommendation, setRecommendation] = useState<Recommendation>(
    (myReview?.recommendation as Recommendation | undefined) ?? "recommend"
  );
  const [isComposing, setIsComposing] = useState(!!myReview);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    await onSubmitReview({ headline: headline.trim(), body: body.trim(), recommendation });
    if (!myReview) {
      setIsComposing(false);
      setHeadline("");
      setBody("");
    }
  };

  const recConfig = REC_CONFIG[recommendation];

  return (
    <div className="space-y-4">
      {/* Composer */}
      {currentUser ? (
        canReview ? (
          isComposing || myReview ? (
            <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {myReview ? "Update your review" : "Write a review"}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Share your honest experience
                    </p>
                  </div>
                  {!myReview && (
                    <button
                      type="button"
                      onClick={() => setIsComposing(false)}
                      className="text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Summarize in one line"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                />

                <RichComposer
                  value={body}
                  onChange={(value) => setBody(value)}
                  rows={3}
                  placeholder="What worked? What didn't? Would you recommend it?"
                  previewClassName="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-2.5 text-sm leading-relaxed text-white"
                   className="w-full resize-y px-4 py-2.5 text-sm leading-relaxed text-transparent caret-white placeholder:text-zinc-600 focus:outline-none"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {(Object.entries(REC_CONFIG) as [Recommendation, typeof recConfig][]).map(
                      ([val, config]) => {
                        const isActive = recommendation === val;
                        const colorClasses = {
                          emerald: isActive
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                            : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300",
                          amber: isActive
                            ? "border-amber-500/30 bg-amber-500/15 text-amber-400"
                            : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300",
                          rose: isActive
                            ? "border-rose-500/30 bg-rose-500/15 text-rose-400"
                            : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300",
                        };
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setRecommendation(val)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${colorClasses[config.color as keyof typeof colorClasses]}`}
                          >
                            {config.label}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <div className="flex gap-2">
                    {myReview && (
                      <button
                        type="button"
                        onClick={() => onDeleteReview()}
                        className="rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading || !headline.trim()}
                      className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-50"
                    >
                      {loading ? "Saving..." : myReview ? "Update" : "Post review"}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-rose-400">{error}</p>}
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsComposing(true)}
              className="w-full rounded-xl border border-dashed border-zinc-700/60 bg-zinc-900/30 py-4 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:bg-zinc-900/50 hover:text-zinc-300"
            >
              Write a review...
            </button>
          )
        ) : (
          <p className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-4 py-3 text-sm text-zinc-500">
            {disabledMessage || "Reviews are not available right now."}
          </p>
        )
      ) : (
        <p className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-4 py-3 text-sm text-zinc-500">
          Sign in to leave a review.
        </p>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No reviews yet — be the first to share your thoughts.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const rec = REC_CONFIG[review.recommendation] ?? REC_CONFIG.mixed;
            const badgeColors = {
              emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
              amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
              rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
            };

            return (
              <article
                key={review.id}
                className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-medium text-white">{review.headline}</h4>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {review.author?.name ?? "Community member"}
                    </p>
                  </div>
                  <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${badgeColors[rec.color as keyof typeof badgeColors]}`}>
                    {rec.short}
                  </span>
                </div>
                <RichText text={review.body} className="text-sm leading-relaxed text-zinc-400" />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
