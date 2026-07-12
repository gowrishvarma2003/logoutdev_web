"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Card, CardContent } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/ui/Page";
import { CalendarIcon, CheckCircleIcon, PlusIcon, TrashIcon, BellIcon, SparklesIcon } from "@/components/ui/Icons";
import Dialog, { DialogActions } from "@/components/ui/Dialog";
import RichProductivityDialog from "./RichProductivityDialog";
import {
  productivityApi,
  type FocusSession,
  type MyDayItem,
  type ProductivityAnalytics,
  type ProductivityEvent,
  type ProductivityGoal,
  type ProductivityList,
  type ProductivityReminder,
  type ProductivitySettings,
  type ProductivityTask,
  type ProductivityTemplate,
  type ProductivityKind,
  type TaskPriority
} from "@/lib/services/productivityApi";
import { productivitySectionMeta, type ProductivitySection } from "./productivityNavigation";

type SupportedSection = Exclude<ProductivitySection, "notes">;
type TaskView = "list" | "board" | "table";
type CalendarDetailsItem =
  | { id: string; title: string; type: "event"; date: string | null; original: ProductivityEvent }
  | { id: string; title: string; type: "task"; date: string | null; original: ProductivityTask }
  | { id: string; title: string; type: "reminder"; date: string | null; original: ProductivityReminder }
  | { id: string; title: string; type: "goal"; date: string | null; original: ProductivityGoal };
const priorities: TaskPriority[] = ["none", "low", "medium", "high", "urgent"];
const taskStatuses = ["inbox", "planned", "in_progress", "blocked", "completed"] as const;

function dateLabel(value: string | null) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "No date";
}
function today() { return new Date().toISOString().slice(0, 10); }
function message(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }

function Notice({ error, retry }: { error: string | null; retry: () => void }) {
  return error ? (
    <div role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger flex items-center justify-between">
      <span>{error}</span>
      <button type="button" className="ml-2 underline font-semibold text-danger-active hover:text-danger" onClick={retry}>Retry</button>
    </div>
  ) : null;
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const styles: Record<TaskPriority, string> = {
    none: "bg-surface-muted text-text-muted border-border-subtle",
    low: "bg-blue-950/40 text-blue-300 border-blue-900/40",
    medium: "bg-yellow-950/40 text-yellow-300 border-yellow-900/40",
    high: "bg-amber-950/40 text-amber-300 border-amber-900/40",
    urgent: "bg-danger/20 text-danger border-danger/40",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border capitalize leading-none ${styles[priority]}`}>
      {priority}
    </span>
  );
}

function DueBadge({ dueAt, status }: { dueAt: string | null; status: string }) {
  if (!dueAt) return <span className="text-text-muted">-</span>;
  const isOverdue = new Date(dueAt) < new Date() && status !== "completed";
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border leading-none ${
      isOverdue 
        ? "bg-danger/25 border-danger/40 text-danger font-semibold" 
        : "bg-surface-active border-border-default text-text-secondary"
    }`}>
      {dateLabel(dueAt)}
    </span>
  );
}

function TaskRow({ task, lists, onUpdate, onMyDay, myDay }: { task: ProductivityTask; lists: ProductivityList[]; onUpdate: (task: ProductivityTask, data: Partial<ProductivityTask>) => void; onMyDay?: (task: ProductivityTask) => void; myDay?: boolean }) {
  return (
    <li className="flex flex-wrap items-center gap-2 px-4 py-3 sm:flex-nowrap hover:bg-surface-muted/30 transition-colors">
      <button
        type="button"
        aria-label={task.status === "completed" ? `Reopen ${task.title}` : `Complete ${task.title}`}
        onClick={() => onUpdate(task, { status: task.status === "completed" ? "inbox" : "completed" })}
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
          task.status === "completed" ? "border-success bg-success text-app" : "border-border-strong text-transparent hover:border-success"
        }`}
      >
        <CheckCircleIcon className="h-3.5 w-3.5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${task.status === "completed" ? "text-text-muted line-through" : "text-text-primary"}`}>{task.title}</p>
        <p className="text-xs text-text-muted">
          {task.due_at ? `Due ${dateLabel(task.due_at)}` : "No due date"}
          {task.list_id ? ` · ${lists.find((list) => list.id === task.list_id)?.name ?? "List"}` : ""}
        </p>
      </div>
      <select
        aria-label={`Priority for ${task.title}`}
        value={task.priority}
        onChange={(event) => onUpdate(task, { priority: event.target.value as TaskPriority })}
        className="rounded-lg border border-border-default bg-surface px-2 py-1 text-xs text-text-secondary focus:outline-none focus:ring-2 focus:ring-focus/70"
      >
        {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
      </select>
      {onMyDay ? <Button size="sm" variant="outline" onClick={() => onMyDay(task)}>{myDay ? "Remove" : "My Day"}</Button> : null}
      <Button size="sm" variant="ghost" onClick={() => onUpdate(task, { is_archived: !task.is_archived })}>{task.is_archived ? "Restore" : "Archive"}</Button>
    </li>
  );
}

