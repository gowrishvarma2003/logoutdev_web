"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { productivityMoreNavigation, productivityNavigation } from "./productivityNavigation";

export default function ProductivityShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-app">
      <header className="sticky top-0 z-sticky border-b border-border-subtle bg-app/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1480px] items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/productivity" className="shrink-0 text-sm font-semibold tracking-tight text-text-primary">
            Productivity Hub
          </Link>
          <nav aria-label="Productivity sections" className="no-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {productivityNavigation.map((item) => {
              const active = item.href === "/productivity"
                ? pathname === "/productivity"
                : pathname === item.href || (item.href !== "/notes" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/70 ${
                    active ? "bg-surface-active text-text-primary" : "text-text-muted hover:bg-surface-hover hover:text-text-primary"
                  }`}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            <details className="relative shrink-0">
              <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-hover hover:text-text-primary">More</summary>
              <div className="absolute right-0 z-dropdown mt-1 min-w-40 rounded-lg border border-border-default bg-surface-elevated p-1 shadow-dropdown">
                {productivityMoreNavigation.map((item) => <Link key={item.href} href={item.href} className="block rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary">{item.label}</Link>)}
              </div>
            </details>
          </nav>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[1480px]">
        <aside className="hidden w-56 shrink-0 border-r border-border-subtle px-3 py-5 lg:block">
          <nav aria-label="Productivity workspace" className="sticky top-[73px] space-y-1">
            {productivityNavigation.map((item) => {
              const active = item.href === "/productivity"
                ? pathname === "/productivity"
                : pathname === item.href || (item.href !== "/notes" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/70 ${
                    active ? "bg-surface-active text-text-primary shadow-sm" : "text-text-muted hover:bg-surface-hover hover:text-text-primary"
                  }`}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            <div className="my-2 border-t border-border-subtle" />
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase text-text-disabled">More</p>
            {productivityMoreNavigation.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-hover hover:text-text-primary">
                <span aria-hidden="true">{item.icon}</span>{item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
