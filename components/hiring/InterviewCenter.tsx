"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { opportunitiesApi, type HiringInterview } from "@/lib/services/opportunitiesApi";

function label(value: string) {
  return value.replaceAll("_", " ");
}

function interviewIdFromPath(pathname: string) {
  return pathname.match(/^\/opportunities\/interviews\/([^/]+)$/)?.[1] || "";
}

function canSelectSlot(interview: HiringInterview | null) {
  return Boolean(interview && ["requested", "reschedule_requested"].includes(interview.status) && new Date(interview.expires_at).getTime() > Date.now());
}

function canRequestAlternative(interview: HiringInterview | null) {
  return Boolean(interview && ["requested", "confirmed"].includes(interview.status));
}

function canCancel(interview: HiringInterview | null) {
  return Boolean(interview && !["cancelled_by_company", "cancelled_by_candidate", "completed", "no_show_company", "no_show_candidate", "expired"].includes(interview.status));
}

export default function InterviewCenter() {
  const pathname = usePathname();
  const [interviews, setInterviews] = useState<HiringInterview[]>([]);
  const [selected, setSelected] = useState<HiringInterview | null>(null);
  const [events, setEvents] = useState<Array<{ id: string; event_type: string; metadata: Record<string, unknown>; created_at: string }>>([]);
  const [slotId, setSlotId] = useState("");
  const [alternativeNote, setAlternativeNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [noShowReason, setNoShowReason] = useState("");
  const [reportCategory, setReportCategory] = useState("suspicious_link");
  const [reportNote, setReportNote] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const proposedSlots = useMemo(() => selected?.slots.filter((slot) => slot.status === "proposed") || [], [selected?.slots]);

  const openInterview = useCallback(async (id: string) => {
    const detail = await opportunitiesApi.getInterview(id);
    setSelected(detail.interview);
    setEvents(detail.events);
    setSlotId(detail.interview.confirmed_slot_id || detail.interview.slots.find((slot) => slot.status === "proposed")?.id || "");
  }, []);

  const refreshList = useCallback(async (preferredId = "") => {
    const data = await opportunitiesApi.listInterviews();
    setInterviews(data.interviews);
    const nextId = preferredId || interviewIdFromPath(pathname) || data.interviews[0]?.id || "";
    if (nextId) await openInterview(nextId);
    else {
      setSelected(null);
      setEvents([]);
    }
  }, [openInterview, pathname]);

  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(() => refreshList())
      .catch((failure: Error) => active && setError(failure.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [refreshList]);

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Interview action failed.");
    } finally {
      setBusy("");
    }
  }

  function selectInterview(id: string) {
    void run("open", () => openInterview(id));
  }

  function selectSlot(event: FormEvent) {
    event.preventDefault();
    if (!selected || !slotId) return;
    void run("slot", async () => {
      const detail = await opportunitiesApi.selectInterviewSlot(selected.id, slotId);
      setSelected(detail.interview);
      setEvents(detail.events);
      await refreshList(detail.interview.id);
      setNotice("Interview time confirmed.");
    });
  }

  function requestAlternatives(event: FormEvent) {
    event.preventDefault();
    if (!selected || !alternativeNote.trim()) return;
    void run("alternatives", async () => {
      const detail = await opportunitiesApi.requestInterviewAlternatives(selected.id, alternativeNote);
      setSelected(detail.interview);
      setEvents(detail.events);
      setAlternativeNote("");
      await refreshList(detail.interview.id);
      setNotice("Alternative times requested.");
    });
  }

  function cancelInterview(event: FormEvent) {
    event.preventDefault();
    if (!selected || !cancelReason.trim()) return;
    void run("cancel", async () => {
      const detail = await opportunitiesApi.cancelInterview(selected.id, cancelReason);
      setSelected(detail.interview);
      setEvents(detail.events);
      setCancelReason("");
      await refreshList(detail.interview.id);
      setNotice("Interview cancelled.");
    });
  }

  function reportInterview(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    void run("report", async () => {
      const detail = await opportunitiesApi.reportInterview(selected.id, { category: reportCategory, note: reportNote || undefined });
      setSelected(detail.interview);
      setEvents(detail.events);
      setReportNote("");
      await refreshList(detail.interview.id);
      setNotice("Interview report submitted for review.");
    });
  }

  function markCompanyNoShow(event: FormEvent) {
    event.preventDefault();
    if (!selected || !noShowReason.trim()) return;
    void run("no-show", async () => {
      const detail = await opportunitiesApi.markInterviewCompanyNoShow(selected.id, noShowReason);
      setSelected(detail.interview);
      setEvents(detail.events);
      setNoShowReason("");
      await refreshList(detail.interview.id);
      setNotice("Company no-show recorded in the interview history.");
    });
  }

  if (loading) return <div className="flex min-h-[45vh] items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section className="space-y-4">
        <div>
          <Link className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-primary" href="/opportunities/accepted"><ArrowLeftIcon className="h-4 w-4" />Accepted opportunities</Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><h1 className="text-xl font-bold text-text-primary">Interviews</h1><Link className="text-xs font-semibold text-sky-300 hover:text-sky-200" href="/opportunities/offers">Offers</Link></div>
        </div>
        <Card>
          <CardContent className="space-y-2">
            {!interviews.length ? <p className="text-sm text-text-muted">Interview requests will appear here after a company schedules from an accepted opportunity.</p> : interviews.map((interview) => (
              <button className={`grid w-full gap-2 rounded-lg border p-3 text-left transition-colors ${selected?.id === interview.id ? "border-sky-500/50 bg-sky-500/10" : "border-border-default bg-surface-muted hover:border-border-strong"}`} key={interview.id} onClick={() => selectInterview(interview.id)} type="button">
                <span className="text-sm font-semibold text-text-primary">{interview.company?.display_name || "Verified company"}</span>
                <span className="text-xs text-text-muted">{interview.title}</span>
                <span className="w-fit rounded-full border border-border-default px-2 py-1 text-xs capitalize text-text-secondary">{label(interview.status)}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="min-w-0 space-y-5">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {notice ? <Alert tone="success">{notice}</Alert> : null}
        {!selected ? <Card><CardContent><p className="text-sm text-text-muted">No interview selected.</p></CardContent></Card> : <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase text-text-muted">{selected.company?.display_name || "Company"}</p><h2 className="mt-1 text-lg font-bold text-text-primary">{selected.title}</h2><p className="mt-1 text-sm text-text-muted">{selected.job?.title} · {label(selected.interview_type)} · {selected.duration_minutes} minutes</p></div>
                <span className={`rounded-full border px-2.5 py-1 text-xs capitalize ${selected.status === "confirmed" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-border-default bg-surface-muted text-text-secondary"}`}>{label(selected.status)}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-sky-500/25 bg-sky-500/8 p-4"><p className="text-xs font-medium uppercase text-sky-100">Confirmed time</p><p className="mt-2 text-sm text-text-primary">{selected.confirmed_start_at ? new Date(selected.confirmed_start_at).toLocaleString() : "Not scheduled yet"}</p></div>
                <div className="rounded-lg border border-border-default bg-surface-muted p-4"><p className="text-xs font-medium uppercase text-text-muted">Request expires</p><p className="mt-2 text-sm text-text-primary">{new Date(selected.expires_at).toLocaleString()}</p></div>
              </div>
              {selected.meeting_url ? <Alert tone="success"><a className="font-medium underline underline-offset-2" href={selected.meeting_url} rel="noreferrer" target="_blank">Open meeting link</a></Alert> : selected.location ? <Alert tone="success">{selected.location}</Alert> : <Alert tone="default">Meeting details will be shown after confirmation.</Alert>}
              {selected.preparation_notes ? <div><h3 className="text-sm font-semibold text-text-primary">Preparation</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{selected.preparation_notes}</p></div> : null}
              <div><h3 className="text-sm font-semibold text-text-primary">Participants</h3><div className="mt-2 grid gap-2 sm:grid-cols-2">{selected.participants.map((participant) => <div className="rounded-lg border border-border-default bg-surface-muted p-3 text-sm text-text-secondary" key={participant.id}><strong className="block text-text-primary">{participant.display_name}</strong>{label(participant.role)}</div>)}</div></div>
            </CardContent>
          </Card>

          {canSelectSlot(selected) ? <Card><CardHeader><div className="flex items-center gap-2"><CalendarDaysIcon className="h-5 w-5 text-text-muted" /><h2 className="text-sm font-semibold text-text-primary">Choose a time</h2></div></CardHeader><CardContent><form className="grid gap-3" onSubmit={selectSlot}>{proposedSlots.map((slot) => <label className="flex items-start gap-3 rounded-lg border border-border-default bg-surface-muted p-3 text-sm text-text-secondary" key={slot.id}><input className="mt-1 h-4 w-4 shrink-0" checked={slotId === slot.id} onChange={() => setSlotId(slot.id)} type="radio" /> <span><strong className="block text-text-primary">{new Date(slot.start_at).toLocaleString()}</strong>{slot.timezone}</span></label>)}<Button disabled={!slotId} loading={busy === "slot"} type="submit">Confirm selected time</Button></form></CardContent></Card> : null}

          {canRequestAlternative(selected) ? <Card><CardHeader><h2 className="text-sm font-semibold text-text-primary">Request alternatives</h2></CardHeader><CardContent><form className="grid gap-3" onSubmit={requestAlternatives}><textarea className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" maxLength={600} rows={3} value={alternativeNote} onChange={(event) => setAlternativeNote(event.target.value)} placeholder="Share when you are available" /><Button disabled={!alternativeNote.trim()} loading={busy === "alternatives"} variant="outline" type="submit">Request new times</Button></form></CardContent></Card> : null}

          {canCancel(selected) ? <Card><CardHeader><h2 className="text-sm font-semibold text-text-primary">Cancel interview</h2></CardHeader><CardContent><form className="grid gap-3" onSubmit={cancelInterview}><textarea className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" maxLength={600} rows={3} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Reason for cancellation" /><Button disabled={!cancelReason.trim()} loading={busy === "cancel"} variant="danger" type="submit">Cancel interview</Button></form></CardContent></Card> : null}

          {selected.status === "confirmed" && selected.confirmed_end_at && new Date(selected.confirmed_end_at).getTime() + 15 * 60 * 1000 <= Date.now() ? <Card><CardHeader><h2 className="text-sm font-semibold text-text-primary">Company did not attend</h2></CardHeader><CardContent><form className="grid gap-3" onSubmit={markCompanyNoShow}><textarea className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" maxLength={600} rows={3} value={noShowReason} onChange={(event) => setNoShowReason(event.target.value)} placeholder="Share what happened" /><Button disabled={!noShowReason.trim()} loading={busy === "no-show"} variant="outline" type="submit">Record company no-show</Button></form></CardContent></Card> : null}

          <Card>
            <CardHeader><h2 className="text-sm font-semibold text-text-primary">Report interview issue</h2></CardHeader>
            <CardContent>{selected.reported_at ? <Alert tone="warning">This interview has already been reported for review.</Alert> : <form className="grid gap-3 md:grid-cols-[220px_1fr_auto]" onSubmit={reportInterview}><select className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" value={reportCategory} onChange={(event) => setReportCategory(event.target.value)}><option value="suspicious_link">Suspicious link</option><option value="harassment">Harassment</option><option value="discrimination_concern">Discrimination concern</option><option value="off_platform_pressure">Off-platform pressure</option><option value="misleading_process">Misleading process</option><option value="privacy_concern">Privacy concern</option><option value="no_show">No show</option><option value="other">Other</option></select><input className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" maxLength={1200} value={reportNote} onChange={(event) => setReportNote(event.target.value)} placeholder="Optional context" /><Button loading={busy === "report"} variant="outline" type="submit">Report</Button></form>}</CardContent>
          </Card>

          <Card><CardHeader><h2 className="text-sm font-semibold text-text-primary">History</h2></CardHeader><CardContent className="space-y-3">{events.length ? events.map((event) => <article className="rounded-lg border border-border-default bg-surface-muted p-3 text-sm text-text-secondary" key={event.id}><strong className="block text-text-primary">{label(event.event_type)}</strong><span>{new Date(event.created_at).toLocaleString()}</span></article>) : <p className="text-sm text-text-muted">No interview history yet.</p>}</CardContent></Card>
        </>}
      </section>
    </main>
  );
}
