import Link from "next/link";
import { cn } from "@/lib/utils";

export function Tabs({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <nav className={cn("flex gap-1 overflow-x-auto border-b border-border-subtle", className)} role="tablist">
      {children}
    </nav>
  );
}

export function TabLink({
  href,
  active,
  children,
  className,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors",
        active
          ? "border-primary text-text-primary"
          : "border-transparent text-text-muted hover:text-text-primary",
        className,
      )}
      role="tab"
      aria-selected={active}
    >
      {children}
    </Link>
  );
}
