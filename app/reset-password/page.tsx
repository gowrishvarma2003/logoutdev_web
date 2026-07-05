"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword, sendEmailOtp, verifyEmailOtp } from "@/lib/api";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function ResetPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) router.replace("/feed");
  }, [router]);

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
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
        setSuccessMessage(challenge.message || "Verification code sent.");
        return;
      }
      if (!verificationToken) {
        const { verification_token } = await verifyEmailOtp(email, "password_reset", otp, challengeToken);
        setVerificationToken(verification_token);
        setSuccessMessage("Email verified successfully. You can now reset your password.");
        return;
      }
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }
      const data = await resetPassword(email, newPassword, verificationToken);
      setSuccessMessage(data.message || "Password reset successfully.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to connect to server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setChallengeToken(null);
    setVerificationToken(null);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <main className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-900 p-12">
        <img src="/logo.jpeg" alt="LogoutDev" className="h-10 w-10 rounded-full object-cover" />
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
          <img src="/logo.jpeg" alt="LogoutDev" className="mb-8 h-8 w-8 rounded-full object-cover lg:hidden" />

          <h1 className="text-2xl font-bold text-white">Reset password</h1>
          
          <p className="mt-1 text-sm text-zinc-500">
            {verificationToken
              ? "Set a secure new password for your account."
              : challengeToken
              ? "Verify your email with the 6-digit code."
              : "Enter your email address to verify your account."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            {!verificationToken ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Email address
                    </label>
                    {challengeToken && (
                      <button
                        type="button"
                        onClick={handleStartOver}
                        className="text-xs font-semibold text-zinc-400 hover:text-white transition"
                      >
                        Change Email
                      </button>
                    )}
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={Boolean(challengeToken)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-4 pr-10 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-white/10 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-4 pr-10 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-white/10 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

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
              {isLoading
                ? "Please wait..."
                : verificationToken
                ? "Reset password"
                : challengeToken
                ? "Verify code"
                : "Send verification code"}
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
