"use client";

import { useEffect, useState } from "react";
import type { LaunchReview, User } from "@/lib/types";

interface LaunchReviewPanelProps {
  reviews: LaunchReview[];
  currentUser?: User | null;
  myReviewId?: string | null;
  loading?: boolean;
  error?: string | null;
  onSubmitReview: (payload: { headline: string; body: string; recommendation: string }) => Promise<void> | void;
  onDeleteReview: () => Promise<void> | void;
}

const REC_STYLES: Record<string, { label: string; classes: string }> = {
  recommend: { label: "Recommends", classes: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" },
  mixed: { label: "Mixed feelings", classes: "border-amber-500/20 bg-amber-500/10 text-amber-300" },
  not_recommend: { label: "Not recommended", classes: "border-rose-500/20 bg-rose-500/10 text-rose-300" },
};

type Recommendation = keyof typeof REC_STYLES;

export default function LaunchReviewPanel({
  reviews,
  currentUser,
  myReviewId,
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

  useEffect(() => {
    setHeadline(myReview?.headline ?? "");
    setBody(myReview?.body ?? "");
    setRecommendation((myReview?.recommendation as Recommendation | undefined) ?? "recommend");
  }, [myReview]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    await onSubmitReview({ headline: headline.trim(), body: body.trim(), recommendation });
  };

  return (
    <div className="space-y-4">
      {currentUser ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-white">
                {myReview ? "Update your review" : "Share your review"}
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Highlight what worked, what did not, and whether you would recommend the launch.
              </p>
            </div>

            <div className="space-y-3">
              <input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="One-line summary"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
              />

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Share what worked, what didn't, and your overall verdict"
                className="w-full resize-y rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-7 text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {(Object.entries(REC_STYLES) as [Recommendation, { label: string; classes: string }][]).map(
                  ([val, { label, classes }]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRecommendation(val)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        recommendation === val
                          ? classes
                          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                {myReview && (
                  <button
                    type="button"
                    onClick={() => onDeleteReview()}
                    className="min-h-10 rounded-2xl border border-rose-500/20 px-4 py-2 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
                  >
                    Delete
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-10 rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-60"
                >
                  {loading ? "Saving…" : myReview ? "Update review" : "Post review"}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-rose-400">{error}</p>}
          </div>
        </form>
      ) : (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-500">
          Sign in to leave a review.
        </p>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-6 text-center text-sm text-zinc-500">
          No reviews yet — be the first!
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const rec = REC_STYLES[review.recommendation] ?? REC_STYLES.mixed;

            return (
              <article key={review.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/55 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold text-white [overflow-wrap:anywhere]">{review.headline}</h4>
                    <p className="mt-1 text-xs text-zinc-500 [overflow-wrap:anywhere]">
                      {review.author?.name ?? "Community member"}
                    </p>
                  </div>

                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${rec.classes}`}>
                    {rec.label}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-zinc-300 [overflow-wrap:anywhere]">{review.body}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
