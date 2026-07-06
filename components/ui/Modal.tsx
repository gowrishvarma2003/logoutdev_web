"use client";

import { createPortal } from "react-dom";
import { useEffect } from "react";
import { useIsClient } from "@/lib/hooks/useIsClient";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidthClassName?: string;
}

/**
 * Minimal, reusable centered dialog shell matching the app's existing
 * portal-based confirmation modal style (see Sidebar/MobileNav logout modals).
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidthClassName = "max-w-sm",
}: ModalProps) {
  const mounted = useIsClient();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${maxWidthClassName} rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <h3 className="text-lg font-bold text-white">{title}</h3>
        ) : null}
        {description ? (
          <p className="mt-1.5 text-sm text-zinc-400">{description}</p>
        ) : null}
        <div className={title || description ? "mt-5" : ""}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
