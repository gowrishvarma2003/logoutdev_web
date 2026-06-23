"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword, sendEmailOtp, verifyEmailOtp } from "@/lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) router.replace("/feed");
  }, [router]);

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      if (!challengeToken) {
        const challenge = await sendEmailOtp(email, "password_reset");
        setChallengeToken(challenge.challenge_token);
        setSuccessMessage(challenge.message);
        return;
      }
      const { verification_token } = await verifyEmailOtp(email, "password_reset", otp, challengeToken);
      const data = await resetPassword(email, newPassword, verification_token);
      setSuccessMessage(data.message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to connect to server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-900 p-12">
        <span className="text-xl font-bold text-white tracking-tight">LogoutDev</span>
        <div>
          <p className="text-3xl font-semibold text-white leading-snug">
            Where developers build<br />in public and get hired<br />for real work.
          </p>
          <p className="mt-4 text-sm text-zinc-400">
            Projects. Collaboration. Discovery.
          </p>
        </div>
        <p className="text-xs text-zinc-600">© {new Date().getFullYear()} LogoutDev</p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12 bg-zinc-950">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <span className="mb-8 block text-lg font-bold text-white lg:hidden">LogoutDev</span>

          <h1 className="text-2xl font-bold text-white">Reset password</h1>
          <p className="mt-1 text-sm text-zinc-500">Enter your email and a new password.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-white/10 transition"
              />
            </div>

            {challengeToken ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="otp" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Verification code</label>
                <input id="otp" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} required placeholder="6-digit code"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500" />
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-white/10 transition"
              />
            </div>

            {errorMessage ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
                <span className="mt-0.5 text-rose-400">&#x26A0;</span>
                <p className="text-sm text-rose-400">{errorMessage}</p>
              </div>
            ) : null}

            {successMessage ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                <p className="text-sm text-emerald-400">{successMessage}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Please wait..." : challengeToken ? "Verify and reset password" : "Send verification code"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            <Link href="/login" className="font-semibold text-white hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
