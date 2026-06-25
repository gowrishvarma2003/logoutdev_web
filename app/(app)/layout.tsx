import AppShell from "@/components/layout/AppShell";
import { NotificationProvider } from "@/lib/hooks/useNotifications";

/**
 * Route group layout for all authenticated app routes.
 * Wraps with the protected AppShell (sidebar + 3-col layout + auth guard).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AppShell>{children}</AppShell>
    </NotificationProvider>
  );
}
