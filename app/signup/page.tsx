"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkUsernameAvailability, firebaseLogin, sendEmailOtp, verifyEmailOtp } from "@/lib/api";
import { signupWithEmail, loginWithGoogle } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";

function mapFirebaseError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "An account with this email already exists. Please sign in instead.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password is too weak. Use at least 6 characters.";
      case "auth/operation-not-allowed":
        return "Email/password sign-up is currently disabled.";
      case "auth/network-request-failed":
        return "Network error. Please check your connection.";
      case "auth/popup-closed-by-user":
        return "Google sign-up was cancelled.";
      case "auth/popup-blocked":
        return "Pop-up was blocked by your browser. Please allow pop-ups and try again.";
      case "auth/cancelled-popup-request":
        return "Another sign-in attempt is in progress.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email using a different sign-in method. Please sign in instead.";
      default:
        return error.message || "Registration failed. Please try again.";
    }
  }
  return error instanceof Error ? error.message : "Registration failed. Please try again.";
}

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) router.replace("/feed");
  }, [router]);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const { available } = await checkUsernameAvailability(username);
      if (!available) throw new Error("This username is already taken.");
      if (!challengeToken) {
        const challenge = await sendEmailOtp(email, "signup");
        setChallengeToken(challenge.challenge_token);
        setErrorMessage("We sent a 6-digit verification code to your email.");
        return;
      }
      const { verification_token } = await verifyEmailOtp(email, "signup", otp, challengeToken);
      const idToken = await signupWithEmail(name, email, password);
      const data = await firebaseLogin(idToken, name, username, verification_token);
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      router.push("/feed");
    } catch (error) {
      setErrorMessage(mapFirebaseError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMessage("");
    setIsLoading(true);

    try {
      if (!name.trim() || !username.trim()) throw new Error("Enter your name and username before continuing with Google.");
      const { available } = await checkUsernameAvailability(username);
      if (!available) throw new Error("This username is already taken.");
      const idToken = await loginWithGoogle();
      const data = await firebaseLogin(idToken, name, username);
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      router.push("/feed");
    } catch (error) {
      setErrorMessage(mapFirebaseError(error));
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
            Build in public.<br />Collaborate with devs.<br />Get noticed.
          </p>
          <p className="mt-4 text-sm text-zinc-400">
            The developer platform that shows real skill, not resumes.
          </p>
        </div>
        <p className="text-xs text-zinc-600">&copy; {new Date().getFullYear()} LogoutDev</p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12 bg-zinc-950">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <span className="mb-8 block text-lg font-bold text-white lg:hidden">LogoutDev</span>

          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-zinc-500">Join thousands of developers building in public.</p>

          <form onSubmit={handleEmailSignup} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="John Doe"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-white/10 transition"
              />
            </div>

            {challengeToken ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="otp" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Email verification code</label>
                <input id="otp" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} required
                  placeholder="6-digit code"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500" />
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                required
                minLength={3}
                maxLength={50}
                placeholder="johndoe"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-white/10 transition"
              />
            </div>

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

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-white/10 transition"
              />
            </div>

            {errorMessage ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
                <span className="mt-0.5 text-rose-400">&#x26A0;</span>
                <p className="text-sm text-rose-400">{errorMessage}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Please wait..." : challengeToken ? "Verify and create account" : "Send verification code"}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-white hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
