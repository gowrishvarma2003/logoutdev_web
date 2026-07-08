"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, checkUsernameAvailability, firebaseLogin, loginUser } from "@/lib/api";
import { loginWithGoogle, signOutFirebase } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

function mapFirebaseError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Invalid email or password.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/user-disabled":
        return "This account has been disabled.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Please check your connection.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was cancelled.";
      case "auth/popup-blocked":
        return "Pop-up was blocked by your browser. Please allow pop-ups and try again.";
      case "auth/cancelled-popup-request":
        return "Another sign-in attempt is in progress.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email using a different sign-in method.";
      default:
        return error.message || "Authentication failed. Please try again.";
    }
  }
  return error instanceof Error ? error.message : "Authentication failed. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) router.replace("/feed");
  }, [router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleName, setGoogleName] = useState("");
  const [googleUsername, setGoogleUsername] = useState("");
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);
  const [pendingGoogleEmail, setPendingGoogleEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isCompletingGoogleProfile = Boolean(pendingGoogleToken);

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const data = await loginUser(email, password);
      await signOutFirebase();
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      router.push("/feed");
    } catch (error) {
      await signOutFirebase();
      setErrorMessage(mapFirebaseError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setIsLoading(true);
    let idToken = "";

    try {
      idToken = await loginWithGoogle();
      const data = await firebaseLogin(idToken);
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      router.push("/feed");
    } catch (error) {
      if (error instanceof ApiError && error.code === "PROFILE_REQUIRED" && idToken) {
        setPendingGoogleToken(idToken);
        setPendingGoogleEmail(typeof error.data.email === "string" ? error.data.email : "");
        setErrorMessage("");
      } else {
        await signOutFirebase();
        setErrorMessage(mapFirebaseError(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleProfileComplete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingGoogleToken) return;
    setErrorMessage("");
    setIsLoading(true);

    try {
      const { available } = await checkUsernameAvailability(googleUsername);
      if (!available) throw new Error("This username is already taken.");
      const data = await firebaseLogin(pendingGoogleToken, googleName, googleUsername);
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
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-surface border-r border-border-subtle p-12">
        <img src="/logo.jpeg" alt="LogoutDev" className="h-10 w-10 rounded-full object-cover" />
        <div>
          <p className="text-3xl font-semibold text-text-primary leading-snug">
            Where developers build<br />in public and get hired<br />for real work.
          </p>
          <p className="mt-4 text-sm text-text-muted">
            Projects. Collaboration. Discovery.
          </p>
        </div>
        <p className="text-xs text-text-disabled">&copy; {new Date().getFullYear()} LogoutDev</p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12 bg-app">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <img src="/logo.jpeg" alt="LogoutDev" className="mb-8 h-8 w-8 rounded-full object-cover lg:hidden" />

          {isCompletingGoogleProfile ? (
            <>
              <h1 className="text-2xl font-bold text-text-primary">Complete your profile</h1>
              <p className="mt-1 text-sm text-text-muted">
                {pendingGoogleEmail || "Your Google email"} is verified.
              </p>

              <form onSubmit={handleGoogleProfileComplete} className="mt-8 flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="google-name" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Full name
                  </label>
                  <input
                    id="google-name"
                    type="text"
                    value={googleName}
                    onChange={(event) => setGoogleName(event.target.value)}
                    required
                    placeholder="John Doe"
                    className="ld-input ld-field px-4"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="google-username" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Username
                  </label>
                  <input
                    id="google-username"
                    type="text"
                    value={googleUsername}
                    onChange={(event) => setGoogleUsername(event.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                    required
                    minLength={3}
                    maxLength={50}
                    placeholder="johndoe"
                    className="ld-input ld-field px-4"
                  />
                </div>

                {errorMessage ? (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3">
                    <span className="mt-0.5 text-danger">&#x26A0;</span>
                    <p className="text-sm text-danger">{errorMessage}</p>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full ld-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating account..." : "Complete Google signup"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
              <p className="mt-1 text-sm text-text-muted">Sign in to your account to continue.</p>

              <form onSubmit={handleEmailLogin} className="mt-8 flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="you@example.com"
                    className="ld-input ld-field px-4 focus:ring-2 focus:ring-white/10 transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-border-default bg-surface pl-4 pr-10 py-3 text-sm text-text-primary outline-none placeholder:text-text-disabled focus:border-border-strong focus:ring-2 focus:ring-focus/35 focus:ring-2 focus:ring-white/10 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {errorMessage ? (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3">
                    <span className="mt-0.5 text-danger">&#x26A0;</span>
                    <p className="text-sm text-danger">{errorMessage}</p>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full ld-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>

                <div className="text-right">
                  <Link href="/reset-password" className="text-xs text-text-muted hover:text-text-primary transition">
                    Forgot password?
                  </Link>
                </div>
              </form>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-surface-hover" />
                <span className="text-xs text-text-disabled">or</span>
                <div className="flex-1 h-px bg-surface-hover" />
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl border border-border-default bg-surface px-4 py-3 text-sm font-medium text-text-primary transition hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <p className="mt-6 text-center text-sm text-text-muted">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-semibold text-text-primary hover:underline">
                  Create one
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
