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
import Avatar from "@/components/ui/Avatar";
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
  CodeBracketIcon,
  FolderIcon,
  CalendarIcon,
  RepeatIcon,
} from "@/components/ui/Icons";
import { useAuth } from "@/lib/hooks/useAuth";
import { useLaunch, useLaunchBetaRegistrations, useLaunchFeedback, useLaunchReviews } from "@/lib/hooks/useLaunches";
import * as launchesApi from "@/lib/services/launchesApi";


function humanize(value: string) {
  return value.replace(/-/g, " ");
}

// Simplified section component - just a heading and content
function Section({ id, title, count, children }: { id: string; title: string; count?: number; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        {typeof count === "number" && count > 0 && (
          <span className="rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium tabular-nums text-text-muted">
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
  const [refreshing, setRefreshing] = useState(false);

  const myReviewId = launch?.viewer_state?.my_review_id ?? null;
  const canToggleUpvote = Boolean(user && launch && !launch.viewer_state?.is_owner);
  const isUpvoted = Boolean(launch?.viewer_state?.is_upvoted_by_me);

  const descriptionParagraphs = useMemo(
    () => (launch?.description ?? "").split(/\n{2,}/).filter(Boolean),
    [launch?.description]
  );

  if (loading && !launch) {
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

  const banner = launch.screenshots?.[0]?.image_url;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-4 sm:px-6">
      {/* Back link */}
      <Link
        href="/launches"
        className="group mb-6 inline-flex items-center gap-1.5 text-xs text-text-disabled transition-colors hover:text-text-secondary"
      >
        <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 text-text-disabled" />
        All launches
      </Link>

      {/* Two-column layout grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main/Left column (2 cols wide) */}
        <div className="lg:col-span-2 space-y-10">
          {/* Hero section */}
          <LaunchHero launch={launch} />

          {/* Product Story / Value Proposition section */}
          <section id="about" className="scroll-mt-20 space-y-5">
            <div className="border-b border-border-default/80 pb-4">
              <h2 className="text-xl font-bold tracking-tight text-text-primary">Product Story</h2>
              <p className="mt-1 text-xs text-text-disabled font-light">
                Why {launch.name} exists and the philosophy behind its creation.
              </p>
            </div>
            
            <div className="space-y-4 text-sm leading-relaxed text-text-muted font-light">
              {descriptionParagraphs.length > 0 ? (
                descriptionParagraphs.map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p className="text-text-disabled italic">No description provided.</p>
              )}
            </div>
          </section>

          {/* Screenshots Gallery / Preview */}
          {screenshotCount > 0 && (
            <section id="screenshots" className="scroll-mt-20 space-y-4">
              <div className="border-b border-border-default/80 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-text-primary">Product Previews</h2>
                  <p className="mt-1 text-xs text-text-disabled font-light">
                    Walkthrough screenshots of the developer interface.
                  </p>
                </div>
                <span className="rounded-full bg-surface-hover px-3 py-1 text-xs font-semibold tabular-nums text-text-muted border border-border-default">
                  {screenshotCount} preview{screenshotCount > 1 ? "s" : ""}
                </span>
              </div>
              <LaunchScreenshotGallery screenshots={launch.screenshots ?? []} />
            </section>
          )}

          {/* Feedback section (for beta launches) or Reviews (for live launches) */}
          {isBetaLaunch ? (
            canViewFeedbackSection && (
              <section id="feedback" className="scroll-mt-20 space-y-4">
                <div className="border-b border-border-default/80 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-text-primary">Feedback Hub</h2>
                    <p className="mt-1 text-xs text-text-disabled font-light">
                      Roadmap ideas, bugs, and feature suggestions from testers.
                    </p>
                  </div>
                  {launch.feedback_count > 0 && (
                    <span className="rounded-full bg-surface-hover px-3 py-1 text-xs font-semibold tabular-nums text-text-muted border border-border-default">
                      {launch.feedback_count} item{launch.feedback_count > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
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
              </section>
            )
          ) : (
            <section id="reviews" className="scroll-mt-20 space-y-4">
              <div className="border-b border-border-default/80 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-text-primary">Product Reviews</h2>
                  <p className="mt-1 text-xs text-text-disabled font-light">
                    What other developers think of {launch.name}.
                  </p>
                </div>
                {launch.review_count > 0 && (
                  <span className="rounded-full bg-surface-hover px-3 py-1 text-xs font-semibold tabular-nums text-text-muted border border-border-default">
                    {launch.review_count} review{launch.review_count > 1 ? "s" : ""}
                  </span>
                )}
              </div>
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
            </section>
          )}

          {/* Related content */}
          {(launch.next_steps?.length || launch.related_entities?.length) && (
            <section id="related" className="scroll-mt-20 space-y-4 border-t border-border-default/60 pt-6">
              <h2 className="text-base font-bold text-text-primary">Next Steps & Related Spaces</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {launch.next_steps && <NextStepsPanel items={launch.next_steps} />}
                {launch.related_entities && <RelatedEntitiesPanel items={launch.related_entities} />}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar/Right column (1 col wide) */}
        <div className="lg:col-span-1 space-y-6">
          {/* 1. Action panel (Upvote & Share) */}
          <div className="rounded-2xl border border-border-default/80 bg-app/40 p-5 space-y-4">
            <div className="flex items-center gap-3">
              {/* Upvote */}
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
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all cursor-pointer ${
                  isUpvoted
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/15"
                    : "bg-surface/60 text-zinc-350 border border-border-default hover:bg-surface-hover hover:text-text-primary"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <HeartIcon className="h-4 w-4" filled={isUpvoted} />
                <span>{launch.upvote_count} Upvotes</span>
              </button>

              {/* Share */}
              <Link
                href={`/feed?shareType=launch&shareId=${launch.id}&shareTitle=${encodeURIComponent(launch.name)}&shareSubtitle=${encodeURIComponent(launch.tagline || "")}&shareHref=${encodeURIComponent(`/launches/${launch.id}`)}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-surface/60 border border-border-default px-4 py-3 text-sm font-semibold text-zinc-350 hover:bg-surface-hover hover:text-text-primary transition-all"
              >
                <ShareIcon className="h-4 w-4" />
                <span>Share</span>
              </Link>
            </div>

            {/* Visit live link if public & has access */}
            {!isBetaLaunch && hasLiveAccess && (
              <a
                href={launch.live_url || launch.website_url || launch.demo_url || "#"}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-emerald-500/10 transition-colors"
              >
                <GlobeIcon className="h-4 w-4" />
                Visit Product Live
              </a>
            )}

            {/* Owner settings dropdown */}
            {launch.viewer_state?.is_owner && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOwnerSettingsOpen(!ownerSettingsOpen)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface/60 border border-border-default px-4 py-2.5 text-xs font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-all cursor-pointer"
                >
                  <DotsIcon className="h-4 w-4" />
                  <span>Manage Launch</span>
                </button>

                {ownerSettingsOpen && (
                  <>
                    <div className="fixed inset-0 z-10 cursor-pointer" onClick={() => setOwnerSettingsOpen(false)} />
                    <div className="absolute right-0 left-0 mt-2 z-20 overflow-hidden rounded-xl border border-border-default bg-app shadow-2xl">
                      <Link
                        href={`/launches/${launch.id}/edit`}
                        onClick={() => setOwnerSettingsOpen(false)}
                        className="block px-4 py-3 text-xs text-zinc-350 transition-colors hover:bg-surface hover:text-text-primary"
                      >
                        Edit launch details
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
                          className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs text-zinc-350 hover:bg-surface hover:text-text-primary cursor-pointer border-t border-border-subtle"
                        >
                          <RocketIcon className="h-3.5 w-3.5 text-text-disabled" />
                          Publish Launch
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
                        className="flex w-full items-center border-t border-border-subtle px-4 py-3 text-left text-xs text-rose-400 hover:bg-rose-950/20 cursor-pointer"
                      >
                        Delete Launch
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {ownerActionError && <p className="text-xs text-rose-400 mt-2">{ownerActionError}</p>}
          </div>

          {/* 2. Beta program capacity & actions */}
          {isBetaLaunch && (
            <div className="rounded-2xl border border-border-default bg-app/40 p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                    <RocketIcon className="h-4 w-4 text-sky-400" />
                    Beta Program
                  </h3>
                  {user && (
                    <button
                      type="button"
                      disabled={refreshing}
                      onClick={async () => {
                        setRefreshing(true);
                        try {
                          await Promise.all([refetch(), refetchRegistrations()]);
                        } finally {
                          setRefreshing(false);
                        }
                      }}
                      className="rounded-lg p-1 text-text-disabled hover:bg-surface hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50"
                      title="Reload requests"
                    >
                      <RepeatIcon className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-sky-400" : ""}`} />
                    </button>
                  )}
                </div>
                <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-400 border border-sky-500/20">
                  {launch.beta_summary?.is_full ? "Waitlist" : "Beta Access"}
                </span>
              </div>

              {/* Capacity progress */}
              {betaSummary && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-disabled">Program capacity</span>
                    <span className="font-semibold text-text-secondary">
                      {betaSummary.approved_count}
                      {betaSummary.capacity ? ` / ${betaSummary.capacity}` : ""} approved
                    </span>
                  </div>
                  {betaSummary.capacity && (
                    <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden border border-border-default">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (betaSummary.approved_count / betaSummary.capacity) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Owner applicant management flow */}
              {launch.viewer_state?.is_owner ? (
                <div className="space-y-5">
                  {/* Go Live section */}
                  <div className="space-y-3 rounded-xl border border-border-subtle bg-app/80 p-3.5">
                    <div>
                      <p className="text-xs font-semibold text-text-primary">Graduate to Public Launch</p>
                      <p className="mt-0.5 text-[10px] text-text-disabled font-light">
                        Add your live URL and make LogoutDev open to everyone.
                      </p>
                    </div>
                    <input
                      value={goLiveUrl}
                      onChange={(e) => setGoLiveUrl(e.target.value)}
                      placeholder={launch.live_url || "https://logoutdev.com"}
                      className="w-full rounded-lg border border-border-default bg-app px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none"
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
                      className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 py-2 text-xs font-semibold text-primary-foreground transition-colors cursor-pointer border border-emerald-600/30"
                    >
                      Go Live Now
                    </button>
                  </div>

                  {/* Applicants list */}
                  {registrations.length > 0 ? (
                    <div className="space-y-3 border-t border-border-subtle pt-4">
                      <h4 className="text-xs font-semibold text-text-muted">
                        Applicants ({betaSummary?.pending_count ?? 0} pending)
                      </h4>
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {registrations.map((reg) => (
                          <div key={reg.id} className="flex flex-col gap-2 rounded-xl border border-border-default bg-app/40 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <Link
                                href={`/profile/${reg.user?.username || reg.user?.id}`}
                                className="flex items-center gap-2.5 min-w-0 group hover:opacity-90"
                              >
                                <Avatar user={reg.user} size="sm" className="ring-1 ring-border-default" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-text-primary truncate group-hover:underline">
                                    {reg.user?.name ?? "User"}
                                  </p>
                                  <p className="text-[9px] text-text-disabled uppercase tracking-wider mt-0.5">{reg.status}</p>
                                </div>
                              </Link>
                              {reg.status === "pending" && (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={async () => {
                                      await launchesApi.approveBetaRegistration(launch.id, reg.id);
                                      await Promise.all([refetch(), refetchRegistrations()]);
                                    }}
                                    className="rounded bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await launchesApi.rejectBetaRegistration(launch.id, reg.id);
                                      await Promise.all([refetch(), refetchRegistrations()]);
                                    }}
                                    className="rounded bg-surface px-2.5 py-1 text-[10px] font-semibold text-text-muted border border-border-default hover:bg-surface-hover cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                            {reg.message && (
                              <p className="text-xs text-text-muted bg-app/60 rounded p-2 border border-border-subtle leading-relaxed font-light">
                                {reg.message}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-text-disabled text-center py-2 font-light">No applicants yet.</p>
                  )}
                </div>
              ) : (
                /* Tester flows */
                <div className="space-y-4 pt-1">
                  {launch.viewer_state?.can_access_beta ? (
                    <div className="space-y-3">
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-center">
                        <p className="text-xs font-semibold text-emerald-400">✓ You have active Beta access</p>
                        <p className="text-[10px] text-text-disabled font-light mt-1">
                          Graduate user access verified. Open application using the link below.
                        </p>
                      </div>
                      {launch.beta_access_url && (
                        <a
                          href={launch.beta_access_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors shadow-lg shadow-sky-500/10 cursor-pointer"
                        >
                          <RocketIcon className="h-4 w-4" />
                          Access Beta Version
                        </a>
                      )}
                    </div>
                  ) : launch.viewer_state?.beta_registration_status === "pending" ? (
                    <div className="space-y-3">
                      <div className="rounded-xl bg-surface/60 border border-border-default p-3.5 text-center">
                        <p className="text-xs font-semibold text-amber-400">⏳ Request Pending Review</p>
                        <p className="text-[10px] text-text-disabled font-light mt-1">
                          Your request to access this beta version has been logged and is awaiting approval.
                        </p>
                      </div>
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
                        className="w-full rounded-xl border border-border-default bg-surface/40 hover:bg-surface hover:text-text-primary py-2 text-xs font-semibold text-text-muted transition-colors cursor-pointer"
                      >
                        Withdraw Request
                      </button>
                    </div>
                  ) : launch.viewer_state?.can_request_beta ? (
                    <div className="space-y-3">
                      <textarea
                        value={betaMessage}
                        onChange={(e) => setBetaMessage(e.target.value)}
                        rows={3}
                        placeholder="Introduce yourself to the builder and share why you'd like to test this beta version... (optional)"
                        className="w-full rounded-xl border border-border-default bg-app px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none"
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
                        className="w-full rounded-xl bg-primary hover:bg-zinc-150 py-2.5 text-xs font-bold text-primary-foreground transition-colors cursor-pointer"
                      >
                        {betaSummary?.is_full ? "Join Waitlist" : "Apply for Beta Access"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-text-disabled text-center font-light py-2">
                      Sign in to apply for beta access.
                    </p>
                  )}
                </div>
              )}
              {betaError && <p className="text-xs text-rose-400 mt-2">{betaError}</p>}
            </div>
          )}

          {/* 3. Builder Info Card */}
          {launch.builder && (
            <div className="rounded-2xl border border-border-default bg-app/40 p-5 space-y-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-text-disabled border-b border-border-subtle pb-2">
                Created By
              </p>
              <div className="flex items-center gap-4">
                <Avatar
                  user={launch.builder}
                  size="md"
                  className="ring-2 ring-border-default/80 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-text-primary truncate">{launch.builder.name}</p>
                  <p className="text-xs text-text-disabled truncate mt-0.5">
                    @{launch.builder.username || launch.builder.id}
                  </p>
                </div>
                <Link
                  href={`/profile/${launch.builder.username ?? launch.builder.id}`}
                  className="rounded-lg border border-border-default bg-surface hover:bg-surface-hover hover:text-text-primary px-3 py-1.5 text-xs font-semibold text-zinc-350 transition-all"
                >
                  Profile
                </Link>
              </div>
              {launch.builder.headline && (
                <p className="text-xs text-zinc-405 leading-relaxed font-light pl-0.5">
                  {launch.builder.headline}
                </p>
              )}
            </div>
          )}

          {/* 5. Source & Workspace Card */}
          {(launch.linked_space || (launch.linked_repos && launch.linked_repos.some((r) => r.repo))) && (
            <div className="rounded-2xl border border-border-default bg-app/40 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-text-disabled">
                  Source & Workspace
                </p>
                {launch.is_open_source ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                    <CodeBracketIcon className="h-3 w-3" />
                    Open Source
                  </span>
                ) : null}
              </div>

              {/* Linked space */}
              {launch.linked_space && (
                <Link
                  href={`/spaces/${launch.linked_space.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border-default bg-surface/40 px-3 py-2.5 transition-colors hover:border-border-strong hover:bg-surface"
                >
                  <FolderIcon className="h-4 w-4 shrink-0 text-amber-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-text-primary">
                      {launch.linked_space.name ?? "Private workspace"}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-text-disabled">
                      {launch.linked_space.visibility === "private" ? "Private space" : "Public space"}
                    </p>
                  </div>
                  {launch.linked_space.visibility === "private" && (
                    <LockIcon className="h-3.5 w-3.5 shrink-0 text-text-disabled" />
                  )}
                </Link>
              )}

              {/* Linked repos */}
              {launch.linked_repos && launch.linked_repos.filter((r) => r.repo).length > 0 && (
                <div className="space-y-2">
                  {launch.linked_repos
                    .filter((entry) => entry.repo)
                    .map((entry) => {
                      const repo = entry.repo!;
                      return (
                        <Link
                          key={entry.id || entry.repo_id}
                          href={`/repos/${repo.id}`}
                          className="flex items-center gap-3 rounded-xl border border-border-default bg-surface/40 px-3 py-2.5 transition-colors hover:border-border-strong hover:bg-surface"
                        >
                          <CodeBracketIcon className="h-4 w-4 shrink-0 text-sky-400" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-text-primary">{repo.name}</p>
                            <p className="text-[10px] uppercase tracking-wider text-text-disabled">
                              {repo.visibility === "private" ? "Private repo" : "Public repo"}
                              {repo.archived_at ? " · Archived" : ""}
                            </p>
                          </div>
                          {repo.visibility === "private" && (
                            <LockIcon className="h-3.5 w-3.5 shrink-0 text-text-disabled" />
                          )}
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* 6. Collaboration CTA */}
          {launch.collaboration_mode === "looking" && (
            <LaunchCollaboratorCTA launch={launch} isAuthenticated={Boolean(user)} />
          )}

          {/* 7. Tech Stack Card */}
          {techStack.length > 0 && (
            <div className="rounded-2xl border border-border-default bg-app/40 p-5 space-y-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-text-disabled border-b border-border-subtle pb-2">
                Tech Stack
              </p>
              <div className="flex flex-wrap gap-2">
                {techStack.map((item) => (
                  <span
                    key={item.id}
                    className="rounded-lg border border-border-default bg-surface/60 px-3 py-1.5 text-xs font-medium text-text-secondary"
                  >
                    {item.technology}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 8. Resources & Links Card */}
          {hasResources && (
            <div className="rounded-2xl border border-border-default bg-app/40 p-5 space-y-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-text-disabled border-b border-border-subtle pb-2">
                Resources & Links
              </p>
              <LaunchLinkBar launch={launch} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
