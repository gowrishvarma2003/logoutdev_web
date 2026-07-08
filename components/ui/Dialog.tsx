"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { cn } from "@/lib/utils";
import Button, { IconButton } from "./Button";
import { XIcon } from "./Icons";

export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  maxWidthClassName = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  maxWidthClassName?: string;
}) {
  const mounted = useIsClient();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      first?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        className={cn(
          "w-full rounded-2xl border border-border-default bg-surface-elevated p-6 text-text-primary shadow-modal",
          maxWidthClassName,
          className,
        )}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title ? <h2 className="ld-heading-2">{title}</h2> : null}
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton aria-label="Close dialog" onClick={onClose} className="-mr-2 -mt-2">
            <XIcon className="h-4 w-4" />
          </IconButton>
        </div>
        <div className={cn((title || description) && "mt-5")}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function DialogActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mt-6 flex justify-end gap-3", className)}>{children}</div>;
}

export { Button as DialogButton };
