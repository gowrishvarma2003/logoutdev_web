"use client";

import { useEffect, useRef, useState } from "react";
import { ShareIcon, CheckIcon, XIcon } from "@/components/ui/Icons";

interface ShareMenuProps {
  url: string;
  title: string;
  className?: string;
}

export default function ShareMenu({ url, title, className = "" }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const absoluteUrl = typeof window !== "undefined" && url.startsWith("/") ? `${window.location.origin}${url}` : url;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const nativeShare = async () => {
    if (hasNativeShare) {
      try {
        await navigator.share({ title, url: absoluteUrl });
      } catch {
        // user dismissed — no-op
      }
    } else {
      copy();
    }
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-strong text-sm font-medium text-text-secondary hover:border-zinc-500 hover:text-text-primary transition-colors"
        aria-label="Share profile"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <ShareIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 z-30 w-48 rounded-xl border border-border-default bg-app shadow-2xl shadow-black/60 overflow-hidden"
        >
          {hasNativeShare ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => { nativeShare(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover/80 transition-colors text-left"
            >
              <ShareIcon className="w-3.5 h-3.5 text-text-muted" />
              Share via…
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={() => { copy(); }}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover/80 transition-colors text-left"
          >
            {copied ? (
              <>
                <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Link copied</span>
              </>
            ) : (
              <>
                <XIcon className="w-3.5 h-3.5 text-text-muted rotate-45" />
                Copy link
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
