"use client";

import { createPortal } from "react-dom";
import { useEffect } from "react";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { cn } from "@/lib/utils";

export default function Drawer({
  open,
  onClose,
  side = "left",
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right" | "bottom";
  children: React.ReactNode;
  className?: string;
}) {
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

  const sideClass =
    side === "bottom"
      ? "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl"
      : side === "right"
        ? "inset-y-0 right-0 h-full w-full max-w-sm"
        : "inset-y-0 left-0 h-full w-full max-w-sm";

  return createPortal(
    <div className="fixed inset-0 z-drawer bg-black/60 backdrop-blur-sm" onMouseDown={onClose}>
      <aside
        className={cn(
          "fixed overflow-y-auto border-border-default bg-surface-elevated shadow-dropdown",
          side === "bottom" ? "border-t" : side === "right" ? "border-l" : "border-r",
          sideClass,
          className,
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </aside>
    </div>,
    document.body,
  );
}
