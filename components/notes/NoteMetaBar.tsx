"use client";

import { useEffect, useRef, useState } from "react";
import { XIcon } from "@/components/ui/Icons";

const EMOJI_OPTIONS = [
  "📝", "📄", "📌", "💡", "✅", "🚀", "🐛", "🔧",
  "📚", "🎯", "🗂️", "📊", "🧠", "⚡", "🔒", "🌐",
  "🧪", "📦", "🛠️", "🎨", "📅", "💬", "⭐", "🔥",
];

const COVER_COLORS = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#22d3ee", "#60a5fa", "#a78bfa", "#f472b6"];

function CoverPickerPopover({
  cover,
  onChangeCover,
  onClose,
}: {
  cover: string | null;
  onChangeCover: (color: string | null) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-border-default bg-surface p-3 shadow-2xl">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-disabled">Cover color</p>
      <div className="flex flex-wrap gap-2">
        {COVER_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => {
              onChangeCover(color);
              onClose();
            }}
            className={`h-7 w-7 rounded-full transition-transform hover:scale-105 ${
              cover === color ? "ring-2 ring-white ring-offset-2 ring-offset-app" : ""
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      {cover ? (
        <button
          onClick={() => {
            onChangeCover(null);
            onClose();
          }}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <XIcon className="h-3 w-3" /> Remove cover
        </button>
      ) : null}
    </div>
  );
}

interface NoteMetaBarProps {
  icon: string | null;
  cover: string | null;
  onChangeIcon: (icon: string | null) => void;
  onChangeCover: (cover: string | null) => void;
}

/** Icon picker + optional cover color banner, shown above the note title. */
export default function NoteMetaBar({ icon, cover, onChangeIcon, onChangeCover }: NoteMetaBarProps) {
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const iconRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (iconRef.current && !iconRef.current.contains(target)) setIconPickerOpen(false);
      if (coverRef.current && !coverRef.current.contains(target)) setCoverPickerOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div className="group/meta">
      {cover ? (
        <div className="relative -mx-4 mb-4 h-20 sm:-mx-6 sm:h-28" style={{ backgroundColor: cover }}>
          <div ref={coverRef} className="absolute bottom-2 right-2 sm:right-4">
            <button
              onClick={() => setCoverPickerOpen((value) => !value)}
              className="rounded-lg bg-black/30 px-2.5 py-1 text-xs font-medium text-text-primary backdrop-blur transition-colors hover:bg-black/50"
            >
              Change cover
            </button>
            {coverPickerOpen ? (
              <CoverPickerPopover cover={cover} onChangeCover={onChangeCover} onClose={() => setCoverPickerOpen(false)} />
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mb-1 flex items-center gap-3">
        <div className="relative" ref={iconRef}>
          <button
            onClick={() => setIconPickerOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-3xl transition-colors hover:bg-surface"
            aria-label="Change icon"
            title="Change icon"
          >
            {icon || <span className="text-lg text-zinc-700">+</span>}
          </button>
          {iconPickerOpen ? (
            <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-xl border border-border-default bg-surface p-2.5 shadow-2xl">
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onChangeIcon(emoji);
                      setIconPickerOpen(false);
                    }}
                    className="rounded-lg p-1.5 text-lg transition-colors hover:bg-surface-hover"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {icon ? (
                <button
                  onClick={() => {
                    onChangeIcon(null);
                    setIconPickerOpen(false);
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
                >
                  <XIcon className="h-3 w-3" /> Remove icon
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {!cover ? (
          <div className="relative" ref={coverRef}>
            <button
              onClick={() => setCoverPickerOpen((value) => !value)}
              className="text-xs font-medium text-text-disabled opacity-0 transition-opacity hover:text-text-secondary focus:opacity-100 group-hover/meta:opacity-100"
            >
              Add cover
            </button>
            {coverPickerOpen ? (
              <CoverPickerPopover cover={cover} onChangeCover={onChangeCover} onClose={() => setCoverPickerOpen(false)} />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
