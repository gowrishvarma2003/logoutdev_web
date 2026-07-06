"use client";

import { useEffect, useRef } from "react";

interface NoteTitleInputProps {
  value: string;
  onChange: (value: string) => void;
  onEnterPress?: () => void;
  placeholder?: string;
}

/** Auto-growing, single-field title input that behaves like a large heading. */
export default function NoteTitleInput({ value, onChange, onEnterPress, placeholder = "Untitled" }: NoteTitleInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onEnterPress?.();
        }
      }}
      placeholder={placeholder}
      aria-label="Note title"
      rows={1}
      maxLength={200}
      className="w-full resize-none overflow-hidden bg-transparent text-2xl font-bold leading-tight text-white outline-none placeholder:text-zinc-700 sm:text-3xl"
    />
  );
}
