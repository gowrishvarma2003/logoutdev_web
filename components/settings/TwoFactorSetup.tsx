"use client";
import { useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { ShieldCheckIcon, DocumentDuplicateIcon, CheckCircleIcon, ChevronRightIcon, ChevronLeftIcon, XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

export interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 1 | 2 | 3 | 4;

const MOCK_QR_CODE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23ffffff'/%3E%3Crect width='20' height='20' fill='%23000000'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23ffffff'/%3E%3Crect x='80' height='20' width='20' height='20' fill='%23000000'/%3E%3Crect x='90' y='10' width='10' height='10' fill='%23ffffff'/%3E%3Crect height='20' x='80' y='80' width='20' height='20' fill='%23000000'/%3E%3Crect x='90' y='90' width='10' height='10' fill='%23ffffff'/%3E%3C/svg%3E";
const MOCK_SECRET_KEY = "JBSWY3DPEBLW64TMMQ======";
const BACKUP_CODES = [
  "A8K9-2J5L-4M7N", "P3Q6-8R1S-2T9V", "W4X7-9Y2Z-3A5B", "C6D8-1E3F-4G6H",
  "I7J9-2K4L-5M7N", "O8P1-3Q5R-6S8T", "U2V4-6W8X-1Y3Z", "A5B7-9C2D-3E5F",
];

export default function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedAllCodes, setCopiedAllCodes] = useState(false);

  const handleVerifyCode = async () => {
    setVerificationError("");
    if (!/^\d{6}$/.test(verificationCode)) {
      setVerificationError("Please enter a valid 6-digit code");
      return;
    }
    setIsVerifying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (verificationCode === "123456") {
        setCurrentStep(3);
      } else {
        setVerificationError("Invalid code. Try 123456 for demo.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(MOCK_SECRET_KEY);
      setCopiedCode("secret");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyAllBackupCodes = async () => {
    try {
      const allCodes = BACKUP_CODES.join("\n");
      await navigator.clipboard.writeText(allCodes);
      setCopiedAllCodes(true);
      setTimeout(() => setCopiedAllCodes(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownloadBackupCodes = () => {
    const content = BACKUP_CODES.join("\n");
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
    element.setAttribute("download", "2fa-backup-codes.txt");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleComplete = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onComplete();
    } catch (err) {
      console.error("Failed to complete 2FA setup:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ShieldCheckIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Set Up 2FA</h2>
              <p className="text-xs text-zinc-500">Step {currentStep} of 4</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        <div className="h-1 bg-zinc-800 flex gap-0.5 px-6 py-3">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className={`flex-1 h-1 rounded-full transition-all ${step <= currentStep ? "bg-blue-500" : "bg-zinc-700"}`} />
          ))}
        </div>
        <div className="p-6 space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Scan QR Code</h3>
              <p className="text-sm text-zinc-400">Use an authenticator app to scan this QR code.</p>
              <div className="flex justify-center p-6 bg-zinc-800 rounded-xl border border-zinc-700">
                <img src={MOCK_QR_CODE_URL} alt="2FA QR Code" className="w-32 h-32" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Or enter this code manually</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-zinc-800 rounded-lg border border-zinc-700">
                    <code className="text-sm text-white font-mono tracking-wider">{MOCK_SECRET_KEY}</code>
                  </div>
                  <button onClick={handleCopySecret} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                    {copiedCode === "secret" ? <CheckCircleIcon className="w-5 h-5 text-emerald-400" /> : <DocumentDuplicateIcon className="w-5 h-5 text-zinc-400" />}
                  </button>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">💡 Save this key safely for account recovery.</p>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Verify Your Code</h3>
              <p className="text-sm text-zinc-400">Enter the 6-digit code from your authenticator app.</p>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setVerificationCode(value);
                    setVerificationError("");
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-center text-2xl tracking-widest placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              {verificationError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg"><p className="text-sm text-rose-400">{verificationError}</p></div>}
              <p className="text-xs text-zinc-500">Demo hint: Use code <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">123456</code></p>
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Save Backup Codes</h3>
              <p className="text-sm text-zinc-400">Each code can be used once to regain access if you lose your authenticator.</p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {BACKUP_CODES.map((code, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                    <code className="text-sm font-mono text-white">{code}</code>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleCopyAllBackupCodes} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-sm font-medium text-white">
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  {copiedAllCodes ? "Copied!" : "Copy All"}
                </button>
                <button onClick={handleDownloadBackupCodes} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors text-sm font-medium text-white">
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Download
                </button>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-xs text-amber-300">⚠️ Store codes securely. Losing both your authenticator and codes will lock you out.</p>
              </div>
            </div>
          )}
          {currentStep === 4 && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="p-4 bg-emerald-500/10 rounded-full">
                  <CheckCircleIcon className="w-12 h-12 text-emerald-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">2FA Enabled!</h3>
                <p className="text-sm text-zinc-400">Two-factor authentication is now active on your account.</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 p-6 border-t border-zinc-800 bg-zinc-900/50">
          {currentStep < 4 && <button onClick={onCancel} className="flex-1 px-4 py-2 text-white font-medium rounded-lg border border-zinc-700 hover:bg-zinc-800 transition-colors text-sm">Cancel</button>}
          {currentStep > 1 && currentStep < 4 && <button onClick={() => setCurrentStep((currentStep - 1) as Step)} className="flex items-center justify-center gap-2 px-4 py-2 text-white font-medium rounded-lg border border-zinc-700 hover:bg-zinc-800 transition-colors text-sm"><ChevronLeftIcon className="w-4 h-4" />Back</button>}
          {currentStep === 1 && <button onClick={() => setCurrentStep(2)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm">Continue<ChevronRightIcon className="w-4 h-4" /></button>}
          {currentStep === 2 && <button onClick={handleVerifyCode} disabled={isVerifying || verificationCode.length !== 6} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">{isVerifying ? <><Spinner size="sm" />Verifying...</> : <>Verify<ChevronRightIcon className="w-4 h-4" /></>}</button>}
          {currentStep === 3 && <button onClick={() => setCurrentStep(4)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm">II&rsquo;ve Savedrsquo;ve Saved My Codes<ChevronRightIcon className="w-4 h-4" /></button>}
          {currentStep === 4 && <button onClick={handleComplete} className="flex-1 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors text-sm">Done</button>}
        </div>
      </div>
    </div>
  );
}
