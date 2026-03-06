import AppShell from "@/components/layout/AppShell";

/**
 * Route group layout for all authenticated app routes.
 * Wraps with the protected AppShell (sidebar + 3-col layout + auth guard).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
