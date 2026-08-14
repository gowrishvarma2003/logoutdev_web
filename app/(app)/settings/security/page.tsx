"use client";
import { useState } from "react";
import TwoFactorSetup from "@/components/settings/TwoFactorSetup";
import Spinner from "@/components/ui/Spinner";
import { ShieldCheckIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "fair" | "good" | "strong">("weak");
  const [validation, setValidation] = useState({ minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSpecialChar: false });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);

  const calculatePasswordStrength = (password: string) => {
    const checks = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
    setValidation(checks);
    const score = Object.values(checks).filter(Boolean).length;
    if (score <= 2) return "weak";
    if (score === 3) return "fair";
    if (score === 4) return "good";
    return "strong";
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    if (!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword || !Object.values(validation).every(Boolean)) {
      setError("Please check all requirements");
      setSaving(false);
      return;
    }
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleTwoFactorComplete = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTwoFactorEnabled(true);
      setShowTwoFactorSetup(false);
      setSuccess("Two-factor authentication has been enabled!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable 2FA");
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!confirm("Disable 2FA?")) return;
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTwoFactorEnabled(false);
      setSuccess("2FA has been disabled");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable 2FA");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Security Settings</h2>
        <p className="text-sm text-zinc-400">Manage your password, authentication, and security preferences</p>
      </div>

      <SettingsSection
        title="Two-Factor Authentication"
        description={twoFactorEnabled ? "Your account is protected with 2FA" : "Add an extra layer of security to your account"}
        icon={twoFactorEnabled ? <ShieldCheckIcon className="w-5 h-5 text-emerald-400" /> : <ShieldExclamationIcon className="w-5 h-5" />}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              Status: {" "}
              {twoFactorEnabled ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-medium text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Enabled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-500/15 border border-zinc-500/30 text-xs font-medium text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                  Not Set Up
                </span>
              )}
            </p>
            <p className="text-xs text-zinc-500 mt-1">{twoFactorEnabled ? "You'll need a code from your authenticator app when signing in" : "Require a verification code in addition to your password"}</p>
          </div>
          {twoFactorEnabled ? (
            <button onClick={handleDisableTwoFactor} className="px-4 py-2 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors">Disable 2FA</button>
          ) : (
            <button onClick={() => setShowTwoFactorSetup(true)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Enable 2FA</button>
          )}
        </div>
      </SettingsSection>

      <form onSubmit={handlePasswordChange}>
        <SettingsSection title="Change Password" description="Update your password to keep your account secure" icon={<ShieldCheckIcon className="w-5 h-5" />}>
          <SettingsField label="Current Password"><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors" placeholder="••••••••" required /></SettingsField>
          <SettingsField label="New Password">
            <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPasswordStrength(calculatePasswordStrength(e.target.value)); }} className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors" placeholder="••••••••" required />
            {newPassword && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Password strength:</span>
                  <span className={`font-medium capitalize ${passwordStrength === "weak" ? "text-rose-400" : passwordStrength === "fair" ? "text-orange-400" : passwordStrength === "good" ? "text-yellow-400" : "text-emerald-400"}`}>{passwordStrength}</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${passwordStrength === "weak" ? "bg-rose-500 w-1/4" : passwordStrength === "fair" ? "bg-orange-500 w-2/4" : passwordStrength === "good" ? "bg-yellow-500 w-3/4" : "bg-emerald-500 w-full"}`} />
                </div>
              </div>
            )}
          </SettingsField>
          <SettingsField label="Confirm New Password"><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors" placeholder="••••••••" required /></SettingsField>
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <h3 className="text-sm font-medium text-white mb-3">Password Requirements</h3>
            <div className="space-y-2">
              <RequirementItem met={validation.minLength} text="At least 8 characters" />
              <RequirementItem met={validation.hasUppercase} text="Contains uppercase letter (A-Z)" />
              <RequirementItem met={validation.hasLowercase} text="Contains lowercase letter (a-z)" />
              <RequirementItem met={validation.hasNumber} text="Contains number (0-9)" />
              <RequirementItem met={validation.hasSpecialChar} text="Contains special character (!@#$%^&*)" />
            </div>
          </div>
        </SettingsSection>

        {success && <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex items-center gap-2"><svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg><p className="text-sm text-emerald-400">{success}</p></div>}
        {error && <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3"><p className="text-sm text-rose-400">{error}</p></div>}

        <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">{saving ? <><Spinner size="sm" />Updating...</> : "Change Password"}</button>
      </form>

      {showTwoFactorSetup && <TwoFactorSetup onComplete={handleTwoFactorComplete} onCancel={() => setShowTwoFactorSetup(false)} />}
    </div>
  );
}

interface SettingsSectionProps { title: string; description?: string; children: React.ReactNode; icon?: React.ReactNode; }

function SettingsSection({ title, description, children, icon }: SettingsSectionProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          {icon && <span className="text-zinc-400">{icon}</span>}
          <h2 className="text-base font-semibold text-white">{title}</h2>
        </div>
        {description && <p className="text-sm text-zinc-500 mt-1">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

interface SettingsFieldProps { label: string; hint?: string; children: React.ReactNode; }

function SettingsField({ label, hint, children }: SettingsFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

interface RequirementItemProps { met: boolean; text: string; }

function RequirementItem({ met, text }: RequirementItemProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
      ) : (
        <svg className="w-4 h-4 text-zinc-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
      )}
      <span className={met ? "text-emerald-400" : "text-zinc-500"}>{text}</span>
    </div>
  );
}
