/**
 * SkipLink - Keyboard navigation skip links
 * Provides accessible shortcuts to main content and navigation
 * Only visible on focus to keep UI clean
 */

import Link from "next/link";

interface SkipLinkProps {
  href: string;
  label: string;
  className?: string;
}

function SkipLinkItem({ href, label, className }: SkipLinkProps) {
  return (
    <Link
      href={href}
      className={`
        absolute left-0 top-0 z-50 
        px-4 py-2 rounded-b-lg
        bg-sky-500 text-white text-sm font-medium
        -translate-y-12 focus:translate-y-0
        transition-transform duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500
        ${className || ""}
      `}
    >
      {label}
    </Link>
  );
}

export default function SkipLinks() {
  return (
    <>
      <SkipLinkItem href="#main-content" label="Skip to main content" />
      <SkipLinkItem href="#main-nav" label="Skip to navigation" />
    </>
  );
}

export { SkipLinkItem };
