"use client";

import { CodeBracketIcon, DocumentTextIcon, ExternalLinkIcon, GitHubIcon, LinkIcon } from "@/components/ui/Icons";
import type { Launch } from "@/lib/types";

const SECONDARY_LINKS = [
  { key: "website_url", label: "Website", icon: LinkIcon, primary: false },
  { key: "github_url", label: "GitHub", icon: GitHubIcon, primary: false },
  { key: "docs_url", label: "Docs", icon: DocumentTextIcon, primary: false },
] as const;

function getLinkHost(value: string) {
  return value.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/.*$/, "");
}

export default function LaunchLinkBar({ launch }: { launch: Launch }) {
  const primaryHref = launch.launch_phase === "live"
    ? (launch.live_url || launch.demo_url || launch.website_url || null)
    : null;
  const availableLinks = [
    ...(primaryHref
      ? [{ key: "primary_live" as const, label: "Open product", icon: ExternalLinkIcon, primary: true, href: primaryHref }]
      : []),
    ...SECONDARY_LINKS
      .filter(({ key }) => Boolean(launch[key]))
      .map(({ key, label, icon, primary }) => ({ key, label, icon, primary, href: launch[key] as string })),
  ];

  if (availableLinks.length === 0) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-border-default bg-surface/50 px-3.5 py-2 text-sm text-text-disabled">
        <CodeBracketIcon className="h-4 w-4" />
        No external links added yet
      </div>
    );
  }

  return (
    <div className="grid gap-2.5">
      {availableLinks.map(({ key, label, icon: Icon, primary, href }) => {
        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer"
            className={`group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors ${
              primary
                ? "border-sky-500/25 bg-sky-500/10 text-sky-200 hover:bg-sky-500/14"
                : "border-border-strong bg-surface text-text-secondary hover:bg-surface-hover"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  primary
                    ? "bg-sky-500/12 text-sky-300 ring-1 ring-sky-500/20"
                    : "bg-app text-text-secondary ring-1 ring-border-strong"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{label}</p>
                <p className="truncate text-xs text-text-disabled">{getLinkHost(href)}</p>
              </div>
            </div>

            <ExternalLinkIcon className="h-4 w-4 shrink-0 text-text-disabled transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        );
      })}
    </div>
  );
}
