"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users straight to the feed
    const token = localStorage.getItem("authToken");
    if (token) router.replace("/feed");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        {/* Logo mark */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
            <span className="text-zinc-950 font-bold text-sm">LD</span>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">LogoutDev</span>
        </div>

        <h1 className="text-2xl font-bold text-white">Where devs build in public.</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Share projects, follow builders, and get discovered for real work.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-950 hover:bg-zinc-100 transition-colors"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-zinc-700 px-4 py-3 text-center text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
