"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "@/components/ui/Icons";

/** Debounced search input that drives the `q` param for the notes list. */
export default function NoteSearch() {
  const searchParams = useSearchParams();
  const queryValue = searchParams.get("q") || "";

  return <NoteSearchInput key={queryValue} initialValue={queryValue} />;
}

function NoteSearchInput({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function navigate(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.trim()) params.set("q", next.trim());
    else params.delete("q");
    const qs = params.toString();
    router.push(qs ? `/notes?${qs}` : "/notes");
  }

  function handleChange(next: string) {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate(next), 350);
  }

  function handleClear() {
    setValue("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    navigate("");
  }

  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Search notes…"
        aria-label="Search notes"
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-8 text-sm text-white outline-none transition-colors focus:border-zinc-700"
      />
      {value ? (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
