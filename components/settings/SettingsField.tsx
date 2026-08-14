/**
 * SettingsField - Consistent form field wrapper for settings
 * Handles label, hint text, error messages, and proper spacing
 * Supports both regular inputs and toggle inputs with ARIA labels
 */

interface SettingsFieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}

export default function SettingsField({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
}: SettingsFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="text-rose-400 ml-1" aria-label="required">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-zinc-600" id={`${htmlFor}-hint`}>{hint}</p>
      )}
      {error && (
        <p className="text-xs text-rose-400 flex items-center gap-1" id={`${htmlFor}-error`} role="alert">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// Predefined input styles for consistency
export const INPUT_CLASS = "w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export const TEXTAREA_CLASS = "w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed";

export const SELECT_CLASS = "w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
