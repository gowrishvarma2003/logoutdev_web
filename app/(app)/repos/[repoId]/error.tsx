"use client";

export default function RepoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="rounded-2xl bg-zinc-800/40 p-4">
        <svg className="h-10 w-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">Repository error</h2>
        <p className="mt-1 max-w-sm text-sm text-zinc-400">
          {error.message || "Could not load this repository."}
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
      >
        Try again
      </button>
    </div>
  );
}
