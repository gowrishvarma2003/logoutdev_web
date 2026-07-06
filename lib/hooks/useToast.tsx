"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type ToastTone = "default" | "success" | "error";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  action?: ToastAction;
}

interface ToastOptions {
  description?: string;
  tone?: ToastTone;
  action?: ToastAction;
  durationMs?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (title: string, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let idCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (title: string, options: ToastOptions = {}) => {
      idCounter += 1;
      const id = `toast-${Date.now()}-${idCounter}`;
      const toast: ToastItem = {
        id,
        title,
        description: options.description,
        tone: options.tone || "default",
        action: options.action,
      };
      setToasts((current) => [...current, toast]);

      const duration = options.durationMs ?? (options.tone === "error" ? 6000 : 3500);
      if (duration > 0) {
        const timer = setTimeout(() => dismissToast(id), duration);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
