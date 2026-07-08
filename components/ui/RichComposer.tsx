"use client";

import {
  forwardRef,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
} from "react";
import { buildRichTextHtml } from "@/lib/richText";

export interface RichComposerHandle {
  focus: () => void;
  setSelectionRange: (start: number, end: number) => void;
  adjustHeight: (maxHeight?: number) => void;
  resetHeight: () => void;
  getElement: () => HTMLTextAreaElement | null;
}

interface RichComposerProps {
  value: string;
  onChange: (value: string, caret: number) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onClick?: () => void;
  onKeyUp?: () => void;
  onScroll?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
  previewClassName?: string;
  containerClassName?: string;
  showPlaceholderWhenEmpty?: boolean;
  clickablePreview?: boolean;
  overlay?: ReactNode;
}

const RichComposer = forwardRef<RichComposerHandle, RichComposerProps>(function RichComposer(
  {
    value,
    onChange,
    onKeyDown,
    onClick,
    onKeyUp,
    onScroll,
    onFocus,
    placeholder,
    rows = 3,
    maxLength,
    className = "",
    previewClassName = "",
    containerClassName = "",
    showPlaceholderWhenEmpty = true,
    clickablePreview = false,
    overlay,
  },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const placeholderId = useId();

  function syncPreviewScroll() {
    if (!previewRef.current || !textareaRef.current) return;
    previewRef.current.scrollTop = textareaRef.current.scrollTop;
    previewRef.current.scrollLeft = textareaRef.current.scrollLeft;
  }

  function adjustHeight(maxHeight?: number) {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = maxHeight ? Math.min(el.scrollHeight, maxHeight) : el.scrollHeight;
    el.style.height = `${nextHeight}px`;
    syncPreviewScroll();
  }

  function resetHeight() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    syncPreviewScroll();
  }

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    setSelectionRange: (start: number, end: number) => textareaRef.current?.setSelectionRange(start, end),
    adjustHeight,
    resetHeight,
    getElement: () => textareaRef.current,
  }));

  useEffect(() => {
    syncPreviewScroll();
  }, [value]);

  return (
    <div className={`relative ${containerClassName}`}>
      <div
        ref={previewRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words ${previewClassName}`}
        dangerouslySetInnerHTML={{
          __html: value ? buildRichTextHtml(value, clickablePreview) : "",
        }}
      />

      {showPlaceholderWhenEmpty && !value && placeholder && (
        <div
          id={placeholderId}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 whitespace-pre-wrap break-words text-text-disabled ${previewClassName}`}
        >
          {placeholder}
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value, e.target.selectionStart ?? e.target.value.length)}
        onKeyDown={onKeyDown}
        onClick={onClick}
        onKeyUp={onKeyUp}
        onScroll={() => {
          syncPreviewScroll();
          onScroll?.();
        }}
        onFocus={onFocus}
        placeholder={showPlaceholderWhenEmpty ? undefined : placeholder}
        aria-describedby={showPlaceholderWhenEmpty && !value && placeholder ? placeholderId : undefined}
        maxLength={maxLength}
        rows={rows}
        className={`relative z-[1] ${className}`}
        style={{
          caretColor: "#ffffff",
          WebkitTextFillColor: "transparent",
          background: "transparent",
        }}
      />

      {overlay}
    </div>
  );
});

export default RichComposer;
