"use client";

import { use, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
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
  BoltIcon,
  ChatBubbleIcon,
  ClockIcon,
  GlobeIcon,
  HeartIcon,
  LockIcon,
  PencilSquareIcon,
  RocketIcon,
  SparklesIcon,
  UsersIcon,
} from "@/components/ui/Icons";
import { useAuth } from "@/lib/hooks/useAuth";
import { useLaunch, useLaunchFeedback, useLaunchReviews } from "@/lib/hooks/useLaunches";
import * as launchesApi from "@/lib/services/launchesApi";

function humanize(value: string) {
  return value.replace(/-/g, " ");
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
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

interface SectionShellProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  count?: number | null;
  children: ReactNode;
}

function SectionShell({ id, eyebrow, title, description, count = null, children }: SectionShellProps) {
  return (
    <section
      id={id}
      className="scroll-mt-20 rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] sm:p-6"
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">{eyebrow}</p>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
            {typeof count === "number" && count > 0 && (
              <span className="rounded-full border border-zinc-700 bg-zinc-950/70 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-300">
                {count}
              </span>
            )}
          </div>
          {description && <p className="max-w-3xl text-sm leading-6 text-zinc-400">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

function MetricTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-3 sm:p-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

function DetailTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white [overflow-wrap:anywhere]">{value}</p>
      {helper ? <p className="mt-1 text-xs leading-5 text-zinc-500">{helper}</p> : null}
    </div>
  );
}

export default function LaunchDetailPage({ params }: { params: Promise<{ launchId: string }> }) {
  const { launchId } = use(params);
  const { user } = useAuth();
  const { launch, loading, error, refetch } = useLaunch(launchId);
  const { reviews, refetch: refetchReviews } = useLaunchReviews(launchId);
  const [feedbackType, setFeedbackType] = useState("suggestion");
  const { feedback, refetch: refetchFeedback } = useLaunchFeedback(launchId, { type: feedbackType });
  const [upvoteLoading, setUpvoteLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

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
  const hasResources = Boolean(launch.demo_url || launch.website_url || launch.github_url || launch.docs_url);
  const techStack = launch.tech_stack ?? [];
  const hasLiveAccess = Boolean(launch.demo_url || launch.website_url);
  const hasConnections = Boolean(
    launch.builder ||
      launch.linked_space_id ||
      (launch.collaboration_mode === "looking" && launch.linked_space_id)
  );
  const statusDotClassName =
    launch.status === "published" ? "bg-emerald-400" : launch.status === "draft" ? "bg-amber-400" : "bg-zinc-500";

  const sectionLinks = [
    { href: "#overview", label: "Overview", count: null as number | null },
    ...(hasConnections ? [{ href: "#connections", label: "People", count: null as number | null }] : []),
    ...(screenshotCount > 0 ? [{ href: "#screenshots", label: "Screenshots", count: screenshotCount }] : []),
    { href: "#reviews", label: "Reviews", count: launch.review_count },
    { href: "#feedback", label: "Feedback", count: launch.feedback_count },
  ];

  return (
    <div className="relative isolate mx-auto max-w-5xl px-4 pb-24 pt-4 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_50%_at_25%_-10%,rgba(56,189,248,0.16),transparent),radial-gradient(ellipse_50%_40%_at_85%_0%,rgba(16,185,129,0.12),transparent)]" />

      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/launches"
            className="group inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            All launches
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-950/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            <span className={`h-1.5 w-1.5 rounded-full ${statusDotClassName}`} />
            {humanize(launch.status)}
          </div>
        </div>

        <LaunchHero launch={launch} />

        <section className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.24)] sm:p-6">
          <div className="space-y-5">
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Launch cockpit</p>
                <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">See the launch at a glance</h2>
                <p className="max-w-3xl text-sm leading-6 text-zinc-400">
                  Start with traction, access, and release details, then move into screenshots, reviews, and product feedback.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
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
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all ${
                    isUpvoted
                      ? "bg-rose-500/12 text-rose-300 ring-1 ring-rose-500/25 hover:bg-rose-500/18"
                      : "bg-zinc-950 text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-900 hover:ring-zinc-600"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  <HeartIcon className="h-4 w-4" filled={isUpvoted} />
                  {isUpvoted ? "Upvoted" : "Upvote"}
                  <span className="ml-0.5 tabular-nums text-zinc-400">{launch.upvote_count}</span>
                </button>

                {launch.viewer_state?.is_owner && (
                  <>
                    <Link
                      href={`/launches/${launch.id}/edit`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-zinc-700 transition-colors hover:bg-zinc-900 hover:text-white"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit launch
                    </Link>

                    {launch.status !== "published" && (
                      <button
                        onClick={async () => {
                          await launchesApi.publishLaunch(launch.id);
                          await refetch();
                        }}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
                      >
                        <RocketIcon className="h-4 w-4" />
                        Publish
                      </button>
                    )}

                  </>
                )}

                <Link
                  href={`/feed?shareType=launch&shareId=${launch.id}&shareTitle=${encodeURIComponent(launch.name)}&shareSubtitle=${encodeURIComponent(launch.tagline || "")}&shareHref=${encodeURIComponent(`/launches/${launch.id}`)}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-zinc-700 transition-colors hover:bg-zinc-900 hover:text-white"
                >
                  Share update
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <MetricTile
                  icon={<HeartIcon className="h-4 w-4 text-rose-400" />}
                  label="Upvotes"
                  value={launch.upvote_count}
                />
                <MetricTile
                  icon={<ChatBubbleIcon className="h-4 w-4 text-sky-400" />}
                  label="Reviews"
                  value={launch.review_count}
                />
                <MetricTile
                  icon={<SparklesIcon className="h-4 w-4 text-amber-400" />}
                  label="Feedback"
                  value={launch.feedback_count}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailTile
                  label="Development stage"
                  value={humanize(launch.development_stage)}
                  helper="Current build maturity"
                />
                <DetailTile
                  label="Product type"
                  value={humanize(launch.product_type)}
                  helper="How this launch is positioned"
                />
                <DetailTile
                  label="Published"
                  value={formatDate(launch.published_at ?? launch.created_at)}
                  helper="Most relevant public date"
                />
                <DetailTile
                  label="Access"
                  value={hasLiveAccess ? "Live access" : "Private access"}
                  helper={hasLiveAccess ? "Demo or site is available now" : "Shared privately or by request"}
                />
              </div>
            </div>

            <div className="border-t border-zinc-800/70 pt-4">
              <nav className="flex flex-wrap items-center gap-2">
                {sectionLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800/80 bg-zinc-950/70 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200"
                  >
                    {item.label}
                    {item.count !== null && item.count > 0 && (
                      <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-400">
                        {item.count}
                      </span>
                    )}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </section>

        <SectionShell
          id="overview"
          eyebrow="Overview"
          title="What the builder is shipping"
          description="Read the builder's story first, then move into the launch resources and the stack behind it."
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">About this launch</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Product goals, positioning, and implementation notes from the builder.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {formatDate(launch.published_at ?? launch.created_at)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1">
                    {hasLiveAccess ? (
                      <GlobeIcon className="h-3.5 w-3.5 text-sky-400" />
                    ) : (
                      <LockIcon className="h-3.5 w-3.5 text-zinc-500" />
                    )}
                    {hasLiveAccess ? "Live access" : "Private access"}
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-300">
                {descriptionParagraphs.length > 0 ? (
                  descriptionParagraphs.map((paragraph) => (
                    <p key={paragraph} className="[overflow-wrap:anywhere]">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-zinc-500">No description provided.</p>
                )}
              </div>
            </div>

            {(hasResources || techStack.length > 0) && (
              <div className={`grid gap-4 ${hasResources && techStack.length > 0 ? "sm:grid-cols-2" : ""}`}>
                {hasResources && (
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Resources</p>
                        <h3 className="mt-1 text-base font-semibold text-white">Where to explore it</h3>
                      </div>
                      <BoltIcon className="h-5 w-5 text-sky-400" />
                    </div>
                    <LaunchLinkBar launch={launch} />
                  </div>
                )}

                {techStack.length > 0 && (
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Build stack</p>
                        <h3 className="mt-1 text-base font-semibold text-white">Tech used for this launch</h3>
                      </div>
                      <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-400">
                        {techStack.length}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {techStack.map((item) => (
                        <span
                          key={item.id}
                          className="rounded-xl border border-sky-500/15 bg-sky-500/8 px-3 py-1.5 text-xs font-medium text-sky-300 [overflow-wrap:anywhere]"
                        >
                          {item.technology}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </SectionShell>

        {hasConnections && (
          <SectionShell
            id="connections"
            eyebrow="People & workspace"
            title="Who is behind the launch"
            description="See the builder, collaboration context, and linked workspace details in one place."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {launch.trust_context ? <TrustContextCard trust={launch.trust_context} /> : null}

              {launch.builder && (
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Built by</p>
                  <div className="mt-4 flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 text-sm font-bold text-sky-200 ring-1 ring-sky-500/20">
                      {getInitials(launch.builder.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-white [overflow-wrap:anywhere]">{launch.builder.name}</p>
                      {launch.builder.headline ? (
                        <p className="mt-1 text-sm leading-6 text-zinc-400 [overflow-wrap:anywhere]">
                          {launch.builder.headline}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm leading-6 text-zinc-500">Creator profile available on LogoutDev.</p>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/profile/${launch.builder.username ?? launch.builder.id}`}
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-zinc-700 transition-colors hover:bg-zinc-800 hover:text-white"
                  >
                    View profile
                  </Link>
                </div>
              )}

              <LaunchCollaboratorCTA launch={launch} isAuthenticated={Boolean(user)} />

              {launch.linked_space_id && (
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Workspace</p>
                      <h3 className="mt-1 text-base font-semibold text-white">
                        {launch.linked_space?.name ?? "Linked workspace"}
                      </h3>
                    </div>
                    <UsersIcon className="h-5 w-5 text-emerald-400" />
                  </div>

                  {launch.linked_space?.visibility === "public" && launch.linked_space?.id ? (
                    <Link
                      href={`/spaces/${launch.linked_space.id}`}
                      className="mt-4 flex items-start gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/8 p-4 transition-colors hover:bg-sky-500/12"
                    >
                      <RocketIcon className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-sky-300 [overflow-wrap:anywhere]">
                          Open linked space
                        </p>
                        <p className="mt-1 text-xs leading-5 text-zinc-500">
                          Public workspace • {launch.linked_space.status ? humanize(launch.linked_space.status) : "active"}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4">
                      <p className="text-sm leading-6 text-zinc-400">
                        Connected to a private workspace. Collaboration happens inside the linked team space.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </SectionShell>
        )}

        {launch.next_steps?.length || launch.related_entities?.length || launch.builder_posts?.length || launch.recent_updates?.length ? (
          <SectionShell
            id="next-steps"
            eyebrow="Connected flow"
            title="What to do after this page"
            description="Use the strongest next steps, then follow the surrounding product graph."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {launch.next_steps ? <NextStepsPanel items={launch.next_steps} /> : null}
              {launch.related_entities ? <RelatedEntitiesPanel items={launch.related_entities} /> : null}
            </div>

            {launch.linked_space_health || (launch.recent_updates && launch.recent_updates.length > 0) ? (
              <div className="grid gap-4 pt-2 lg:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5">
                  <h3 className="text-base font-semibold text-white">Linked space health</h3>
                  {launch.linked_space_health ? (
                    <div className="mt-3 space-y-2 text-sm text-zinc-400">
                      <p>{launch.linked_space_health.recent_updates} recent updates</p>
                      <p>{launch.linked_space_health.active_contributors} active contributors</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-zinc-500">No linked workspace health available.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5">
                  <h3 className="text-base font-semibold text-white">Recent workspace updates</h3>
                  <div className="mt-3 space-y-3">
                    {(launch.recent_updates || []).slice(0, 3).map((update) => (
                      <div key={update.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
                        <p className="text-sm font-semibold text-white">{update.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">{update.type}</p>
                      </div>
                    ))}
                    {(!launch.recent_updates || launch.recent_updates.length === 0) ? (
                      <p className="text-sm text-zinc-500">No public workspace updates yet.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {launch.builder_posts && launch.builder_posts.length > 0 ? (
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5">
                <h3 className="text-base font-semibold text-white">Builder posts about the product</h3>
                <div className="mt-3 space-y-3">
                  {launch.builder_posts.slice(0, 3).map((post) => (
                    <Link
                      key={post.id}
                      href={`/post/${post.id}`}
                      className="block rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 transition-colors hover:bg-zinc-900"
                    >
                      <p className="line-clamp-3 text-sm leading-6 text-zinc-300">{post.content}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </SectionShell>
        ) : null}

        {screenshotCount > 0 && (
          <SectionShell
            id="screenshots"
            eyebrow="Gallery"
            title="Product walkthrough"
            count={screenshotCount}
            description="Browse the visual walkthrough and get a clearer feel for the product experience."
          >
            <LaunchScreenshotGallery screenshots={launch.screenshots ?? []} />
          </SectionShell>
        )}

        <SectionShell
          id="reviews"
          eyebrow="Community reviews"
          title="What other builders think"
          count={launch.review_count}
          description="See what reviewers liked, what they questioned, and whether they would recommend the launch."
        >
          <LaunchReviewPanel
            reviews={reviews}
            currentUser={launch.viewer_state?.is_owner ? null : user}
            myReviewId={myReviewId}
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
        </SectionShell>

        <SectionShell
          id="feedback"
          eyebrow="Feedback board"
          title="Suggestions, bugs, and ideas"
          count={launch.feedback_count}
          description="Track what the community wants next and follow the discussion around each request."
        >
          <LaunchFeedbackBoard
            launch={launch}
            currentUser={user}
            feedback={feedback}
            activeType={feedbackType}
            onActiveTypeChange={setFeedbackType}
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
        </SectionShell>
      </div>
    </div>
  );
}
