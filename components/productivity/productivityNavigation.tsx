import type { ReactNode } from "react";
import {
  ArchiveBoxIcon,
  BellIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  DocumentTextIcon,
  HomeIcon,
  SparklesIcon,
} from "@/components/ui/Icons";

export type ProductivitySection =
  | "overview"
  | "tasks"
  | "calendar"
  | "notes"
  | "reminders"
  | "goals"
  | "templates"
  | "archive"
  | "settings";

export type ProductivityNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  section: ProductivitySection;
};

export const productivityNavigation: ProductivityNavItem[] = [
  { href: "/productivity", label: "Overview", icon: <HomeIcon />, section: "overview" },
  { href: "/productivity/tasks", label: "Tasks", icon: <CheckCircleIcon />, section: "tasks" },
  { href: "/productivity/calendar", label: "Calendar", icon: <CalendarIcon className="h-5 w-5" />, section: "calendar" },
  // Notes remains its established standalone workspace so old deep links and editor behavior stay intact.
  { href: "/notes", label: "Notes", icon: <DocumentTextIcon />, section: "notes" },
  { href: "/productivity/reminders", label: "Reminders", icon: <BellIcon />, section: "reminders" },
  { href: "/productivity/goals", label: "Goals", icon: <SparklesIcon className="h-5 w-5" />, section: "goals" },
  { href: "/productivity/templates", label: "Templates", icon: <DocumentTextIcon />, section: "templates" },
  { href: "/productivity/archive", label: "Archive", icon: <ArchiveBoxIcon className="h-5 w-5" />, section: "archive" },
  { href: "/productivity/settings", label: "Settings", icon: <CogIcon />, section: "settings" },
];

export const productivitySectionMeta: Record<Exclude<ProductivitySection, "notes">, {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}> = {
  overview: {
    title: "Overview",
    description: "A clear, personal view of the work that needs your attention.",
    emptyTitle: "Your workspace is ready",
    emptyDescription: "Tasks, reminders, events, and goals will appear here as you add them.",
  },
  tasks: {
    title: "Tasks",
    description: "Keep personal work, priorities, and project lists in one place.",
    emptyTitle: "No tasks yet",
    emptyDescription: "Create your first task to start organizing what comes next.",
  },
  calendar: {
    title: "Calendar",
    description: "See scheduled work, deadlines, reminders, and events together.",
    emptyTitle: "Nothing scheduled",
    emptyDescription: "Create an event or schedule a task to begin planning your time.",
  },
  reminders: {
    title: "Reminders",
    description: "Keep time-sensitive work visible when it matters.",
    emptyTitle: "No active reminders",
    emptyDescription: "Add a reminder to a task or create one for something you do not want to miss.",
  },
  goals: {
    title: "Goals",
    description: "Connect meaningful outcomes to the work that moves them forward.",
    emptyTitle: "Set your first goal",
    emptyDescription: "Define an outcome, then track the tasks and milestones that support it.",
  },
  templates: {
    title: "Templates",
    description: "Start recurring work with a consistent, reusable structure.",
    emptyTitle: "No templates yet",
    emptyDescription: "Save a task, note, or planning pattern as a template when it is ready to reuse.",
  },
  archive: {
    title: "Archive",
    description: "Review completed or archived productivity items without cluttering active work.",
    emptyTitle: "Your archive is empty",
    emptyDescription: "Archived tasks, events, reminders, and goals will remain available here.",
  },
  settings: {
    title: "Productivity settings",
    description: "Control your workspace preferences, scheduling defaults, and dashboard layout.",
    emptyTitle: "Personalize your workspace",
    emptyDescription: "Your productivity preferences will be available here as soon as you choose them.",
  },
};