export default function ProductivityPage({ section }: { section: SupportedSection }) {
  const searchParams = useSearchParams();
  const meta = productivitySectionMeta[section];
  const [tasks, setTasks] = useState<ProductivityTask[]>([]);
  const [lists, setLists] = useState<ProductivityList[]>([]);
  const [myDay, setMyDay] = useState<MyDayItem[]>([]);
  const [events, setEvents] = useState<ProductivityEvent[]>([]);
  const [reminders, setReminders] = useState<ProductivityReminder[]>([]);
  const [goals, setGoals] = useState<ProductivityGoal[]>([]);
  const [settings, setSettings] = useState<ProductivitySettings | null>(null);
  const [templates, setTemplates] = useState<ProductivityTemplate[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [analytics, setAnalytics] = useState<ProductivityAnalytics | null>(null);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof productivityApi.overview>> | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeKind, setComposeKind] = useState<ProductivityKind>("task");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [taskView, setTaskView] = useState<TaskView>("list");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const day = today();

  const range = useMemo(() => {
    const start = new Date();
    start.setDate(1); // Start from beginning of current month
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 90); // Fetch a wider range for calendar navigation
    return { start: start.toISOString(), end: end.toISOString() };
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (section === "overview") {
        const [overviewResult, myDayResult, taskResult, listResult] = await Promise.all([
          productivityApi.overview(),
          productivityApi.getMyDay(day),
          productivityApi.listTasks(),
          productivityApi.listLists()
        ]);
        setOverview(overviewResult);
        setMyDay(myDayResult.items);
        setTasks(taskResult.tasks);
        setLists(listResult.lists);
      }
      if (section === "tasks" || section === "inbox") {
        const [taskResult, listResult, myDayResult] = await Promise.all([
          productivityApi.listTasks(),
          productivityApi.listLists(),
          productivityApi.getMyDay(day)
        ]);
        setTasks(taskResult.tasks);
        setLists(listResult.lists);
        setMyDay(myDayResult.items);
      }
      if (section === "calendar") {
        const [eventResult, taskResult, reminderResult, goalResult, listResult, myDayResult] = await Promise.all([
          productivityApi.listEvents(range.start, range.end),
          productivityApi.listTasks(),
          productivityApi.listReminders(),
          productivityApi.listGoals(),
          productivityApi.listLists(),
          productivityApi.getMyDay(day)
        ]);
        setEvents(eventResult.events);
        setTasks(taskResult.tasks);
        setReminders(reminderResult.reminders);
        setGoals(goalResult.goals);
        setLists(listResult.lists);
        setMyDay(myDayResult.items);
      }
      if (section === "reminders") setReminders((await productivityApi.listReminders()).reminders);
      if (section === "goals") setGoals((await productivityApi.listGoals()).goals);
      if (section === "archive") {
        const [taskResult, goalResult, listResult] = await Promise.all([productivityApi.listTasks({ archived: true }), productivityApi.listGoals(true), productivityApi.listLists(true)]);
        setTasks(taskResult.tasks);
        setGoals(goalResult.goals);
        setLists(listResult.lists);
      }
      if (section === "templates") setTemplates((await productivityApi.listTemplates()).templates);
      if (section === "settings") {
        const from = new Date(Date.now() - 30 * 86400000).toISOString();
        const [settingResult, focusResult, analyticsResult] = await Promise.all([productivityApi.getSettings(), productivityApi.listFocusSessions(), productivityApi.analytics(from, new Date().toISOString())]);
        setSettings(settingResult.settings);
        setFocusSessions(focusResult.focus_sessions);
        setAnalytics(analyticsResult);
      }
    } catch (requestError) { setError(message(requestError, "Could not load this workspace.")); }
    finally { setLoading(false); }
  }, [day, range.end, range.start, section]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (searchParams.get("quick") === "1") {
      setComposeKind("task");
      setComposeOpen(true);
    }
  }, [searchParams]);

  function openCompose(kind: ProductivityKind) {
    setComposeKind(kind);
    setComposeOpen(true);
  }
  async function updateTask(task: ProductivityTask, data: Partial<ProductivityTask>) { try { await productivityApi.updateTask(task.id, data); await load(); } catch (requestError) { setError(message(requestError, "Could not update task.")); } }
  async function toggleMyDay(task: ProductivityTask, exists: boolean) { try { if (exists) await productivityApi.removeMyDay(task.id, day); else await productivityApi.addMyDay(task.id, day); await load(); } catch (requestError) { setError(message(requestError, "Could not update My Day.")); } }
  async function updateGoal(goal: ProductivityGoal, progress: number) { try { await productivityApi.updateGoal(goal.id, { progress_percent: progress, status: progress === 100 ? "completed" : goal.status }); await load(); } catch (requestError) { setError(message(requestError, "Could not update goal.")); } }
  async function saveSettings(event: FormEvent) { event.preventDefault(); if (!settings) return; try { setSettings((await productivityApi.updateSettings(settings)).settings); } catch (requestError) { setError(message(requestError, "Could not save settings.")); } }
  async function quickCapture(event: FormEvent) {
    event.preventDefault();
    const title = quickTitle.trim();
    if (!title || quickSubmitting) return;
    setQuickSubmitting(true);
    setError(null);
    try {
      await productivityApi.compose({ kind: "task", item: { title } });
      setQuickTitle("");
      await load();
    } catch (requestError) {
      setError(message(requestError, "Could not capture this task."));
    } finally {
      setQuickSubmitting(false);
    }
  }

  const showCreator = ["tasks", "reminders", "goals", "calendar", "templates"].includes(section);
  return (
    <>
      <PageHeader title={meta.title} description={meta.description} />
      <PageContainer className="max-w-6xl space-y-5">
        <Notice error={error} retry={() => void load()} />
        {(section === "overview" || section === "inbox") ? (
          <form onSubmit={quickCapture} className="flex items-center gap-2 border-b border-border-subtle pb-5">
            <label htmlFor="quick-capture" className="sr-only">Quick capture</label>
            <input id="quick-capture" value={quickTitle} onChange={(event) => setQuickTitle(event.target.value)} maxLength={300} placeholder="Add a task to Inbox" className="min-w-0 flex-1 rounded-lg border border-border-default bg-surface px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:ring-2 focus:ring-focus/70" />
            <Button type="submit" size="sm" loading={quickSubmitting} disabled={!quickTitle.trim() || quickSubmitting}>Add</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => openCompose("task")}>More</Button>
          </form>
        ) : null}
        {section === "overview" && overview ? (
          <Overview
            overview={overview}
            day={day}
            myDay={myDay}
            tasks={tasks}
            onUpdateTask={updateTask}
            onToggleMyDay={toggleMyDay}
          />
        ) : null}
        {section === "tasks" ? (
          <TasksView
            tasks={tasks}
            lists={lists}
            taskView={taskView}
            setTaskView={setTaskView}
            onUpdate={updateTask}
            onCreateList={async (name) => { try { await productivityApi.createList(name); await load(); } catch (err) { setError(message(err, "Could not create list.")); } }}
            onToggleMyDay={toggleMyDay}
            myDay={myDay}
          />
        ) : null}
        {section === "inbox" ? (
          <TasksView
            tasks={tasks.filter((task) => !task.list_id && !task.due_at && task.status === "inbox")}
            lists={lists}
            taskView="list"
            setTaskView={() => undefined}
            onUpdate={updateTask}
            onCreateList={async (name) => { try { await productivityApi.createList(name); await load(); } catch (err) { setError(message(err, "Could not create list.")); } }}
            onToggleMyDay={toggleMyDay}
            myDay={myDay}
          />
        ) : null}
        
        {showCreator && section !== "calendar" && section !== "overview" && section !== "inbox" ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-muted p-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">Create a detailed {section === "templates" ? "task template starter" : section.slice(0, -1)}</p>
              <p className="text-xs text-text-muted">Add dates, priority, notes, tags, reminders, and supporting steps in one flow.</p>
            </div>
            <Button size="sm" onClick={() => openCompose(section === "reminders" ? "reminder" : section === "goals" ? "goal" : "task")}>
              <PlusIcon className="h-4 w-4" />
              Add detailed
            </Button>
          </div>
        ) : null}
        
        {section === "calendar" ? (
          <CalendarView
            events={events}
            tasks={tasks}
            reminders={reminders}
            goals={goals}
            lists={lists}
            myDay={myDay}
            onDeleteEvent={async (id) => { try { await productivityApi.deleteEvent(id); await load(); } catch (err) { setError(message(err, "Could not delete event.")); } }}
            onDeleteTask={async (id) => { try { await productivityApi.deleteTask(id); await load(); } catch (err) { setError(message(err, "Could not delete task.")); } }}
            onDeleteReminder={async (id) => { try { await productivityApi.deleteReminder(id); await load(); } catch (err) { setError(message(err, "Could not delete reminder.")); } }}
            onDeleteGoal={async (id) => { try { await productivityApi.deleteGoal(id); await load(); } catch (err) { setError(message(err, "Could not delete goal.")); } }}
            onCreated={load}
            onUpdateTask={updateTask}
            onUpdateReminder={async (id, status) => { try { await productivityApi.updateReminder(id, { status }); await load(); } catch (err) { setError(message(err, "Could not update reminder.")); } }}
            onToggleMyDay={toggleMyDay}
          />
        ) : null}
        
        {section === "reminders" ? <RemindersView reminders={reminders} onUpdate={async (id, status) => { try { await productivityApi.updateReminder(id, { status }); await load(); } catch (err) { setError(message(err, "Could not update reminder.")); } }} /> : null}
        {section === "goals" ? <GoalsView goals={goals} onUpdate={updateGoal} /> : null}
        {section === "archive" ? <ArchiveView tasks={tasks} goals={goals} lists={lists} onTask={updateTask} onGoal={async (goal) => { try { await productivityApi.updateGoal(goal.id, { is_archived: false }); await load(); } catch (err) { setError(message(err, "Could not restore goal.")); } }} /> : null}
        {section === "settings" && settings ? <SettingsView settings={settings} setSettings={setSettings} onSubmit={saveSettings} focusSessions={focusSessions} analytics={analytics} onFocus={async () => { try { await productivityApi.createFocusSession(settings.focus_minutes); await load(); } catch (err) { setError(message(err, "Could not start focus session.")); } }} /> : null}
        {section === "templates" ? <TemplatesView templates={templates} onUse={async (template) => { try { await productivityApi.createTask({ title: typeof template.content.title === "string" ? template.content.title : template.name }); await load(); } catch (err) { setError(message(err, "Could not use template.")); } }} onDelete={async (id) => { try { await productivityApi.deleteTemplate(id); await load(); } catch (err) { setError(message(err, "Could not delete template.")); } }} /> : null}
        {loading ? <p className="text-sm text-text-muted" aria-live="polite">Loading your workspace…</p> : null}
        <RichProductivityDialog
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          initialKind={composeKind}
          lockKind={section !== "calendar"}
          lists={lists}
          tasks={tasks}
          events={events}
          onCreated={load}
        />
      </PageContainer>
    </>
  );
}

