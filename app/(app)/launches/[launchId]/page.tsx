"use client";

import { use, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LaunchCollaboratorCTA from "@/components/launches/LaunchCollaboratorCTA";
import LaunchFeedbackBoard from "@/components/launches/LaunchFeedbackBoard";
import LaunchHero from "@/components/launches/LaunchHero";
import LaunchLinkBar from "@/components/launches/LaunchLinkBar";
import LaunchReviewPanel from "@/components/launches/LaunchReviewPanel";
import LaunchScreenshotGallery from "@/components/launches/LaunchScreenshotGallery";
import NextStepsPanel from "@/components/connected/NextStepsPanel";
import RelatedEntitiesPanel from "@/components/connected/RelatedEntitiesPanel";
import TrustContextCard from "@/components/connected/TrustContextCard";
import Spinner from "@/components/ui/Spinner";
import {
  ArrowLeftIcon,
  ChatBubbleIcon,
  DotsIcon,
  GlobeIcon,
  HeartIcon,
  LockIcon,
  RocketIcon,
  SparklesIcon,
  UsersIcon,
  ShareIcon,
} from "@/components/ui/Icons";
import { useAuth } from "@/lib/hooks/useAuth";
import { useLaunch, useLaunchBetaRegistrations, useLaunchFeedback, useLaunchReviews } from "@/lib/hooks/useLaunches";
import * as launchesApi from "@/lib/services/launchesApi";

function humanize(value: string) {
  return value.replace(/-/g, " ");
}

function getInitials(name?: string | null) {
  if (!name) return "LD";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// Simplified section component - just a heading and content
function Section({ id, title, count, children }: { id: string; title: string; count?: number; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {typeof count === "number" && count > 0 && (
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium tabular-nums text-zinc-400">
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

export default function LaunchDetailPage({ params }: { params: Promise<{ launchId: string }> }) {
  const { launchId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { launch, loading, error, refetch } = useLaunch(launchId);
  const { reviews, refetch: refetchReviews } = useLaunchReviews(launchId);
  const [feedbackType, setFeedbackType] = useState("suggestion");
  const { feedback, refetch: refetchFeedback } = useLaunchFeedback(launchId, { type: feedbackType });
  const { registrations, refetch: refetchRegistrations } = useLaunchBetaRegistrations(
    launchId,
    Boolean(launch?.viewer_state?.can_moderate_beta)
  );
  const [upvoteLoading, setUpvoteLoading] = useState(false);
  const [betaActionLoading, setBetaActionLoading] = useState(false);
  const [ownerActionLoading, setOwnerActionLoading] = useState(false);
  const [ownerActionError, setOwnerActionError] = useState<string | null>(null);
  const [ownerSettingsOpen, setOwnerSettingsOpen] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [betaError, setBetaError] = useState<string | null>(null);
  const [betaMessage, setBetaMessage] = useState("");
  const [goLiveUrl, setGoLiveUrl] = useState("");

  const myReviewId = launch?.viewer_state?.my_review_id ?? null;
  const canToggleUpvote = Boolean(user && launch && !launch.viewer_state?.is_owner);
  const isUpvoted = Boolean(launch?.viewer_state?.is_upvoted_by_me);

  const descriptionParagraphs = useMemo(
    () => (launch?.description ?? "").split(/\n{2,}/).filter(Boolean),
    [launch?.description]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !launch) {
    return (
      <p className="m-4 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
        {error ?? "Launch not found."}
      </p>
    );
  }

  const screenshotCount = launch.screenshots?.length ?? 0;
  const hasResources = Boolean(launch.live_url || launch.demo_url || launch.website_url || launch.github_url || launch.docs_url);
  const techStack = launch.tech_stack ?? [];
  const hasLiveAccess = Boolean(launch.live_url || launch.demo_url || launch.website_url);
  const isBetaLaunch = launch.launch_phase === "beta";
  const canViewFeedbackSection = !isBetaLaunch
    || Boolean(launch.viewer_state?.is_owner || launch.viewer_state?.can_access_beta);
  const betaSummary = launch.beta_summary;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-4 sm:px-6">
      {/* Back link */}
      <Link
        href="/launches"
        className="group mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        All launches
      </Link>

      <div className="space-y-8">
        {/* Hero section */}
        <LaunchHero launch={launch} />

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Upvote button */}
          <button
            onClick={async () => {
              if (!canToggleUpvote) return;
              setUpvoteLoading(true);
              try {
                if (isUpvoted) {
                  await launchesApi.removeLaunchUpvote(launchId);
                } else {
                  await launchesApi.upvoteLaunch(launchId);
                }
                await refetch();
              } finally {
                setUpvoteLoading(false);
              }
            }}
            disabled={!canToggleUpvote || upvoteLoading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              isUpvoted
                ? "bg-rose-500/15 text-rose-400 hover:bg-rose-500/20"
                : "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <HeartIcon className="h-4 w-4" filled={isUpvoted} />
            <span className="tabular-nums">{launch.upvote_count}</span>
          </button>

          {/* Share */}
          <Link
            href={`/feed?shareType=launch&shareId=${launch.id}&shareTitle=${encodeURIComponent(launch.name)}&shareSubtitle=${encodeURIComponent(launch.tagline || "")}&shareHref=${encodeURIComponent(`/launches/${launch.id}`)}`}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-800/60 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            <ShareIcon className="h-4 w-4" />
            Share
          </Link>

          {/* Primary CTA */}
          {isBetaLaunch ? (
            launch.viewer_state?.can_access_beta && launch.beta_access_url ? (
              <a
                href={launch.beta_access_url}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-400"
              >
                <RocketIcon className="h-4 w-4" />
                Access Beta
              </a>
            ) : (
              <button
                type="button"
                disabled={!launch.viewer_state?.can_request_beta || betaActionLoading}
                onClick={async () => {
                  if (!launch.viewer_state?.can_request_beta) return;
                  setBetaError(null);
                  setBetaActionLoading(true);
                  try {
                    await launchesApi.requestBetaAccess(launch.id, { message: undefined });
                    await refetch();
                  } catch (err: unknown) {
                    setBetaError(err instanceof Error ? err.message : "Failed to request beta");
                  } finally {
                    setBetaActionLoading(false);
                  }
                }}
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-zinc-100 disabled:opacity-50"
              >
                {launch.viewer_state?.beta_registration_status === "pending" ? "Request Pending" : "Request Beta"}
              </button>
            )
          ) : hasLiveAccess ? (
            <a
              href={launch.live_url || launch.website_url || launch.demo_url || "#"}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-400"
            >
              <GlobeIcon className="h-4 w-4" />
              Visit Live
            </a>
          ) : null}

          {/* Owner settings */}
          {launch.viewer_state?.is_owner && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOwnerSettingsOpen(!ownerSettingsOpen)}
                className="rounded-xl bg-zinc-800/60 p-2.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                aria-label="Settings"
              >
                <DotsIcon className="h-5 w-5" />
              </button>

              {ownerSettingsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOwnerSettingsOpen(false)} />
                  <div className="absolute right-0 top-12 z-20 min-w-40 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
                    <Link
                      href={`/launches/${launch.id}/edit`}
                      onClick={() => setOwnerSettingsOpen(false)}
                      className="block px-4 py-2.5 text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
                    >
                      Edit launch
                    </Link>
                    {launch.status !== "published" && (
                      <button
                        type="button"
                        disabled={ownerActionLoading}
                        onClick={async () => {
                          setOwnerActionError(null);
                          setOwnerActionLoading(true);
                          try {
                            await launchesApi.publishLaunch(launch.id);
                            await refetch();
                            setOwnerSettingsOpen(false);
                          } catch (err: unknown) {
                            setOwnerActionError(err instanceof Error ? err.message : "Failed to publish");
                          } finally {
                            setOwnerActionLoading(false);
                          }
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-100 hover:bg-zinc-800"
                      >
                        <RocketIcon className="h-4 w-4" />
                        Publish
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={ownerActionLoading}
                      onClick={async () => {
                        if (!window.confirm("Delete this launch permanently?")) return;
                        setOwnerActionLoading(true);
                        try {
                          await launchesApi.deleteLaunch(launch.id);
                          router.push("/launches/me");
                        } catch (err: unknown) {
                          setOwnerActionError(err instanceof Error ? err.message : "Failed to delete");
                        } finally {
                          setOwnerActionLoading(false);
                        }
                      }}
                      className="flex w-full items-center border-t border-zinc-800 px-4 py-2.5 text-left text-sm text-rose-400 hover:bg-rose-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {ownerActionError && <p className="text-sm text-rose-400">{ownerActionError}</p>}
        {betaError && <p className="text-sm text-rose-400">{betaError}</p>}

        {/* About section */}
        <Section id="about" title="About">
          <div className="space-y-4 text-sm leading-relaxed text-zinc-400">
            {descriptionParagraphs.length > 0 ? (
              descriptionParagraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p className="text-zinc-500">No description provided.</p>
            )}
          </div>
        </Section>

        {/* Tech Stack */}
        {techStack.length > 0 && (
          <Section id="tech" title="Tech Stack">
            <div className="flex flex-wrap gap-2">
              {techStack.map((item) => (
                <span
                  key={item.id}
                  className="rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-300"
                >
                  {item.technology}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Resources / Links */}
        {hasResources && (
          <Section id="links" title="Links">
            <LaunchLinkBar launch={launch} />
          </Section>
        )}

        {/* Screenshots */}
        {screenshotCount > 0 && (
          <Section id="screenshots" title="Screenshots" count={screenshotCount}>
            <LaunchScreenshotGallery screenshots={launch.screenshots ?? []} />
          </Section>
        )}

        {/* Beta Access Section (for beta launches) */}
        {isBetaLaunch && (
          <Section id="beta" title="Beta Access">
            <div className="space-y-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-lg bg-sky-500/15 px-3 py-1.5 text-sm font-medium text-sky-400">
                  {betaSummary?.approved_count ?? 0}
                  {betaSummary?.capacity ? ` / ${betaSummary.capacity}` : ""} approved
                </span>
                {betaSummary?.is_full && (
                  <span className="rounded-lg bg-amber-500/15 px-3 py-1.5 text-sm font-medium text-amber-400">
                    Waitlist open
                  </span>
                )}
              </div>

              {launch.viewer_state?.is_owner ? (
                <div className="space-y-4">
                  <p className="text-sm text-zinc-400">
                    Manage beta testers below. When ready, add a live URL to go public.
                  </p>

                  <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                    <label className="block text-xs font-medium text-zinc-500">Live URL (to go public)</label>
                    <input
                      value={goLiveUrl}
                      onChange={(e) => setGoLiveUrl(e.target.value)}
                      placeholder={launch.live_url || "https://..."}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={betaActionLoading}
                      onClick={async () => {
                        setBetaError(null);
                        setBetaActionLoading(true);
                        try {
                          await launchesApi.goLiveLaunch(launch.id, { live_url: goLiveUrl.trim() || undefined });
                          await refetch();
                          setGoLiveUrl("");
                        } catch (err: unknown) {
                          setBetaError(err instanceof Error ? err.message : "Failed to go live");
                        } finally {
                          setBetaActionLoading(false);
                        }
                      }}
                      className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                    >
                      Go Live
                    </button>
                  </div>

                  {/* Beta registrations management */}
                  {registrations.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-zinc-300">
                        Applicants ({betaSummary?.pending_count ?? 0} pending)
                      </h4>
                      {registrations.map((reg) => (
                        <div key={reg.id} className="flex items-start justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                          <div>
                            <p className="text-sm font-medium text-white">{reg.user?.name ?? "User"}</p>
                            <p className="text-xs text-zinc-500 uppercase">{reg.status}</p>
                            {reg.message && <p className="mt-2 text-sm text-zinc-400">{reg.message}</p>}
                          </div>
                          {reg.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  await launchesApi.approveBetaRegistration(launch.id, reg.id);
                                  await Promise.all([refetch(), refetchRegistrations()]);
                                }}
                                className="rounded-lg border border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10"
                              >
                                Approve
                              </button>
                              <button
                                onClick={async () => {
                                  await launchesApi.rejectBetaRegistration(launch.id, reg.id);
                                  await Promise.all([refetch(), refetchRegistrations()]);
                                }}
                                className="rounded-lg border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {launch.viewer_state?.can_access_beta ? (
                    <p className="text-sm text-emerald-400">✓ You have beta access</p>
                  ) : launch.viewer_state?.beta_registration_status === "pending" ? (
                    <div className="space-y-3">
                      <p className="text-sm text-zinc-400">Your request is pending review.</p>
                      <button
                        type="button"
                        disabled={betaActionLoading}
                        onClick={async () => {
                          setBetaActionLoading(true);
                          try {
                            await launchesApi.withdrawBetaAccess(launch.id);
                            await refetch();
                          } finally {
                            setBetaActionLoading(false);
                          }
                        }}
                        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800"
                      >
                        Withdraw request
                      </button>
                    </div>
                  ) : launch.viewer_state?.can_request_beta ? (
                    <div className="space-y-3">
                      <textarea
                        value={betaMessage}
                        onChange={(e) => setBetaMessage(e.target.value)}
                        rows={2}
                        placeholder="Why do you want beta access? (optional)"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={betaActionLoading}
                        onClick={async () => {
                          setBetaActionLoading(true);
                          try {
                            await launchesApi.requestBetaAccess(launch.id, { message: betaMessage.trim() || undefined });
                            setBetaMessage("");
                            await refetch();
                          } catch (err: unknown) {
                            setBetaError(err instanceof Error ? err.message : "Failed to request");
                          } finally {
                            setBetaActionLoading(false);
                          }
                        }}
                        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 disabled:opacity-50"
                      >
                        {betaSummary?.is_full ? "Join Waitlist" : "Request Beta"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">Sign in to request beta access.</p>
                  )}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Builder info */}
        {launch.builder && (
          <Section id="builder" title="Built by">
            <div className="flex items-center gap-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-emerald-500/20 text-sm font-bold text-sky-300">
                {getInitials(launch.builder.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-medium text-white">{launch.builder.name}</p>
                {launch.builder.headline && (
                  <p className="mt-0.5 text-sm text-zinc-400">{launch.builder.headline}</p>
                )}
              </div>
              <Link
                href={`/profile/${launch.builder.username ?? launch.builder.id}`}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                View profile
              </Link>
            </div>
          </Section>
        )}

        {/* Collaboration CTA */}
        {launch.collaboration_mode === "looking" && (
          <LaunchCollaboratorCTA launch={launch} isAuthenticated={Boolean(user)} />
        )}

        {/* Reviews (for live launches) */}
        {!isBetaLaunch && (
          <Section id="reviews" title="Reviews" count={launch.review_count}>
            <LaunchReviewPanel
              key={`${myReviewId ?? "new"}`}
              reviews={reviews}
              currentUser={launch.viewer_state?.is_owner ? null : user}
              myReviewId={myReviewId}
              canReview={Boolean(user && launch.viewer_state?.can_submit_review)}
              error={reviewError}
              onSubmitReview={async (payload) => {
                setReviewError(null);
                try {
                  await launchesApi.upsertMyLaunchReview(launch.id, payload);
                  await Promise.all([refetchReviews(), refetch()]);
                } catch (err: unknown) {
                  setReviewError(err instanceof Error ? err.message : "Failed to save review");
                }
              }}
              onDeleteReview={async () => {
                setReviewError(null);
                try {
                  await launchesApi.deleteMyLaunchReview(launch.id);
                  await Promise.all([refetchReviews(), refetch()]);
                } catch (err: unknown) {
                  setReviewError(err instanceof Error ? err.message : "Failed to delete review");
                }
              }}
            />
          </Section>
        )}

        {/* Feedback */}
        {canViewFeedbackSection && (
          <Section id="feedback" title="Feedback" count={launch.feedback_count}>
            <LaunchFeedbackBoard
              launch={launch}
              currentUser={user}
              feedback={feedback}
              activeType={feedbackType}
              onActiveTypeChange={setFeedbackType}
              canPostFeedback={Boolean(user && launch.viewer_state?.can_submit_feedback)}
              disabledMessage={isBetaLaunch ? "Only approved beta users can post feedback." : null}
              error={feedbackError}
              onCreateFeedback={async (payload) => {
                setFeedbackError(null);
                try {
                  await launchesApi.createLaunchFeedback(launch.id, payload);
                  await Promise.all([refetchFeedback(), refetch()]);
                } catch (err: unknown) {
                  setFeedbackError(err instanceof Error ? err.message : "Failed to create feedback");
                }
              }}
              onUpdateFeedbackStatus={async (feedbackId, status) => {
                await launchesApi.updateLaunchFeedback(launch.id, feedbackId, { status });
                await refetchFeedback();
              }}
              onDeleteFeedback={async (feedbackId) => {
                await launchesApi.deleteLaunchFeedback(launch.id, feedbackId);
                await Promise.all([refetchFeedback(), refetch()]);
              }}
              onAddComment={async (feedbackId, body) => {
                await launchesApi.createLaunchFeedbackComment(launch.id, feedbackId, { body });
                await refetchFeedback();
              }}
            />
          </Section>
        )}

        {/* Related content (if available) */}
        {(launch.next_steps?.length || launch.related_entities?.length) && (
          <Section id="related" title="Related">
            <div className="grid gap-4 sm:grid-cols-2">
              {launch.next_steps && <NextStepsPanel items={launch.next_steps} />}
              {launch.related_entities && <RelatedEntitiesPanel items={launch.related_entities} />}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
