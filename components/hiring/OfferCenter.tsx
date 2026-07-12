"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import {
  offerCanRespond,
  offerCompensation,
  offerNeedsOutcomeConfirmation,
  offerSelectionId,
  offerStatusLabel,
} from "@/lib/hiring/offerPresentation";
import {
  opportunitiesApi,
  type HiringOffer,
  type HiringOfferEvent,
} from "@/lib/services/opportunitiesApi";

function offerIdFromPath(pathname: string) {
  return pathname.match(/^\/opportunities\/offers\/([^/]+)$/)?.[1] || "";
}

function statusTone(status: HiringOffer["status"]) {
  if (status === "accepted") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (status === "reported") return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  if (["declined", "withdrawn", "expired"].includes(status)) return "border-border-default bg-surface-muted text-text-muted";
  return "border-sky-500/30 bg-sky-500/10 text-sky-100";
}

export default function OfferCenter() {
  const pathname = usePathname();
  const [offers, setOffers] = useState<HiringOffer[]>([]);
  const [selected, setSelected] = useState<HiringOffer | null>(null);
  const [events, setEvents] = useState<HiringOfferEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [reviewedTerms, setReviewedTerms] = useState(false);
  const [setNotLooking, setSetNotLooking] = useState(false);
  const [declineReason, setDeclineReason] = useState("role_mismatch");
  const [declineNote, setDeclineNote] = useState("");
  const [shareDecline, setShareDecline] = useState(false);
  const [reportCategory, setReportCategory] = useState("payment_request");
  const [reportNote, setReportNote] = useState("");
  const [publicProofAllowed, setPublicProofAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const openSequence = useRef(0);
  const listSequence = useRef(0);

  const openOffer = useCallback(async (id: string) => {
    const sequence = ++openSequence.current;
    const initial = await opportunitiesApi.getOffer(id);
    const detail = initial.offer.status === "sent" ? await opportunitiesApi.viewOffer(id) : initial;
    if (sequence !== openSequence.current) return;
    setSelected(detail.offer);
    setEvents(detail.events);
    setReviewedTerms(false);
    setSetNotLooking(false);
    setPublicProofAllowed(detail.offer.outcome_confirmation?.public_proof_allowed === true);
  }, []);

  const refresh = useCallback(async (preferredId = "") => {
    const sequence = ++listSequence.current;
    const data = await opportunitiesApi.listOffers(statusFilter || undefined);
    if (sequence !== listSequence.current) return;
    setOffers(data.offers);
    setNextCursor(data.page.next_cursor);
    const id = offerSelectionId(data.offers, preferredId || offerIdFromPath(pathname));
    if (id) await openOffer(id);
    else {
      openSequence.current += 1;
      setSelected(null);
      setEvents([]);
    }
  }, [openOffer, pathname, statusFilter]);

  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(() => refresh())
      .catch((failure: Error) => active && setError(failure.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
      listSequence.current += 1;
      openSequence.current += 1;
    };
  }, [refresh]);

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Offer action failed.");
    } finally {
      setBusy("");
    }
  }

  function selectOffer(id: string) {
    void run("open", () => openOffer(id));
  }

  function loadMoreOffers() {
    if (!nextCursor) return;
    void run("more", async () => {
      const data = await opportunitiesApi.listOffers(statusFilter || undefined, nextCursor);
      setOffers((current) => [...current, ...data.offers.filter((offer) => !current.some((existing) => existing.id === offer.id))]);
      setNextCursor(data.page.next_cursor);
    });
  }

  function acceptOffer(event: FormEvent) {
    event.preventDefault();
    if (!selected || !reviewedTerms) return;
    void run("accept", async () => {
      await opportunitiesApi.acceptOffer(selected.id, setNotLooking);
      await refresh(selected.id);
      setNotice("Offer accepted. The company will record the final hiring outcome separately.");
    });
  }

  function declineOffer(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    void run("decline", async () => {
      await opportunitiesApi.declineOffer(selected.id, {
        reason: declineReason,
        note: declineNote || undefined,
        share_reason: shareDecline,
      });
      setDeclineNote("");
      setShareDecline(false);
      await refresh(selected.id);
      setNotice(shareDecline ? "Offer declined and your selected reason was shared." : "Offer declined. Your reason remains private.");
    });
  }

  function reportOffer(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    void run("report", async () => {
      await opportunitiesApi.reportOffer(selected.id, { category: reportCategory, note: reportNote || undefined });
      setReportNote("");
      await refresh(selected.id);
      setNotice("Offer reported. Related hiring actions are restricted while LogoutDev reviews it.");
    });
  }

  function confirmOutcome(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    void run("outcome", async () => {
      await opportunitiesApi.confirmOfferOutcome(selected.id, publicProofAllowed);
      await refresh(selected.id);
      setNotice("Your hiring outcome confirmation was recorded.");
    });
  }

  function openDocument(documentId: string) {
    if (!selected) return;
    void run(`document:${documentId}`, async () => {
      const data = await opportunitiesApi.getOfferDocumentUrl(selected.id, documentId);
      window.location.assign(data.url);
    });
  }

  if (loading) return <div className="flex min-h-[45vh] items-center justify-center"><Spinner size="lg" /></div>;

  const canRespond = selected ? offerCanRespond(selected) : false;
  const needsOutcomeConfirmation = selected ? offerNeedsOutcomeConfirmation(selected) : false;

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section className="space-y-4">
        <div>
          <Link className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-primary" href="/opportunities/accepted"><ArrowLeftIcon className="h-4 w-4" />Accepted opportunities</Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-text-primary">Offers</h1>
            <select aria-label="Filter offers by status" className="rounded-lg border border-border-default bg-surface px-2 py-1.5 text-xs capitalize text-text-secondary" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              {["sent", "viewed", "accepted", "declined", "withdrawn", "expired", "reported"].map((status) => <option key={status} value={status}>{offerStatusLabel(status)}</option>)}
            </select>
          </div>
        </div>
        <Card>
          <CardContent className="space-y-2">
            {!offers.length ? <p className="text-sm text-text-muted">Platform-tracked offers will appear here.</p> : offers.map((offer) => (
              <button className={`grid w-full gap-2 rounded-lg border p-3 text-left transition-colors ${selected?.id === offer.id ? "border-sky-500/50 bg-sky-500/10" : "border-border-default bg-surface-muted hover:border-border-strong"}`} key={offer.id} onClick={() => selectOffer(offer.id)} type="button">
                <span className="text-sm font-semibold text-text-primary">{offer.company?.display_name || "Verified company"}</span>
                <span className="text-xs text-text-muted">{offer.title}</span>
                <span className={`w-fit rounded-full border px-2 py-1 text-xs capitalize ${statusTone(offer.status)}`}>{offerStatusLabel(offer.status)}</span>
                <span className="text-xs text-text-disabled">Updated {new Date(offer.last_activity_at).toLocaleString()}</span>
              </button>
            ))}
            {nextCursor ? <Button className="w-full" loading={busy === "more"} onClick={loadMoreOffers} variant="outline" type="button">Load more</Button> : null}
          </CardContent>
        </Card>
      </section>

      <section className="min-w-0 space-y-5">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {notice ? <Alert tone="success">{notice}</Alert> : null}
        {!selected ? <Card><CardContent><p className="text-sm text-text-muted">No offer selected.</p></CardContent></Card> : <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-text-muted">{selected.company?.verified ? "Verified company" : "Company"}</p>
                  <h2 className="mt-1 text-lg font-bold text-text-primary">{selected.title}</h2>
                  <p className="mt-1 text-sm text-text-muted">{selected.company?.display_name} · {offerStatusLabel(selected.employment_type)} · {offerStatusLabel(selected.workplace_type)}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs capitalize ${statusTone(selected.status)}`}>{offerStatusLabel(selected.status)}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {selected.reported_at ? <Alert tone="warning">This offer is under review. Offer and hiring-process actions are restricted.</Alert> : null}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/8 p-4"><p className="text-xs font-medium uppercase text-emerald-200">Compensation</p><p className="mt-2 break-words text-sm font-semibold text-text-primary">{offerCompensation(selected)}</p></div>
                <div className="rounded-lg border border-border-default bg-surface-muted p-4"><p className="text-xs font-medium uppercase text-text-muted">Start</p><p className="mt-2 text-sm text-text-primary">{selected.start_date || selected.start_date_note}</p></div>
                <div className="rounded-lg border border-border-default bg-surface-muted p-4"><p className="text-xs font-medium uppercase text-text-muted">Location</p><p className="mt-2 break-words text-sm text-text-primary">{selected.location || offerStatusLabel(selected.workplace_type)}</p></div>
                <div className="rounded-lg border border-border-default bg-surface-muted p-4"><p className="text-xs font-medium uppercase text-text-muted">Expires</p><p className="mt-2 text-sm text-text-primary">{new Date(selected.expires_at).toLocaleString()}</p></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div><h3 className="text-sm font-semibold text-text-primary">Schedule</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{selected.schedule_expectation}</p></div>
                <div><h3 className="text-sm font-semibold text-text-primary">Reporting manager or team</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{selected.reporting_manager}</p></div>
                <div><h3 className="text-sm font-semibold text-text-primary">Benefits</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{selected.benefits_summary}</p></div>
                {selected.conditions ? <div><h3 className="text-sm font-semibold text-text-primary">Conditions</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{selected.conditions}</p></div> : null}
                {selected.equity_summary ? <div><h3 className="text-sm font-semibold text-text-primary">Equity</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{selected.equity_summary}</p></div> : null}
                {selected.signing_bonus ? <div><h3 className="text-sm font-semibold text-text-primary">Signing bonus</h3><p className="mt-2 text-sm text-text-secondary">{selected.compensation_currency} {selected.signing_bonus}</p></div> : null}
                {selected.relocation_support ? <div><h3 className="text-sm font-semibold text-text-primary">Relocation</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{selected.relocation_support}</p></div> : null}
                {selected.equipment_note ? <div><h3 className="text-sm font-semibold text-text-primary">Equipment</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{selected.equipment_note}</p></div> : null}
                {selected.work_authorization_note ? <div><h3 className="text-sm font-semibold text-text-primary">Work authorization</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{selected.work_authorization_note}</p></div> : null}
              </div>
              <div><h3 className="text-sm font-semibold text-text-primary">Company contact</h3><p className="mt-2 text-sm text-text-secondary">{selected.contact_name}{selected.contact_title ? ` · ${selected.contact_title}` : ""} · <a className="text-sky-300 hover:text-sky-200" href={`mailto:${selected.contact_email}`}>{selected.contact_email}</a></p></div>
              {selected.company?.website_url ? <a className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-300 hover:text-sky-200" href={selected.company.website_url} rel="noreferrer" target="_blank">Company website<ArrowTopRightOnSquareIcon className="h-4 w-4" /></a> : null}
            </CardContent>
          </Card>

          {selected.documents.length ? <Card><CardHeader><div className="flex items-center gap-2"><DocumentTextIcon className="h-5 w-5 text-text-muted" /><h2 className="text-sm font-semibold text-text-primary">Private offer documents</h2></div></CardHeader><CardContent className="grid gap-2">{selected.documents.map((document) => <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-default bg-surface-muted p-3" key={document.id}><div className="min-w-0"><strong className="block truncate text-sm text-text-primary">{document.display_filename}</strong><span className="text-xs text-text-muted">PDF · {Math.ceil(document.file_size / 1024)} KB · {offerStatusLabel(document.scan_status)}</span></div><Button loading={busy === `document:${document.id}`} onClick={() => openDocument(document.id)} size="sm" variant="outline" type="button"><ArrowTopRightOnSquareIcon className="h-4 w-4" />Open</Button></div>)}</CardContent></Card> : null}

          {canRespond ? <Card>
            <CardHeader><div className="flex items-center gap-2"><BriefcaseIcon className="h-5 w-5 text-text-muted" /><h2 className="text-sm font-semibold text-text-primary">Respond to offer</h2></div></CardHeader>
            <CardContent className="grid gap-6 xl:grid-cols-2">
              <form className="grid content-start gap-3" onSubmit={acceptOffer}>
                <Alert tone="info">Acceptance records your decision on this LogoutDev summary. It is not an employment contract or onboarding completion.</Alert>
                <label className="flex items-start gap-3 rounded-lg border border-border-default bg-surface-muted p-3 text-sm text-text-secondary"><input className="mt-1 h-4 w-4 shrink-0" checked={reviewedTerms} onChange={(event) => setReviewedTerms(event.target.checked)} type="checkbox" required /><span>I reviewed the structured terms and attached documents.</span></label>
                <label className="flex items-start gap-3 rounded-lg border border-border-default bg-surface-muted p-3 text-sm text-text-secondary"><input className="mt-1 h-4 w-4 shrink-0" checked={setNotLooking} onChange={(event) => setSetNotLooking(event.target.checked)} type="checkbox" /><span>Set my opportunity status to not looking after acceptance.</span></label>
                <Button disabled={!reviewedTerms} loading={busy === "accept"} variant="success" type="submit">Accept offer</Button>
              </form>
              <form className="grid content-start gap-3" onSubmit={declineOffer}>
                <label className="grid gap-1.5 text-sm text-text-secondary">Reason<select className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" value={declineReason} onChange={(event) => setDeclineReason(event.target.value)}>{["compensation", "role_mismatch", "timing", "location_or_work_type", "accepted_another_offer", "company_or_process_concern", "prefer_not_to_say", "other"].map((reason) => <option key={reason} value={reason}>{offerStatusLabel(reason)}</option>)}</select></label>
                <label className="grid gap-1.5 text-sm text-text-secondary">Note<textarea className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" maxLength={600} rows={3} value={declineNote} onChange={(event) => setDeclineNote(event.target.value)} /></label>
                <label className="flex items-start gap-3 rounded-lg border border-border-default bg-surface-muted p-3 text-sm text-text-secondary"><input className="mt-1 h-4 w-4 shrink-0" checked={shareDecline} onChange={(event) => setShareDecline(event.target.checked)} type="checkbox" /><span>Share my selected reason and note with the company. Otherwise they remain private.</span></label>
                <Button loading={busy === "decline"} variant="outline" type="submit">Decline offer</Button>
              </form>
            </CardContent>
          </Card> : null}

          {needsOutcomeConfirmation ? <Card>
            <CardHeader><h2 className="text-sm font-semibold text-text-primary">Confirm hiring outcome</h2></CardHeader>
            <CardContent><form className="grid gap-3" onSubmit={confirmOutcome}><Alert tone="success">The company recorded a hired outcome. Confirm only if you joined under this accepted offer.</Alert><label className="flex items-start gap-3 rounded-lg border border-border-default bg-surface-muted p-3 text-sm text-text-secondary"><input className="mt-1 h-4 w-4 shrink-0" checked={publicProofAllowed} onChange={(event) => setPublicProofAllowed(event.target.checked)} type="checkbox" /><span>Allow LogoutDev to show this confirmed outcome as public proof on my profile.</span></label><Button loading={busy === "outcome"} type="submit">Confirm hired outcome</Button></form></CardContent>
          </Card> : null}

          {selected.outcome_confirmation?.developer_confirmed_hired_at ? <Alert tone="success" title="Hired outcome confirmed">Public proof is {selected.outcome_confirmation.public_proof_allowed ? "allowed" : "private"}.</Alert> : null}

          <Card>
            <CardHeader><div className="flex items-center gap-2"><ShieldExclamationIcon className="h-5 w-5 text-text-muted" /><h2 className="text-sm font-semibold text-text-primary">Report offer issue</h2></div></CardHeader>
            <CardContent>{selected.reported_at ? <Alert tone="warning">This offer has already been reported for review.</Alert> : <form className="grid gap-3 md:grid-cols-[240px_1fr_auto]" onSubmit={reportOffer}><select aria-label="Offer report category" className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" value={reportCategory} onChange={(event) => setReportCategory(event.target.value)}>{["payment_request", "bank_tax_or_identity_request", "suspicious_link", "role_changed", "harassment", "discrimination_concern", "off_platform_pressure", "misleading_compensation", "other"].map((category) => <option key={category} value={category}>{offerStatusLabel(category)}</option>)}</select><input aria-label="Offer report context" className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" maxLength={1200} value={reportNote} onChange={(event) => setReportNote(event.target.value)} placeholder="Optional context" /><Button loading={busy === "report"} variant="outline" type="submit">Report</Button></form>}</CardContent>
          </Card>

          <Card><CardHeader><h2 className="text-sm font-semibold text-text-primary">History</h2></CardHeader><CardContent className="space-y-3">{events.length ? events.map((event) => <article className="rounded-lg border border-border-default bg-surface-muted p-3 text-sm text-text-secondary" key={event.id}><strong className="block capitalize text-text-primary">{offerStatusLabel(event.event_type)}</strong><span>{new Date(event.created_at).toLocaleString()}</span></article>) : <p className="text-sm text-text-muted">No offer history yet.</p>}</CardContent></Card>
        </>}
      </section>
    </main>
  );
}
