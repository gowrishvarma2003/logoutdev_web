"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import {
  opportunitiesApi,
  type OpportunityConversation,
  type OpportunityRequestDetail,
} from "@/lib/services/opportunitiesApi";

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function opportunityIdFromPath(pathname: string) {
  const match = pathname.match(/^\/opportunities\/([^/]+)$/);
  return match?.[1] === "accepted" ? "" : match?.[1] || "";
}

export default function OpportunityInbox() {
  const pathname = usePathname();
  const pathRequestId = opportunityIdFromPath(pathname);
  const [requests, setRequests] = useState<OpportunityRequestDetail[]>([]);
  const [selected, setSelected] = useState<OpportunityRequestDetail | null>(null);
  const [conversation, setConversation] = useState<OpportunityConversation | null>(null);
  const [message, setMessage] = useState("");
  const [reportCategory, setReportCategory] = useState("scam");
  const [reportNote, setReportNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const canRespond = selected && ["sent", "viewed"].includes(selected.request.status);
  const canConversation = selected?.conversation?.status === "active";

  const refresh = useCallback(async (preferredId: string) => {
    const data = await opportunitiesApi.listReceivedOpportunities();
    setRequests(data.opportunity_requests);
    const next = data.opportunity_requests.find((item) => item.request.id === preferredId) || data.opportunity_requests[0] || null;
    setSelected(next);
    if (next?.request.status === "sent") {
      const viewed = await opportunitiesApi.viewReceivedOpportunity(next.request.id);
      setSelected(viewed);
      setRequests((current) => current.map((item) => item.request.id === viewed.request.id ? viewed : item));
    }
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    refresh(pathRequestId).catch((err: Error) => active && setError(err.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [pathRequestId, refresh]);

  useEffect(() => {
    if (!selected?.conversation?.id) {
      setConversation(null);
      return;
    }
    let active = true;
    opportunitiesApi.getOpportunityConversation(selected.conversation.id)
      .then((data) => active && setConversation(data.conversation))
      .catch((err: Error) => active && setError(err.message));
    return () => { active = false; };
  }, [selected?.conversation?.id]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opportunity action failed.");
    } finally {
      setBusy(false);
    }
  }

  function openRequest(item: OpportunityRequestDetail) {
    void run(async () => {
      const detail = item.request.status === "sent"
        ? await opportunitiesApi.viewReceivedOpportunity(item.request.id)
        : await opportunitiesApi.getReceivedOpportunity(item.request.id);
      setSelected(detail);
      setRequests((current) => current.map((existing) => existing.request.id === detail.request.id ? detail : existing));
    });
  }

  function decide(action: "accept" | "decline" | "block") {
    if (!selected) return;
    void run(async () => {
      const id = selected.request.id;
      if (action === "accept") await opportunitiesApi.acceptReceivedOpportunity(id);
      if (action === "decline") await opportunitiesApi.declineReceivedOpportunity(id);
      if (action === "block") await opportunitiesApi.blockOpportunityCompany(id);
      await refresh(id);
      setNotice(action === "accept" ? "Opportunity accepted. The company can now use the dedicated conversation." : action === "block" ? "Company blocked from future opportunity requests." : "Opportunity declined.");
    });
  }

  function submitReport(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    void run(async () => {
      await opportunitiesApi.reportReceivedOpportunity(selected.request.id, { category: reportCategory, note: reportNote || undefined });
      setReportNote("");
      await refresh(selected.request.id);
      setNotice("Report submitted. This request is now locked while it is reviewed.");
    });
  }

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!conversation || !message.trim()) return;
    void run(async () => {
      await opportunitiesApi.postOpportunityConversationMessage(conversation.id, message);
      const updated = await opportunitiesApi.getOpportunityConversation(conversation.id);
      setConversation(updated.conversation);
      setMessage("");
    });
  }

  const tabs = useMemo(() => ["sent", "accepted", "declined", "expired", "reported", "blocked"], []);

  if (loading) return <div className="flex min-h-[45vh] items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <main className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Hiring</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2"><h1 className="text-xl font-bold text-text-primary">Opportunity Inbox</h1><div className="flex flex-wrap gap-3"><Link className="text-xs font-semibold text-sky-300 hover:text-sky-200" href="/opportunities/accepted">Accepted processes</Link><Link className="text-xs font-semibold text-sky-300 hover:text-sky-200" href="/opportunities/interviews">Interviews</Link><Link className="text-xs font-semibold text-sky-300 hover:text-sky-200" href="/opportunities/offers">Offers</Link></div></div>
          <p className="mt-1 text-sm text-text-muted">Companies can request your attention. You decide what unlocks.</p>
        </div>
        {tabs.map((status) => {
          const items = requests.filter((item) => item.request.status === status || (status === "sent" && item.request.status === "viewed"));
          if (!items.length) return null;
          return <Card key={status}><CardHeader><h2 className="text-sm font-semibold capitalize text-text-primary">{statusLabel(status)}</h2></CardHeader><CardContent className="space-y-2">{items.map((item) => <button className={`w-full rounded-lg border p-3 text-left transition-colors ${selected?.request.id === item.request.id ? "border-sky-500/50 bg-sky-500/10" : "border-border-default bg-surface-muted hover:border-border-strong"}`} key={item.request.id} onClick={() => openRequest(item)} type="button"><strong className="block text-sm text-text-primary">{item.company?.display_name || "Verified company"}</strong><span className="mt-1 block text-xs text-text-muted">{item.job?.title} · {item.request.subject}</span></button>)}</CardContent></Card>;
        })}
        {!requests.length ? <Card><CardContent><p className="text-sm text-text-muted">New verified company opportunities will appear here.</p></CardContent></Card> : null}
      </section>

      <section className="space-y-5">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {notice ? <Alert tone="success">{notice}</Alert> : null}
        {!selected ? <Card><CardContent><p className="text-sm text-text-muted">Select an opportunity to review its company, job, match context, and data-access terms.</p></CardContent></Card> : <>
          <Card>
            <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{selected.company?.verified ? "Verified company" : "Company"}</p><h2 className="mt-1 text-lg font-bold text-text-primary">{selected.company?.display_name}</h2><p className="mt-1 text-sm text-text-muted">{selected.job?.title} · {selected.request.workplace_summary}</p></div><span className="rounded-full border border-border-default bg-surface-muted px-2.5 py-1 text-xs capitalize text-text-secondary">{statusLabel(selected.request.status)}</span></div></CardHeader>
            <CardContent className="space-y-5">
              <div><h3 className="text-sm font-semibold text-text-primary">{selected.request.subject}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{selected.request.message_body}</p></div>
              <div className="grid gap-3 md:grid-cols-2"><div className="rounded-lg border border-border-default bg-surface-muted p-3"><p className="text-xs font-medium text-text-muted">Why you</p><p className="mt-1 text-sm text-text-secondary">{selected.request.personalization_evidence}</p></div><div className="rounded-lg border border-border-default bg-surface-muted p-3"><p className="text-xs font-medium text-text-muted">Compensation</p><p className="mt-1 text-sm text-text-secondary">{selected.request.compensation_summary}</p></div></div>
              <p className="text-xs text-text-disabled">Before acceptance, this company cannot access your email, phone number, resume download, or a conversation channel.</p>
              {canRespond ? <div className="flex flex-wrap gap-2"><Button loading={busy} onClick={() => decide("accept")} type="button">Accept</Button><Button loading={busy} variant="outline" onClick={() => decide("decline")} type="button">Decline</Button><Button loading={busy} variant="danger" onClick={() => decide("block")} type="button">Block company</Button></div> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-sm font-semibold text-text-primary">Safety report</h2></CardHeader>
            <CardContent><form className="grid gap-3 md:grid-cols-[180px_1fr_auto]" onSubmit={submitReport}><select className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" value={reportCategory} onChange={(event) => setReportCategory(event.target.value)}><option value="scam">Scam</option><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="suspicious_link">Suspicious link</option><option value="payment_request">Payment request</option><option value="off_platform_pressure">Off-platform pressure</option><option value="other">Other</option></select><input className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" value={reportNote} maxLength={1200} onChange={(event) => setReportNote(event.target.value)} placeholder="Optional context" /><Button loading={busy} variant="outline" type="submit">Report</Button></form></CardContent>
          </Card>

          {selected.request.status === "accepted" ? <Card><CardHeader><h2 className="text-sm font-semibold text-text-primary">Opportunity conversation</h2></CardHeader><CardContent className="space-y-4"><div className="space-y-2">{conversation?.messages?.length ? conversation.messages.map((item) => <div className="rounded-lg border border-border-default bg-surface-muted p-3 text-sm text-text-secondary" key={item.id}><strong className="mr-2 text-text-primary">{item.sender_type === "developer" ? "You" : selected.company?.display_name}</strong>{item.body}</div>) : <p className="text-sm text-text-muted">This is a dedicated hiring conversation, not your personal chat inbox.</p>}</div><form className="flex gap-2" onSubmit={sendMessage}><input className="min-w-0 flex-1 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" value={message} maxLength={4000} onChange={(event) => setMessage(event.target.value)} placeholder="Share a clear next step" /><Button disabled={!canConversation} loading={busy} type="submit">Send</Button></form></CardContent></Card> : null}
        </>}
      </section>
    </main>
  );
}
