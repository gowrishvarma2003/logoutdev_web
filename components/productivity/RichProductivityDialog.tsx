"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Dialog, { DialogActions } from "@/components/ui/Dialog";
import {
  productivityApi,
  type ProductivityComposePayload,
  type ProductivityComposeResponse,
  type ProductivityEvent,
  type ProductivityKind,
  type ProductivityList,
  type ProductivityTask,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/services/productivityApi";

type RelationTarget = NonNullable<ProductivityComposePayload["relations"]>[number];

const kinds: ProductivityKind[] = ["task", "reminder", "goal", "event"];
const priorities: TaskPriority[] = ["none", "low", "medium", "high", "urgent"];
const taskStatuses: TaskStatus[] = ["inbox", "planned", "in_progress", "blocked", "completed", "cancelled"];
const goalStatuses = ["not_started", "in_progress", "paused", "completed", "cancelled"];
const reminderStatuses = ["scheduled", "completed", "cancelled"];
const eventStatuses = ["scheduled", "completed", "cancelled"];
const channels = ["in_app", "browser", "email"] as const;

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseLines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function parseTags(value: string) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function numberOrUndefined(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function addHours(localDateTime: string, hours: number) {
  if (!localDateTime) return "";
  const date = new Date(localDateTime);
  if (Number.isNaN(date.getTime())) return "";
  date.setHours(date.getHours() + hours);
  return toLocalInput(date.toISOString());
}

export default function RichProductivityDialog({
  open,
  onClose,
  initialKind = "task",
  lockKind = false,
  lists = [],
  tasks = [],
  events = [],
  defaultTitle = "",
  defaultDate = "",
  defaultDescription = "",
  defaultTags = "",
  defaultRelation,
  defaultMyDay = false,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  initialKind?: ProductivityKind;
  lockKind?: boolean;
  lists?: ProductivityList[];
  tasks?: ProductivityTask[];
  events?: ProductivityEvent[];
  defaultTitle?: string;
  defaultDate?: string;
  defaultDescription?: string;
  defaultTags?: string;
  defaultRelation?: RelationTarget;
  defaultMyDay?: boolean;
  onCreated?: (response: ProductivityComposeResponse) => void | Promise<void>;
}) {
  const [kind, setKind] = useState<ProductivityKind>(initialKind);
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [listId, setListId] = useState("");
  const [linkedTaskId, setLinkedTaskId] = useState("");
  const [linkedEventId, setLinkedEventId] = useState("");
  const [status, setStatus] = useState("inbox");
  const [priority, setPriority] = useState<TaskPriority>("none");
  const [startAt, setStartAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [estimate, setEstimate] = useState("");
  const [recurrence, setRecurrence] = useState("");
  const [pinMyDay, setPinMyDay] = useState(defaultMyDay);
  const [checklist, setChecklist] = useState("");
  const [reminderAt, setReminderAt] = useState("");
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderChannels, setReminderChannels] = useState<string[]>(["in_app"]);
  const [targetAt, setTargetAt] = useState("");
  const [progressType, setProgressType] = useState("manual");
  const [progressPercent, setProgressPercent] = useState("0");
  const [numericTarget, setNumericTarget] = useState("");
  const [numericCurrent, setNumericCurrent] = useState("");
  const [milestones, setMilestones] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [color, setColor] = useState("");
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [tags, setTags] = useState(defaultTags);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const localDate = toLocalInput(defaultDate) || defaultDate;
    setKind(initialKind);
    setTitle(defaultTitle);
    setDescription(defaultDescription);
    setTags(defaultTags);
    setDueAt(initialKind === "task" ? localDate : "");
    setReminderAt(initialKind === "reminder" ? localDate : "");
    setTargetAt(initialKind === "goal" ? localDate : "");
    setEventStart(initialKind === "event" ? localDate : "");
    setEventEnd(initialKind === "event" ? addHours(localDate, 1) : "");
    setReminderTitle(defaultTitle ? `Reminder: ${defaultTitle}` : "");
    setPinMyDay(defaultMyDay);
    setStatus(initialKind === "goal" ? "not_started" : initialKind === "task" ? "inbox" : "scheduled");
    setError("");
  }, [defaultDate, defaultDescription, defaultMyDay, defaultTags, defaultTitle, initialKind, open]);

  const statusOptions = useMemo(() => {
    if (kind === "task") return taskStatuses;
    if (kind === "goal") return goalStatuses;
    if (kind === "reminder") return reminderStatuses;
    return eventStatuses;
  }, [kind]);

  function baseItem(): Record<string, unknown> & { title: string } {
    const item: Record<string, unknown> & { title: string } = { title: title.trim() };
    if (description.trim()) item.description = description.trim();
    if (recurrence.trim()) item.recurrence_rule = recurrence.trim();
    if (kind !== "goal") item.time_zone = timeZone.trim() || "UTC";
    if (kind === "task") {
      item.list_id = listId || null;
      item.status = status;
      item.priority = priority;
      item.start_at = toIso(startAt);
      item.due_at = toIso(dueAt);
      item.estimated_minutes = numberOrUndefined(estimate);
      item.is_pinned = pinMyDay;
    }
    if (kind === "reminder") {
      item.task_id = linkedTaskId || null;
      item.event_id = linkedEventId || null;
      item.remind_at = toIso(reminderAt);
      item.channels = reminderChannels;
      item.status = status;
    }
    if (kind === "goal") {
      item.status = status;
      item.priority = priority;
      item.start_at = toIso(startAt);
      item.target_at = toIso(targetAt);
      item.progress_type = progressType;
      item.progress_percent = Math.max(0, Math.min(100, Math.round(Number(progressPercent) || 0)));
      item.numeric_target = numberOrUndefined(numericTarget);
      item.numeric_current = numberOrUndefined(numericCurrent);
    }
    if (kind === "event") {
      item.task_id = linkedTaskId || null;
      item.starts_at = toIso(eventStart);
      item.ends_at = toIso(eventEnd);
      item.all_day = allDay;
      item.location = location.trim() || null;
      item.meeting_url = meetingUrl.trim() || null;
      item.color = color.trim() || null;
      item.status = status;
    }
    return item;
  }

  function buildPayload(): ProductivityComposePayload {
    const payload: ProductivityComposePayload = { kind, item: baseItem() };
    const parsedTags = parseTags(tags);
    if (parsedTags.length) payload.tags = parsedTags;
    if (defaultRelation) payload.relations = [defaultRelation];
    if (kind === "task") {
      const items = parseLines(checklist);
      if (items.length) payload.checklist = items;
      if (pinMyDay) payload.my_day = { day: today() };
      if (reminderAt) payload.reminders = [{ title: reminderTitle.trim() || title.trim(), remind_at: toIso(reminderAt) || "", channels: reminderChannels, time_zone: timeZone }];
    }
    if (kind === "goal") {
      const items = parseLines(milestones);
      if (items.length) payload.milestones = items;
    }
    if (kind === "event" && reminderAt) {
      payload.reminders = [{ title: reminderTitle.trim() || title.trim(), remind_at: toIso(reminderAt) || "", channels: reminderChannels, time_zone: timeZone }];
    }
    return payload;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await productivityApi.compose(buildPayload());
      await onCreated?.(response);
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create productivity item.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add to Productivity" description="Capture the details now so the plan is useful later." maxWidthClassName="max-w-3xl">
      <form onSubmit={submit} className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
        {lockKind ? null : (
          <div className="grid grid-cols-4 gap-1 rounded-xl border border-border-default bg-surface-muted p-1">
            {kinds.map((itemKind) => (
              <button key={itemKind} type="button" onClick={() => setKind(itemKind)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${kind === itemKind ? "bg-surface-active text-text-primary" : "text-text-muted hover:text-text-secondary"}`}>
                {itemKind}
              </button>
            ))}
          </div>
        )}

        {error ? <div role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div> : null}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="md:col-span-2 text-xs font-semibold uppercase text-text-muted">
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={300} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-focus/70" />
          </label>
          <label className="md:col-span-2 text-xs font-semibold uppercase text-text-muted">
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={5000} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-focus/70" />
          </label>

          {kind === "task" ? (
            <>
              <label className="text-xs font-semibold uppercase text-text-muted">List<select value={listId} onChange={(event) => setListId(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-secondary"><option value="">Inbox</option>{lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label>
              <label className="text-xs font-semibold uppercase text-text-muted">Priority<select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-secondary">{priorities.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label className="text-xs font-semibold uppercase text-text-muted">Start<input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
              <label className="text-xs font-semibold uppercase text-text-muted">Due<input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
              <label className="text-xs font-semibold uppercase text-text-muted">Estimate minutes<input type="number" min={1} max={10080} value={estimate} onChange={(event) => setEstimate(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
              <label className="flex items-center gap-2 pt-6 text-sm text-text-secondary"><input type="checkbox" checked={pinMyDay} onChange={(event) => setPinMyDay(event.target.checked)} />Pin to Today&apos;s Focus</label>
              <label className="md:col-span-2 text-xs font-semibold uppercase text-text-muted">Checklist<textarea value={checklist} onChange={(event) => setChecklist(event.target.value)} rows={3} placeholder="One checklist item per line" className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
            </>
          ) : null}

          {kind === "reminder" ? (
            <>
              <label className="text-xs font-semibold uppercase text-text-muted">Remind at<input required type="datetime-local" value={reminderAt} onChange={(event) => setReminderAt(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
              <label className="text-xs font-semibold uppercase text-text-muted">Link task<select value={linkedTaskId} onChange={(event) => setLinkedTaskId(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-secondary"><option value="">No task</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>
              <label className="text-xs font-semibold uppercase text-text-muted">Link event<select value={linkedEventId} onChange={(event) => setLinkedEventId(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-secondary"><option value="">No event</option>{events.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
            </>
          ) : null}

          {kind === "goal" ? (
            <>
              <label className="text-xs font-semibold uppercase text-text-muted">Priority<select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-secondary">{priorities.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label className="text-xs font-semibold uppercase text-text-muted">Target<input type="datetime-local" value={targetAt} onChange={(event) => setTargetAt(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
              <label className="text-xs font-semibold uppercase text-text-muted">Progress type<select value={progressType} onChange={(event) => setProgressType(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-secondary"><option value="manual">Manual</option><option value="numeric">Numeric</option></select></label>
              <label className="text-xs font-semibold uppercase text-text-muted">Progress %<input type="number" min={0} max={100} value={progressPercent} onChange={(event) => setProgressPercent(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
              {progressType === "numeric" ? <><label className="text-xs font-semibold uppercase text-text-muted">Current<input type="number" value={numericCurrent} onChange={(event) => setNumericCurrent(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label><label className="text-xs font-semibold uppercase text-text-muted">Target value<input type="number" value={numericTarget} onChange={(event) => setNumericTarget(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label></> : null}
              <label className="md:col-span-2 text-xs font-semibold uppercase text-text-muted">Milestones<textarea value={milestones} onChange={(event) => setMilestones(event.target.value)} rows={3} placeholder="One milestone per line" className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
            </>
          ) : null}

          {kind === "event" ? (
            <>
              <label className="text-xs font-semibold uppercase text-text-muted">Starts<input required type="datetime-local" value={eventStart} onChange={(event) => { setEventStart(event.target.value); if (!eventEnd) setEventEnd(addHours(event.target.value, 1)); }} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
              <label className="text-xs font-semibold uppercase text-text-muted">Ends<input required type="datetime-local" value={eventEnd} onChange={(event) => setEventEnd(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
              <label className="text-xs font-semibold uppercase text-text-muted">Location<input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={300} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
              <label className="text-xs font-semibold uppercase text-text-muted">Meeting URL<input value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} maxLength={2048} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
              <label className="text-xs font-semibold uppercase text-text-muted">Color<input value={color} onChange={(event) => setColor(event.target.value)} maxLength={20} placeholder="#38bdf8" className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
              <label className="text-xs font-semibold uppercase text-text-muted">Link task<select value={linkedTaskId} onChange={(event) => setLinkedTaskId(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-secondary"><option value="">No task</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>
              <label className="flex items-center gap-2 pt-6 text-sm text-text-secondary"><input type="checkbox" checked={allDay} onChange={(event) => setAllDay(event.target.checked)} />All day</label>
            </>
          ) : null}

          <label className="text-xs font-semibold uppercase text-text-muted">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-secondary">{statusOptions.map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}</select></label>
          <label className="text-xs font-semibold uppercase text-text-muted">Time zone<input value={timeZone} onChange={(event) => setTimeZone(event.target.value)} maxLength={80} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
          <label className="md:col-span-2 text-xs font-semibold uppercase text-text-muted">Tags<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="planning, launch, client" className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
          <label className="md:col-span-2 text-xs font-semibold uppercase text-text-muted">Recurrence<input value={recurrence} onChange={(event) => setRecurrence(event.target.value)} placeholder="FREQ=WEEKLY;BYDAY=MO,WE" className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>

          {["task", "event"].includes(kind) ? (
            <>
              <label className="text-xs font-semibold uppercase text-text-muted">Linked reminder title<input value={reminderTitle} onChange={(event) => setReminderTitle(event.target.value)} maxLength={300} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
              <label className="text-xs font-semibold uppercase text-text-muted">Linked reminder time<input type="datetime-local" value={reminderAt} onChange={(event) => setReminderAt(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary" /></label>
            </>
          ) : null}

          <div className="md:col-span-2 flex flex-wrap gap-3">
            {channels.map((channel) => (
              <label key={channel} className="flex items-center gap-2 text-sm text-text-secondary">
                <input type="checkbox" checked={reminderChannels.includes(channel)} onChange={(event) => setReminderChannels((current) => event.target.checked ? [...new Set([...current, channel])] : current.filter((item) => item !== channel))} />
                {channel.replace("_", " ")}
              </label>
            ))}
          </div>
        </div>

        <DialogActions>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={submitting}>Create</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