function TodayWorkRows({ items, focus, myDayTaskIds, onUpdateTask, onToggleMyDay }: {
  items: ProductivityTask[];
  focus?: boolean;
  myDayTaskIds: Set<string>;
  onUpdateTask: (task: ProductivityTask, data: Partial<ProductivityTask>) => Promise<void>;
  onToggleMyDay: (task: ProductivityTask, exists: boolean) => Promise<void>;
}) {
  if (!items.length) return <p className="py-3 text-sm text-text-muted">Nothing here.</p>;
  return <ul className="divide-y divide-border-subtle">{items.map((task) => <li key={task.id} className="flex flex-wrap items-center gap-2 py-2.5">
    <button type="button" aria-label={`Complete ${task.title}`} onClick={() => onUpdateTask(task, { status: "completed" })} className="h-5 w-5 shrink-0 rounded-full border border-border-strong hover:border-success" />
    <span className="min-w-40 flex-1 truncate text-sm font-medium text-text-primary">{task.title}</span>
    {task.due_at ? <span className="text-xs text-text-muted">{dateLabel(task.due_at)}</span> : null}
    <select aria-label={`Priority for ${task.title}`} value={task.priority} onChange={(event) => onUpdateTask(task, { priority: event.target.value as TaskPriority })} className="rounded-md border border-border-default bg-surface px-2 py-1 text-xs text-text-secondary">{priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select>
    <input aria-label={`Reschedule ${task.title}`} type="datetime-local" onChange={(event) => event.target.value && onUpdateTask(task, { due_at: new Date(event.target.value).toISOString() })} className="w-9 rounded-md border border-border-default bg-surface px-1 py-1 text-xs text-text-secondary focus:w-auto" />
    {focus && myDayTaskIds.has(task.id) ? <Button size="sm" variant="ghost" onClick={() => onToggleMyDay(task, true)}>Remove</Button> : null}
  </li>)}</ul>;
}

function Overview({
  overview,
  day,
  myDay,
  tasks,
  onUpdateTask,
  onToggleMyDay,
}: {
  overview: Awaited<ReturnType<typeof productivityApi.overview>>;
  day: string;
  myDay: MyDayItem[];
  tasks: ProductivityTask[];
  onUpdateTask: (task: ProductivityTask, data: Partial<ProductivityTask>) => Promise<void>;
  onToggleMyDay: (task: ProductivityTask, exists: boolean) => Promise<void>;
}) {
  const myDayTaskIds = new Set(myDay.map((item) => item.task_id));
  const start = new Date(`${day}T00:00:00`);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const active = (task: ProductivityTask) => !["completed", "cancelled"].includes(task.status) && !task.is_archived;
  const overdue = tasks.filter((task) => active(task) && task.due_at && new Date(task.due_at) < start);
  const todayTasks = tasks.filter((task) => active(task) && (myDayTaskIds.has(task.id) || (task.due_at && new Date(task.due_at) >= start && new Date(task.due_at) < end)) && !overdue.some((item) => item.id === task.id));

  return (
    <div className="space-y-6">
      {overdue.length ? <section className="border-t border-danger/30 pt-3"><h2 className="text-sm font-semibold text-danger">Overdue <span className="text-text-muted">{overdue.length}</span></h2><TodayWorkRows items={overdue} myDayTaskIds={myDayTaskIds} onUpdateTask={onUpdateTask} onToggleMyDay={onToggleMyDay} /></section> : null}
      <section className="border-t border-border-subtle pt-3"><h2 className="text-sm font-semibold text-text-primary">Today <span className="text-text-muted">{todayTasks.length}</span></h2><TodayWorkRows items={todayTasks} focus myDayTaskIds={myDayTaskIds} onUpdateTask={onUpdateTask} onToggleMyDay={onToggleMyDay} /></section>
      <div className="grid gap-6 border-t border-border-subtle pt-4 md:grid-cols-3">
        <section><h2 className="text-sm font-semibold text-text-primary">Reminders</h2>{overview.upcoming_reminders.length ? <ul className="mt-2 space-y-2">{overview.upcoming_reminders.map((item) => <li key={item.id} className="text-sm text-text-secondary"><span className="block truncate">{item.title}</span><span className="text-xs text-text-muted">{dateLabel(item.remind_at)}</span></li>)}</ul> : <p className="mt-2 text-sm text-text-muted">None upcoming.</p>}</section>
        <section><h2 className="text-sm font-semibold text-text-primary">Upcoming</h2>{overview.upcoming_events.length ? <ul className="mt-2 space-y-2">{overview.upcoming_events.map((item) => <li key={item.id} className="text-sm text-text-secondary"><span className="block truncate">{item.title}</span><span className="text-xs text-text-muted">{dateLabel(item.starts_at)}</span></li>)}</ul> : <p className="mt-2 text-sm text-text-muted">No events.</p>}</section>
        <section><h2 className="text-sm font-semibold text-text-primary">Goals</h2>{overview.active_goals.length ? <ul className="mt-2 space-y-3">{overview.active_goals.map((goal) => <li key={goal.id}><div className="flex justify-between gap-2 text-sm"><span className="truncate text-text-secondary">{goal.title}</span><span className="text-text-muted">{goal.progress_percent}%</span></div><div className="mt-1 h-1 overflow-hidden rounded bg-surface-hover"><div className="h-full bg-success" style={{ width: `${goal.progress_percent}%` }} /></div></li>)}</ul> : <p className="mt-2 text-sm text-text-muted">No active goals.</p>}</section>
      </div>
    </div>
  );
}

function TasksView({
  tasks,
  lists,
  taskView,
  setTaskView,
  onUpdate,
  onCreateList,
  onToggleMyDay,
  myDay,
}: {
  tasks: ProductivityTask[];
  lists: ProductivityList[];
  taskView: TaskView;
  setTaskView: (view: TaskView) => void;
  onUpdate: (task: ProductivityTask, data: Partial<ProductivityTask>) => Promise<void>;
  onCreateList: (name: string) => void;
  onToggleMyDay: (task: ProductivityTask, exists: boolean) => Promise<void>;
  myDay: MyDayItem[];
}) {
  const [name, setName] = useState("");
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [listFilter, setListFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active"); // "active" | "completed" | "all"

  // Process filter logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesList = listFilter === "" || task.list_id === listFilter;
    const matchesPriority = priorityFilter === "" || task.priority === priorityFilter;
    
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = task.status !== "completed";
    } else if (statusFilter === "completed") {
      matchesStatus = task.status === "completed";
    }
    
    return matchesSearch && matchesList && matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* View Switcher and Add List Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border-subtle shadow-sm">
        <div className="inline-flex rounded-lg border border-border-default p-0.5 bg-surface-muted/50">
          {(["list", "board", "table"] as TaskView[]).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setTaskView(view)}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold capitalize cursor-pointer transition-colors border-0 ${
                taskView === view ? "bg-surface-active text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {view} View
            </button>
          ))}
        </div>
        
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim()) {
              onCreateList(name.trim());
              setName("");
            }
          }}
          className="flex gap-2"
        >
          <input
            aria-label="New list name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            placeholder="New list name..."
            className="w-36 rounded-xl border border-border-default bg-surface px-3 py-1.5 text-xs text-text-primary outline-none focus:ring-2 focus:ring-focus/70"
          />
          <Button size="sm" variant="outline">
            Create List
          </Button>
        </form>
      </div>

      {/* Filter / Search Toolbar */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 bg-surface p-3.5 rounded-xl border border-border-subtle shadow-sm">
        {/* Search */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Search Title</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type search terms..."
            className="w-full rounded-lg border border-border-default bg-surface-muted/20 px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-primary/50"
          />
        </div>

        {/* List Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Filter List</label>
          <select
            value={listFilter}
            onChange={(e) => setListFilter(e.target.value)}
            className="w-full rounded-lg border border-border-default bg-surface px-2.5 py-1.5 text-xs text-text-secondary"
          >
            <option value="">All Lists</option>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Filter Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full rounded-lg border border-border-default bg-surface px-2.5 py-1.5 text-xs text-text-secondary"
          >
            <option value="">All Priorities</option>
            {priorities.map((prio) => (
              <option key={prio} value={prio} className="capitalize">
                {prio}
              </option>
            ))}
          </select>
        </div>

        {/* Status completion state Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Completion State</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-border-default bg-surface px-2.5 py-1.5 text-xs text-text-secondary"
          >
            <option value="active">Active Tasks</option>
            <option value="completed">Completed Tasks</option>
            <option value="all">All Tasks</option>
          </select>
        </div>
      </div>

      {/* Main Views Container */}
      {taskView === "board" ? (
        <KanbanBoard
          tasks={filteredTasks}
          lists={lists}
          myDay={myDay}
          onUpdate={onUpdate}
          onToggleMyDay={onToggleMyDay}
        />
      ) : taskView === "table" ? (
        <TableView
          tasks={filteredTasks}
          lists={lists}
          myDay={myDay}
          onUpdate={onUpdate}
          onToggleMyDay={onToggleMyDay}
        />
      ) : (
        <Card className="border border-border-subtle bg-surface shadow-sm">
          <CardContent className="p-0">
            {filteredTasks.length ? (
              <ul className="divide-y divide-border-subtle">
                {filteredTasks.map((task) => {
                  const isFocus = myDay.some((item) => item.task_id === task.id);
                  return (
                    <li key={task.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap hover:bg-surface-muted/30 transition-colors">
                      <button
                        type="button"
                        aria-label={task.status === "completed" ? `Reopen ${task.title}` : `Complete ${task.title}`}
                        onClick={() => onUpdate(task, { status: task.status === "completed" ? "inbox" : "completed" })}
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors cursor-pointer ${
                          task.status === "completed" ? "border-success bg-success text-app" : "border-border-strong text-transparent hover:border-success"
                        }`}
                      >
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold truncate ${task.status === "completed" ? "text-text-muted line-through font-normal" : "text-text-primary"}`}>
                            {task.title}
                          </span>
                          {isFocus && <span className="text-xs shrink-0" title="Pinned to Focus">⭐</span>}
                        </div>
                        <div className="text-[10px] text-text-muted flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          {task.due_at ? <span>Due {dateLabel(task.due_at)}</span> : <span>No date</span>}
                          {task.list_id && (
                            <>
                              <span>·</span>
                              <span className="font-medium text-text-secondary bg-surface-active px-1.5 py-0.5 rounded leading-none border border-border-default/50">
                                {lists.find((list) => list.id === task.list_id)?.name ?? "List"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <PriorityBadge priority={task.priority} />
                        <select
                          aria-label={`Status for ${task.title}`}
                          value={task.status}
                          onChange={(event) => onUpdate(task, { status: event.target.value as ProductivityTask["status"] })}
                          className="rounded-lg border border-border-default bg-surface px-2 py-1 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-focus"
                        >
                          {taskStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-2.5 py-1 text-[10px] leading-none"
                          onClick={() => onToggleMyDay(task, isFocus)}
                        >
                          {isFocus ? "Remove Focus" : "Pin Focus"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onUpdate(task, { is_archived: !task.is_archived })}>
                          {task.is_archived ? "Restore" : "Archive"}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={<CheckCircleIcon className="h-8 w-8" />} title="No matching tasks" description="Adjust your filters or add a new task." />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TableView({
  tasks,
  lists,
  myDay,
  onUpdate,
  onToggleMyDay,
}: {
  tasks: ProductivityTask[];
  lists: ProductivityList[];
  myDay: MyDayItem[];
  onUpdate: (task: ProductivityTask, data: Partial<ProductivityTask>) => Promise<void>;
  onToggleMyDay: (task: ProductivityTask, exists: boolean) => Promise<void>;
}) {
  return (
    <Card className="border border-border-subtle bg-surface shadow-sm overflow-hidden">
      <CardContent className="p-0">
        {tasks.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-subtle">
              <thead className="bg-surface-muted/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider w-8"></th>
                  <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">List</th>
                  <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Priority</th>
                  <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Due Date</th>
                  <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 py-3 text-right text-[10px] font-bold text-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {tasks.map((task) => {
                  const isFocus = myDay.some((item) => item.task_id === task.id);
                  const listObj = lists.find((l) => l.id === task.list_id);
                  return (
                    <tr key={task.id} className="hover:bg-surface-muted/20 transition-colors">
                      {/* Checkbox */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onUpdate(task, { status: task.status === "completed" ? "inbox" : "completed" })}
                          className={`grid h-4 w-4 place-items-center rounded-full border transition-colors cursor-pointer ${
                            task.status === "completed" ? "border-success bg-success text-app" : "border-border-strong text-transparent hover:border-success"
                          }`}
                        >
                          <CheckCircleIcon className="h-3 w-3" />
                        </button>
                      </td>
                      
                      {/* Title */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 min-w-[200px]">
                          <span className={`text-sm font-semibold truncate ${task.status === "completed" ? "text-text-muted line-through font-normal" : "text-text-primary"}`}>
                            {task.title}
                          </span>
                          {isFocus && <span className="text-xs shrink-0" title="Pinned to Focus">⭐</span>}
                        </div>
                      </td>

                      {/* List */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {listObj ? (
                          <span className="text-xs font-semibold text-text-secondary bg-surface-active px-2 py-0.5 rounded border border-border-default/60 leading-none">
                            {listObj.name}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted italic">Inbox</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <PriorityBadge priority={task.priority} />
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <DueBadge dueAt={task.due_at} status={task.status} />
                      </td>

                      {/* Status select dropdown */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          aria-label={`Status for ${task.title}`}
                          value={task.status}
                          onChange={(e) => onUpdate(task, { status: e.target.value as ProductivityTask["status"] })}
                          className="bg-transparent border border-border-default hover:border-border-strong rounded-lg px-2 py-1 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-focus cursor-pointer"
                        >
                          {taskStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleMyDay(task, isFocus)}
                            className={`px-2 py-1 rounded border text-[10px] font-semibold transition-colors cursor-pointer ${
                              isFocus 
                                ? "bg-primary/10 border-primary text-primary-active hover:bg-primary/20" 
                                : "border-border-default text-text-secondary hover:bg-surface-active"
                            }`}
                          >
                            {isFocus ? "Unpin Focus" : "Pin Focus"}
                          </button>
                          <Button size="sm" variant="ghost" className="px-1.5 py-0.5 text-[10px]" onClick={() => onUpdate(task, { is_archived: !task.is_archived })}>
                            {task.is_archived ? "Restore" : "Archive"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<CheckCircleIcon className="h-8 w-8" />} title="No tasks found" description="Adjust your search filters or make a new task." />
        )}
      </CardContent>
    </Card>
  );
}

function KanbanBoard({
  tasks,
  lists,
  myDay,
  onUpdate,
  onToggleMyDay,
}: {
  tasks: ProductivityTask[];
  lists: ProductivityList[];
  myDay: MyDayItem[];
  onUpdate: (task: ProductivityTask, data: Partial<ProductivityTask>) => Promise<void>;
  onToggleMyDay: (task: ProductivityTask, exists: boolean) => Promise<void>;
}) {
  const columnHeaders: Record<ProductivityTask["status"], { label: string; accent: string }> = {
    inbox: { label: "Inbox", accent: "bg-blue-500" },
    planned: { label: "Planned", accent: "bg-purple-500" },
    in_progress: { label: "In Progress", accent: "bg-amber-500" },
    blocked: { label: "Blocked", accent: "bg-red-500" },
    completed: { label: "Completed", accent: "bg-success" },
    cancelled: { label: "Cancelled", accent: "bg-surface-muted" }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x">
      {taskStatuses.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        const colMeta = columnHeaders[status];

        return (
          <div
            key={status}
            className="flex-1 min-w-[280px] max-w-[340px] rounded-xl border border-border-subtle bg-surface-muted/10 flex flex-col max-h-[640px] snap-start"
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-border-subtle flex items-center justify-between relative overflow-hidden shrink-0">
              {/* Accent top color line */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${colMeta.accent}`} />
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-primary capitalize tracking-wide">
                  {colMeta.label}
                </span>
                <span className="text-[10px] font-bold bg-surface px-2 py-0.5 rounded border border-border-default/60 text-text-secondary leading-none">
                  {columnTasks.length}
                </span>
              </div>
            </div>

            {/* Column Cards List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 bg-surface-muted/5 scrollbar-thin">
              {columnTasks.length ? (
                columnTasks.map((task) => {
                  const isFocus = myDay.some((item) => item.task_id === task.id);
                  const listObj = lists.find((l) => l.id === task.list_id);
                  const currentIdx = taskStatuses.indexOf(status);

                  return (
                    <Card
                      key={task.id}
                      className="border border-border-subtle bg-surface hover:border-border-strong hover:shadow-md transition-all shadow-sm rounded-xl overflow-hidden p-3 space-y-2.5 group"
                    >
                      {/* Title & Star Focus */}
                      <div className="flex items-start justify-between gap-2.5">
                        <p className={`text-sm font-semibold leading-tight ${task.status === "completed" ? "text-text-muted line-through font-normal" : "text-text-primary"}`}>
                          {task.title}
                        </p>
                        <button
                          type="button"
                          onClick={() => onToggleMyDay(task, isFocus)}
                          title={isFocus ? "Remove Focus" : "Pin to Focus"}
                          className="p-1 rounded hover:bg-surface-active text-xs shrink-0 cursor-pointer border-0 bg-transparent"
                        >
                          {isFocus ? "⭐" : "☆"}
                        </button>
                      </div>

                      {/* Badges and metadata */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <PriorityBadge priority={task.priority} />
                        {task.due_at && <DueBadge dueAt={task.due_at} status={task.status} />}
                        {listObj && (
                          <span className="text-[9px] font-semibold text-text-muted bg-surface-active px-1.5 py-0.5 rounded leading-none border border-border-default/50">
                            {listObj.name}
                          </span>
                        )}
                      </div>

                      {/* Kanban Action Buttons: Move task status */}
                      <div className="flex items-center justify-between border-t border-border-subtle pt-2 text-[10px] text-text-muted leading-none">
                        <button
                          type="button"
                          disabled={currentIdx === 0}
                          onClick={() => onUpdate(task, { status: taskStatuses[currentIdx - 1] })}
                          className={`flex items-center justify-center p-1 rounded hover:bg-surface-active font-bold border-0 bg-transparent transition-colors cursor-pointer ${
                            currentIdx === 0 ? "opacity-20 cursor-not-allowed" : "text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          ← Move
                        </button>

                        <select
                          aria-label={`Jump Status for ${task.title}`}
                          value={task.status}
                          onChange={(e) => onUpdate(task, { status: e.target.value as ProductivityTask["status"] })}
                          className="bg-transparent text-[10px] text-text-muted hover:text-text-secondary cursor-pointer border-0 outline-none w-20 truncate text-center"
                        >
                          {taskStatuses.map((optStatus) => (
                            <option key={optStatus} value={optStatus}>
                              {optStatus.replace("_", " ")}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          disabled={currentIdx === taskStatuses.length - 1}
                          onClick={() => onUpdate(task, { status: taskStatuses[currentIdx + 1] })}
                          className={`flex items-center justify-center p-1 rounded hover:bg-surface-active font-bold border-0 bg-transparent transition-colors cursor-pointer ${
                            currentIdx === taskStatuses.length - 1 ? "opacity-20 cursor-not-allowed" : "text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          Move →
                        </button>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-text-muted italic border border-dashed border-border-default/60 rounded-xl bg-surface/5">
                  No tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CalendarView({
  events,
  tasks,
  reminders,
  goals,
  lists,
  myDay,
  onDeleteEvent,
  onDeleteTask,
  onDeleteReminder,
  onDeleteGoal,
  onCreated,
  onUpdateTask,
  onUpdateReminder,
  onToggleMyDay,
}: {
  events: ProductivityEvent[];
  tasks: ProductivityTask[];
  reminders: ProductivityReminder[];
  goals: ProductivityGoal[];
  lists: ProductivityList[];
  myDay: MyDayItem[];
  onDeleteEvent: (id: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  onCreated: () => Promise<void>;
  onUpdateTask: (task: ProductivityTask, data: Partial<ProductivityTask>) => Promise<void>;
  onUpdateReminder: (id: string, status: string) => Promise<void>;
  onToggleMyDay: (task: ProductivityTask, exists: boolean) => Promise<void>;
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  
  // Quick Add Modal state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState("");
  const [quickAddKind, setQuickAddKind] = useState<ProductivityKind>("event");

  // Item Details Modal state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState<CalendarDetailsItem | null>(null);

  // Month Grid Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const gridDates: { date: Date; isCurrentMonth: boolean }[] = [];

  // Padding days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    gridDates.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    gridDates.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  // Padding days from next month
  const remainingSlots = 42 - gridDates.length;
  for (let i = 1; i <= remainingSlots; i++) {
    gridDates.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Date comparison helper
  const isSameDay = (d1: Date, d2Str: string | null) => {
    if (!d2Str) return false;
    const d2 = new Date(d2Str);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isToday = (d: Date) => {
    const todayVal = new Date();
    return (
      d.getFullYear() === todayVal.getFullYear() &&
      d.getMonth() === todayVal.getMonth() &&
      d.getDate() === todayVal.getDate()
    );
  };

  // Format month name
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  // Sidebar Filtering (Chronological upcoming items)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const upcomingTasks = tasks
    .filter(t => t.due_at && new Date(t.due_at) >= todayStart && t.status !== "completed" && !t.is_archived)
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())
    .slice(0, 5);

  const upcomingReminders = reminders
    .filter(r => r.remind_at && new Date(r.remind_at) >= todayStart && r.status !== "completed")
    .sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime())
    .slice(0, 5);

  const activeGoals = goals
    .filter(g => !g.is_archived && g.status !== "completed")
    .sort((a, b) => {
      if (!a.target_at) return 1;
      if (!b.target_at) return -1;
      return new Date(a.target_at).getTime() - new Date(b.target_at).getTime();
    })
    .slice(0, 5);

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {/* Main Monthly Calendar Column */}
      <div className="space-y-4 lg:col-span-3">
        {/* Calendar Header with Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-text-primary capitalize min-w-[150px]">
              {monthName} {year}
            </h2>
            <div className="flex items-center gap-1 bg-surface-muted p-0.5 rounded-lg border border-border-default">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="p-1.5 rounded-md hover:bg-surface-active text-text-secondary transition-colors cursor-pointer border-0"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-1 text-xs font-semibold rounded-md hover:bg-surface-active text-text-primary transition-colors cursor-pointer border-0"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-1.5 rounded-md hover:bg-surface-active text-text-secondary transition-colors cursor-pointer border-0"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="text-xs text-text-muted hidden sm:block">
            Click empty day cells to Quick Add plans
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="overflow-hidden border border-border-subtle bg-surface shadow-sm">
          <CardContent className="p-0">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-border-subtle bg-surface-muted/50 text-center py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Monthly Calendar Grid Cells */}
            <div className="grid grid-cols-7 bg-border-subtle gap-[1px]">
              {gridDates.map(({ date, isCurrentMonth }, idx) => {
                const dayEvents = events.filter(e => isSameDay(date, e.starts_at));
                const dayTasks = tasks.filter(t => isSameDay(date, t.due_at) && !t.is_archived);
                const dayReminders = reminders.filter(r => isSameDay(date, r.remind_at));
                const dayGoals = goals.filter(g => isSameDay(date, g.target_at) && !g.is_archived);

                const hasToday = isToday(date);

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T12:00`;
                      setQuickAddDate(localDateStr);
                      setQuickAddKind("event");
                      setQuickAddOpen(true);
                    }}
                    className={`min-h-[110px] bg-surface p-1.5 flex flex-col gap-1 transition-colors group cursor-pointer ${
                      isCurrentMonth ? "hover:bg-surface-muted/30" : "bg-surface-muted/10 opacity-40 hover:opacity-75"
                    }`}
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-semibold flex items-center justify-center h-6 w-6 rounded-full transition-colors ${
                          hasToday
                            ? "bg-primary text-white font-bold"
                            : "text-text-primary"
                        }`}
                      >
                        {date.getDate() === 1 
                          ? `${date.toLocaleString("default", { month: "short" })} ${date.getDate()}`
                          : date.getDate()
                        }
                      </span>
                      
                      <span className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary transition-opacity text-xs pr-1">
                        +
                      </span>
                    </div>

                    {/* Day Content Area (list of pills) */}
                    <div className="flex-1 overflow-y-auto space-y-1 max-h-[80px] scrollbar-thin">
                      {/* Events */}
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailsItem({
                              id: event.id,
                              title: event.title,
                              type: "event",
                              date: event.starts_at,
                              original: event
                            });
                            setDetailsOpen(true);
                          }}
                          className="px-1.5 py-0.5 text-[10px] font-medium rounded border-l-2 bg-blue-950/40 border-blue-500 text-blue-300 truncate hover:bg-blue-900/60 transition-colors"
                          title={`Event: ${event.title}`}
                        >
                          {event.title}
                        </div>
                      ))}

                      {/* Tasks */}
                      {dayTasks.map(task => {
                        const isFocus = myDay.some(item => item.task_id === task.id);
                        return (
                          <div
                            key={task.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailsItem({
                                id: task.id,
                                title: task.title,
                                type: "task",
                                date: task.due_at,
                                original: task
                              });
                              setDetailsOpen(true);
                            }}
                            className={`px-1.5 py-0.5 text-[10px] font-medium rounded border-l-2 truncate hover:bg-emerald-900/60 transition-colors ${
                              task.status === "completed"
                                ? "bg-emerald-950/20 border-emerald-700/50 text-text-muted line-through"
                                : isFocus
                                ? "bg-emerald-900/50 border-emerald-400 text-emerald-200 ring-1 ring-emerald-500/30"
                                : "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                            }`}
                            title={`Task: ${task.title} (${task.status})${isFocus ? ' - Today Focus' : ''}`}
                          >
                            {isFocus ? "⭐ " : ""}{task.title}
                          </div>
                        );
                      })}

                      {/* Reminders */}
                      {dayReminders.map(reminder => (
                        <div
                          key={reminder.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailsItem({
                              id: reminder.id,
                              title: reminder.title,
                              type: "reminder",
                              date: reminder.remind_at,
                              original: reminder
                            });
                            setDetailsOpen(true);
                          }}
                          className={`px-1.5 py-0.5 text-[10px] font-medium rounded border-l-2 truncate hover:bg-amber-900/60 transition-colors ${
                            reminder.status === "completed"
                              ? "bg-amber-950/20 border-amber-700/50 text-text-muted line-through"
                              : "bg-amber-950/40 border-amber-500 text-amber-300"
                          }`}
                          title={`Reminder: ${reminder.title}`}
                        >
                          🔔 {reminder.title}
                        </div>
                      ))}

                      {/* Goals */}
                      {dayGoals.map(goal => (
                        <div
                          key={goal.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailsItem({
                              id: goal.id,
                              title: goal.title,
                              type: "goal",
                              date: goal.target_at,
                              original: goal
                            });
                            setDetailsOpen(true);
                          }}
                          className="px-1.5 py-0.5 text-[10px] font-medium rounded border-l-2 bg-purple-950/40 border-purple-500 text-purple-300 truncate hover:bg-purple-900/60 transition-colors"
                          title={`Goal: ${goal.title}`}
                        >
                          ✨ {goal.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Sidebar: Upcoming/Remaining Section */}
      <div className="space-y-4">
        <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
          <h2 className="text-base font-bold text-text-primary">
            Agenda & Remaining Plans
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Everything planned for the coming weeks
          </p>
        </div>

        {/* Tasks Remaining Card */}
        <Card className="border border-border-subtle bg-surface shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                Remaining Tasks
              </h3>
              <span className="text-[10px] bg-emerald-950/40 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                {tasks.filter(t => t.status !== "completed" && !t.is_archived).length} total
              </span>
            </div>
            
            {upcomingTasks.length ? (
              <ul className="space-y-2.5">
                {upcomingTasks.map(task => {
                  const isFocus = myDay.some(item => item.task_id === task.id);
                  return (
                    <li key={task.id} className="text-xs flex flex-col gap-0.5">
                      <span className="font-medium text-text-primary truncate flex items-center gap-1">
                        {isFocus && <span title="Today's Focus">⭐</span>}
                        {task.title}
                      </span>
                      <span className="text-[10px] text-text-muted">Due: {dateLabel(task.due_at)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-text-muted italic py-1">No upcoming scheduled tasks.</p>
            )}
          </CardContent>
        </Card>

        {/* Reminders Card */}
        <Card className="border border-border-subtle bg-surface shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                <BellIcon className="h-4 w-4 text-amber-500" />
                Active Reminders
              </h3>
              <span className="text-[10px] bg-amber-950/40 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                {reminders.filter(r => r.status !== "completed").length} active
              </span>
            </div>

            {upcomingReminders.length ? (
              <ul className="space-y-2.5">
                {upcomingReminders.map(reminder => (
                  <li key={reminder.id} className="text-xs flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="font-medium text-text-primary truncate">{reminder.title}</span>
                      <span className="text-[10px] text-text-muted">{dateLabel(reminder.remind_at)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateReminder(reminder.id, "completed")}
                      className="text-[10px] shrink-0 border border-border-default rounded px-1.5 py-0.5 hover:bg-surface-active text-text-secondary cursor-pointer"
                    >
                      Done
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-text-muted italic py-1">No active reminders.</p>
            )}
          </CardContent>
        </Card>

        {/* Goals Card */}
        <Card className="border border-border-subtle bg-surface shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                <SparklesIcon className="h-4 w-4 text-purple-500" />
                Upcoming Goals
              </h3>
              <span className="text-[10px] bg-purple-950/40 text-purple-300 px-1.5 py-0.5 rounded font-bold">
                {goals.filter(g => g.status !== "completed" && !g.is_archived).length} active
              </span>
            </div>

            {activeGoals.length ? (
              <ul className="space-y-2.5">
                {activeGoals.map(goal => (
                  <li key={goal.id} className="text-xs flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-text-primary truncate">{goal.title}</span>
                      <span className="text-[10px] text-text-muted font-semibold">{goal.progress_percent}%</span>
                    </div>
                    <div className="h-1 w-full bg-surface-active rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full" style={{ width: `${goal.progress_percent}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-text-muted italic py-1">No pending goals.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <RichProductivityDialog
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        initialKind={quickAddKind}
        defaultDate={quickAddDate}
        defaultMyDay={quickAddDate ? isToday(new Date(quickAddDate)) : false}
        lists={lists}
        tasks={tasks}
        events={events}
        onCreated={onCreated}
      />

      {/* ITEM DETAILS MODAL DIALOG */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={detailsItem ? `${detailsItem.type.toUpperCase()}: ${detailsItem.title}` : ""}
      >
        {detailsItem ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-surface-muted p-4 border border-border-default space-y-3">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Category</span>
                <span className="font-semibold text-text-primary capitalize bg-surface-active px-2 py-0.5 rounded border border-border-subtle">
                  {detailsItem.type}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Scheduled For</span>
                <span className="font-semibold text-text-primary">
                  {detailsItem.date ? dateLabel(detailsItem.date) : "No date"}
                </span>
              </div>

              {detailsItem.type === "task" && (
                <>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>Priority</span>
                    <span className="font-semibold text-text-primary capitalize">
                      {detailsItem.original.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>Status</span>
                    <span className="font-semibold text-text-primary capitalize">
                      {detailsItem.original.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>Today&apos;s Focus Status</span>
                    <span className={`font-semibold ${myDay.some(item => item.task_id === detailsItem.id) ? 'text-primary' : 'text-text-muted'}`}>
                      {myDay.some(item => item.task_id === detailsItem.id) ? '⭐ Pinned' : 'Not pinned'}
                    </span>
                  </div>
                </>
              )}

              {detailsItem.type === "reminder" && (
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>Status</span>
                  <span className="font-semibold text-text-primary capitalize">
                    {detailsItem.original.status}
                  </span>
                </div>
              )}

              {detailsItem.type === "goal" && (
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>Progress</span>
                  <span className="font-semibold text-text-primary">
                    {detailsItem.original.progress_percent}%
                  </span>
                </div>
              )}
            </div>

            <DialogActions className="justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hover:bg-danger-hover/10 text-danger hover:border-danger border-0 cursor-pointer"
                onClick={async () => {
                  if (detailsItem.type === "event") {
                    await onDeleteEvent(detailsItem.id);
                  } else if (detailsItem.type === "task") {
                    await onDeleteTask(detailsItem.id);
                  } else if (detailsItem.type === "reminder") {
                    await onDeleteReminder(detailsItem.id);
                  } else if (detailsItem.type === "goal") {
                    await onDeleteGoal(detailsItem.id);
                  }
                  setDetailsOpen(false);
                }}
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete Plan
              </Button>

              <div className="flex gap-2">
                {detailsItem.type === "task" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={async () => {
                      const isPinned = myDay.some(item => item.task_id === detailsItem.id);
                      await onToggleMyDay(detailsItem.original, isPinned);
                      setDetailsOpen(false);
                    }}
                  >
                    {myDay.some(item => item.task_id === detailsItem.id) ? "Remove Focus" : "Pin to Focus"}
                  </Button>
                )}
                {detailsItem.type === "task" && detailsItem.original.status !== "completed" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-success text-success hover:bg-success/10 cursor-pointer"
                    onClick={async () => {
                      await onUpdateTask(detailsItem.original, { status: "completed" });
                      setDetailsOpen(false);
                    }}
                  >
                    Mark Complete
                  </Button>
                )}
                {detailsItem.type === "reminder" && detailsItem.original.status !== "completed" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-success text-success hover:bg-success/10 cursor-pointer"
                    onClick={async () => {
                      await onUpdateReminder(detailsItem.id, "completed");
                      setDetailsOpen(false);
                    }}
                  >
                    Mark Done
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setDetailsOpen(false)}
                >
                  Close
                </Button>
              </div>
            </DialogActions>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

function RemindersView({ reminders, onUpdate }: { reminders: ProductivityReminder[]; onUpdate: (id: string, status: string) => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        {reminders.length ? (
          <ul className="divide-y divide-border-subtle">
            {reminders.map((reminder) => (
              <li key={reminder.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{reminder.title}</p>
                  <p className="text-xs text-text-muted">{dateLabel(reminder.remind_at)} · {reminder.status}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => onUpdate(reminder.id, reminder.status === "completed" ? "scheduled" : "completed")}>
                  {reminder.status === "completed" ? "Reopen" : "Complete"}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<CalendarIcon className="h-8 w-8" />} title="No active reminders" description="Add one above so time-sensitive work stays visible." />
        )}
      </CardContent>
    </Card>
  );
}

function GoalsView({ goals, onUpdate }: { goals: ProductivityGoal[]; onUpdate: (goal: ProductivityGoal, progress: number) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {goals.length ? (
        goals.map((goal) => (
          <Card key={goal.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex justify-between gap-3">
                <h2 className="font-semibold text-text-primary">{goal.title}</h2>
                <span className="text-xs text-text-muted">{goal.progress_percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-active">
                <div className="h-full bg-primary" style={{ width: `${goal.progress_percent}%` }} />
              </div>
              <label className="block text-xs text-text-muted">
                Progress
                <input aria-label={`Progress for ${goal.title}`} className="mt-1 w-full" type="range" min="0" max="100" value={goal.progress_percent} onChange={(event) => onUpdate(goal, Number(event.target.value))} />
              </label>
              <p className="text-xs text-text-muted">{goal.target_at ? `Target ${dateLabel(goal.target_at)}` : "No target date"}</p>
            </CardContent>
          </Card>
        ))
      ) : (
        <EmptyState icon={<CheckCircleIcon className="h-8 w-8" />} title="Set your first goal" description="Define an outcome to track your progress." />
      )}
    </div>
  );
}

function ArchiveView({ tasks, goals, lists, onTask, onGoal }: { tasks: ProductivityTask[]; goals: ProductivityGoal[]; lists: ProductivityList[]; onTask: (task: ProductivityTask, data: Partial<ProductivityTask>) => void; onGoal: (goal: ProductivityGoal) => void }) {
  return (
    <div className="space-y-3">
      {tasks.length ? (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border-subtle">
              {tasks.map((task) => <TaskRow key={task.id} task={task} lists={lists} onUpdate={onTask} />)}
            </ul>
          </CardContent>
        </Card>
      ) : null}
      {goals.map((goal) => (
        <Card key={goal.id}>
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm text-text-primary">{goal.title}</p>
            <Button size="sm" variant="outline" onClick={() => onGoal(goal)}>Restore</Button>
          </CardContent>
        </Card>
      ))}
      {!tasks.length && !goals.length ? (
        <EmptyState icon={<CheckCircleIcon className="h-8 w-8" />} title="Your archive is empty" description="Archived tasks and goals stay available here." />
      ) : null}
    </div>
  );
}

function SettingsView({ settings, setSettings, onSubmit, focusSessions, analytics, onFocus }: { settings: ProductivitySettings; setSettings: (value: ProductivitySettings) => void; onSubmit: (event: FormEvent) => void; focusSessions: FocusSession[]; analytics: ProductivityAnalytics | null; onFocus: () => void }) {
  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit}>
        <Card>
          <CardContent className="space-y-5 p-5">
            <label className="block text-sm text-text-secondary">Time zone<input value={settings.time_zone} onChange={(event) => setSettings({ ...settings, time_zone: event.target.value })} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-text-primary" /></label>
            <label className="block text-sm text-text-secondary">Focus duration (minutes)<input type="number" min="5" max="240" value={settings.focus_minutes} onChange={(event) => setSettings({ ...settings, focus_minutes: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-text-primary" /></label>
            {([['analytics_enabled', 'Enable productivity analytics'], ['browser_notifications_enabled', 'Allow browser notifications'], ['email_reminders_enabled', 'Send email reminders']] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 text-sm text-text-secondary"><input type="checkbox" checked={settings[key]} onChange={(event) => setSettings({ ...settings, [key]: event.target.checked })} />{label}</label>
            ))}
            <Button type="submit">Save settings</Button>
          </CardContent>
        </Card>
      </form>
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <h2 className="font-semibold text-text-primary">Focus session</h2>
            <p className="text-sm text-text-muted">Start a {settings.focus_minutes}-minute session. Recent: {focusSessions[0]?.status ?? "none"}.</p>
          </div>
          <Button onClick={onFocus}>Start focus</Button>
        </CardContent>
      </Card>
      {analytics ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-text-muted">Completed in 30 days</p>
              <p className="text-2xl font-semibold text-text-primary">{analytics.completed_tasks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-text-muted">Focused minutes</p>
              <p className="text-2xl font-semibold text-text-primary">{analytics.focus_minutes}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function TemplatesView({ templates, onUse, onDelete }: { templates: ProductivityTemplate[]; onUse: (template: ProductivityTemplate) => void; onDelete: (id: string) => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        {templates.length ? (
          <ul className="divide-y divide-border-subtle">
            {templates.map((template) => (
              <li key={template.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{template.name}</p>
                  <p className="text-xs capitalize text-text-muted">{template.kind} template</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => onUse(template)}>Use</Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(template.id)}>Delete</Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<CalendarIcon className="h-8 w-8" />} title="No templates yet" description="Save a task starter above to reuse it." />
        )}
      </CardContent>
    </Card>
  );
}
