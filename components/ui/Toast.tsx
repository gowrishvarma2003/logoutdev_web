"use client";

import { createPortal } from "react-dom";
import { useToast } from "@/lib/hooks/useToast";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { CheckCircleIcon, XCircleIcon, XIcon } from "@/components/ui/Icons";

const TONE_STYLES = {
  default: { icon: null, ring: "border-zinc-700" },
  success: {
    icon: <CheckCircleIcon className="h-5 w-5 text-emerald-400" />,
    ring: "border-emerald-500/30",
  },
  error: {
    icon: <XCircleIcon className="h-5 w-5 text-rose-400" />,
    ring: "border-rose-500/30",
  },
} as const;

export default function ToastViewport() {
  const { toasts, dismissToast } = useToast();
  const mounted = useIsClient();

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-200 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:right-6 sm:left-auto sm:px-0">
      {toasts.map((toast) => {
        const tone = TONE_STYLES[toast.tone];
        return (
          <div
            key={toast.id}
            role="status"
            className={`animate-chat-fade-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border ${tone.ring} bg-zinc-900 p-3.5 shadow-2xl shadow-black/40`}
          >
            {tone.icon ? (
              <span className="mt-0.5 shrink-0">{tone.icon}</span>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-xs text-zinc-400">
                  {toast.description}
                </p>
              ) : null}
              {toast.action ? (
                <button
                  onClick={() => {
                    toast.action?.onClick();
                    dismissToast(toast.id);
                  }}
                  className="mt-2 text-xs font-semibold text-sky-400 hover:text-sky-300"
                >
                  {toast.action.label}
                </button>
              ) : null}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 rounded-full p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
              aria-label="Dismiss"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
