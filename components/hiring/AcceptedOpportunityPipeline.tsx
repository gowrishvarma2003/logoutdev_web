"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import {
  opportunitiesApi,
  type AcceptedOpportunity,
  type OpportunityConversation,
} from "@/lib/services/opportunitiesApi";
import {
  acceptedOpportunityCanAct,
  acceptedOpportunitySelectionId,
  acceptedOpportunitySteps,
  completedOpportunitySteps,
  opportunityStatusLabel,
} from "@/lib/hiring/acceptedOpportunityPresentation";

function itemIdFromPath(pathname: string) {
  return pathname.match(/^\/opportunities\/accepted\/([^/]+)$/)?.[1] || "";
}

export default function AcceptedOpportunityPipeline() {
  const pathname = usePathname();
  const [items, setItems] = useState<AcceptedOpportunity[]>([]);
  const [selected, setSelected] = useState<AcceptedOpportunity | null>(null);
  const [conversation, setConversation] = useState<OpportunityConversation | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [reportCategory, setReportCategory] = useState("misleading_process");
  const [reportNote, setReportNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const openSequence = useRef(0);
  const listSequence = useRef(0);

  const completedSteps = useMemo(() => completedOpportunitySteps(selected?.external_status || "accepted"), [selected?.external_status]);
  const canActOnSelected = selected ? acceptedOpportunityCanAct(selected) : false;
  const canMessageSelected = canActOnSelected && conversation?.status === "active";

  const openItem = useCallback(async (id: string) => {
    const sequence = ++openSequence.current;
    try {
      const detail = await opportunitiesApi.getAcceptedOpportunity(id);
      let nextConversation: OpportunityConversation | null = null;
      if (detail.accepted_opportunity.conversation?.id) {
        const conversationData = await opportunitiesApi.getOpportunityConversation(detail.accepted_opportunity.conversation.id);
        nextConversation = conversationData.conversation;
      }
      if (sequence !== openSequence.current) return;
      setSelected(detail.accepted_opportunity);
      setConversation(nextConversation);
    } catch (failure) {
      if (sequence !== openSequence.current) return;
      setSelected(null);
      setConversation(null);
      throw failure;
    }
  }, []);

  const refresh = useCallback(async (preferredId = "") => {
    const sequence = ++listSequence.current;
    const data = await opportunitiesApi.listAcceptedOpportunities();
    if (sequence !== listSequence.current) return;
    setItems(data.accepted_opportunities);
    setNextCursor(data.page.next_cursor);
    const id = acceptedOpportunitySelectionId(data.accepted_opportunities, preferredId);
    if (id) await openItem(id);
    else {
      openSequence.current += 1;
      setSelected(null);
      setConversation(null);
    }
  }, [openItem]);

  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(() => refresh(itemIdFromPath(pathname)))
      .catch((failure: Error) => active && setError(failure.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
      listSequence.current += 1;
      openSequence.current += 1;
    };
  }, [pathname, refresh]);

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Hiring process action failed.");
    } finally {
      setBusy("");
    }
  }

  function selectItem(id: string) {
    void run("open", () => openItem(id));
  }

  function loadMore() {
    if (!nextCursor) return;
    void run("more", async () => {
      const sequence = ++listSequence.current;
      const data = await opportunitiesApi.listAcceptedOpportunities(nextCursor);
      if (sequence !== listSequence.current) return;
      setItems((current) => [...current, ...data.accepted_opportunities.filter((next) => !current.some((item) => item.id === next.id))]);
      setNextCursor(data.page.next_cursor);
    });
  }

  function withdraw() {
    if (!selected) return;
    void run("withdraw", async () => {
      await opportunitiesApi.withdrawAcceptedOpportunity(selected.id, withdrawNote || undefined);
      setShowWithdraw(false);
      setWithdrawNote("");
      await refresh(selected.id);
      setNotice("You have withdrawn from this hiring process. The conversation is closed.");
    });
  }

  function report(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    void run("report", async () => {
      await opportunitiesApi.reportAcceptedOpportunity(selected.id, { category: reportCategory, note: reportNote || undefined });
      setReportNote("");
      await refresh(selected.id);
      setNotice("Report submitted. This process and conversation are locked for review.");
    });
  }

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!conversation || !canMessageSelected || !message.trim()) return;
    void run("message", async () => {
      await opportunitiesApi.postOpportunityConversationMessage(conversation.id, message);
      const updated = await opportunitiesApi.getOpportunityConversation(conversation.id);
      setConversation(updated.conversation);
      setMessage("");
    });
  }

  if (loading) return <div className="flex min-h-[45vh] items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section className="space-y-4">
        <div>
          <Link className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-primary" href="/opportunities"><ArrowLeftIcon className="h-4 w-4" />Opportunity inbox</Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><h1 className="text-xl font-bold text-text-primary">Accepted opportunities</h1><div className="flex flex-wrap gap-3"><Link className="text-xs font-semibold text-sky-300 hover:text-sky-200" href="/opportunities/interviews">Interviews</Link><Link className="text-xs font-semibold text-sky-300 hover:text-sky-200" href="/opportunities/offers">Offers</Link></div></div>
        </div>
        <Card>
          <CardContent className="space-y-2">
            {!items.length ? <p className="text-sm text-text-muted">Accepted company opportunities will appear here.</p> : items.map((item) => (
              <button className={`grid w-full gap-2 rounded-lg border p-3 text-left transition-colors ${selected?.id === item.id ? "border-sky-500/50 bg-sky-500/10" : "border-border-default bg-surface-muted hover:border-border-strong"}`} key={item.id} onClick={() => selectItem(item.id)} type="button">
                <span className="text-sm font-semibold text-text-primary">{item.company?.display_name || "Verified company"}</span>
                <span className="text-xs text-text-muted">{item.job?.title || "Hiring process"}</span>
                <span className="w-fit rounded-full border border-border-default px-2 py-1 text-xs capitalize text-text-secondary">{opportunityStatusLabel(item.external_status)}</span>
              </button>
            ))}
            {nextCursor ? <Button className="w-full" loading={busy === "more"} onClick={loadMore} variant="outline" type="button">Load more</Button> : null}
          </CardContent>
        </Card>
      </section>

      <section className="min-w-0 space-y-5">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {notice ? <Alert tone="success">{notice}</Alert> : null}
        {!selected ? <Card><CardContent><p className="text-sm text-text-muted">No accepted hiring process is available.</p></CardContent></Card> : <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase text-text-muted">{selected.company?.verified ? "Verified company" : "Company"}</p><h2 className="mt-1 text-lg font-bold text-text-primary">{selected.company?.display_name}</h2><p className="mt-1 text-sm text-text-muted">{selected.job?.title} · {selected.job?.location || selected.job?.workplace_type}</p></div>
                <span className={`rounded-full border px-2.5 py-1 text-xs capitalize ${selected.process_state === "active" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-border-default bg-surface-muted text-text-secondary"}`}>{opportunityStatusLabel(selected.process_state)}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6" aria-label="Hiring process progress">
                {acceptedOpportunitySteps.map((step) => <li className={`min-h-16 rounded-lg border p-2 text-xs capitalize ${completedSteps.has(step) ? "border-sky-500/35 bg-sky-500/10 text-sky-100" : "border-border-default bg-surface-muted text-text-disabled"}`} key={step}>{opportunityStatusLabel(step)}</li>)}
              </ol>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/8 p-4"><p className="text-xs font-medium uppercase text-emerald-200">Next action</p><p className="mt-2 text-sm leading-6 text-text-primary">{selected.next_action || "This hiring process is closed."}</p></div>
                <div className="rounded-lg border border-border-default bg-surface-muted p-4"><p className="text-xs font-medium uppercase text-text-muted">Waiting on</p><p className="mt-2 text-sm capitalize text-text-primary">{selected.waiting_on === "candidate" ? "You" : selected.waiting_on}</p><p className="mt-2 text-xs text-text-disabled">Updated {new Date(selected.last_activity_at).toLocaleString()}</p></div>
              </div>
              {selected.closure_outcome ? <Alert tone={selected.closure_outcome === "hired" ? "success" : selected.closure_outcome === "reported" ? "warning" : "default"}>Outcome: {selected.closure_outcome === "withdrawn_by_candidate" ? "withdrawn by you" : opportunityStatusLabel(selected.closure_outcome)}</Alert> : null}
              <div><h3 className="text-sm font-semibold text-text-primary">Role</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{selected.job?.description}</p></div>
              {selected.job?.skills?.length ? <div className="flex flex-wrap gap-2">{selected.job.skills.map((skill) => <span className="rounded-full border border-border-default bg-surface-muted px-2.5 py-1 text-xs text-text-secondary" key={skill}>{skill}</span>)}</div> : null}
              {canActOnSelected ? <div className="flex flex-wrap gap-2"><Button onClick={() => setShowWithdraw(true)} variant="outline" type="button">Withdraw</Button></div> : null}
              {showWithdraw ? <div className="grid gap-3 rounded-lg border border-amber-500/30 bg-amber-500/8 p-4"><p className="text-sm font-medium text-amber-100">Withdraw from this process?</p><textarea className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" maxLength={600} rows={3} value={withdrawNote} onChange={(event) => setWithdrawNote(event.target.value)} placeholder="Optional note for the company" /><div className="flex gap-2"><Button loading={busy === "withdraw"} onClick={withdraw} variant="danger" type="button">Confirm withdrawal</Button><Button onClick={() => setShowWithdraw(false)} variant="ghost" type="button">Cancel</Button></div></div> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div className="flex items-center gap-2"><ChatBubbleLeftRightIcon className="h-5 w-5 text-text-muted" /><h2 className="text-sm font-semibold text-text-primary">Hiring conversation</h2></div></CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-80 space-y-2 overflow-y-auto">{conversation?.messages?.length ? conversation.messages.map((entry) => <div className="rounded-lg border border-border-default bg-surface-muted p-3 text-sm text-text-secondary" key={entry.id}><strong className="mr-2 text-text-primary">{entry.sender_type === "developer" ? "You" : selected.company?.display_name}</strong>{entry.body}<span className="mt-1 block text-xs text-text-disabled">{new Date(entry.created_at).toLocaleString()}</span></div>) : <p className="text-sm text-text-muted">No messages yet.</p>}</div>
              <form className="flex gap-2" onSubmit={sendMessage}><input className="min-w-0 flex-1 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary disabled:cursor-not-allowed disabled:text-text-disabled" disabled={!canMessageSelected} maxLength={4000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message" /><Button disabled={!canMessageSelected} loading={busy === "message"} type="submit">Send</Button></form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-sm font-semibold text-text-primary">Report this hiring process</h2></CardHeader>
            <CardContent>{selected.process_state === "reported" ? <Alert tone="warning">This process is already locked for trust and safety review.</Alert> : <form className="grid gap-3 md:grid-cols-[200px_1fr_auto]" onSubmit={report}><select className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" value={reportCategory} onChange={(event) => setReportCategory(event.target.value)}><option value="misleading_process">Misleading process</option><option value="discrimination_concern">Discrimination concern</option><option value="harassment">Harassment</option><option value="payment_request">Payment request</option><option value="privacy_concern">Privacy concern</option><option value="off_platform_pressure">Off-platform pressure</option><option value="fake_job">Fake job</option><option value="other">Other</option></select><input className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" maxLength={1200} value={reportNote} onChange={(event) => setReportNote(event.target.value)} placeholder="Optional context" /><Button loading={busy === "report"} variant="outline" type="submit">Report</Button></form>}</CardContent>
          </Card>
        </>}
      </section>
    </main>
  );
}
