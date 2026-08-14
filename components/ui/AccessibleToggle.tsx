/**
 * AccessibleToggle - WCAG compliant toggle switch
 * Implements proper ARIA attributes and keyboard support
 */

import { useState, useRef, useEffect } from "react";

interface AccessibleToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export default function AccessibleToggle({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  ariaLabel,
}: AccessibleToggleProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Support Space and Enter to toggle
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col gap-1">
        {/* Checkbox input (visually hidden but still functional) */}
        <input
          ref={inputRef}
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          aria-label={ariaLabel || label}
          aria-describedby={description ? `${id}-description` : undefined}
          className="sr-only"
        />

        {/* Custom toggle button styled to look like a switch */}
        <label
          htmlFor={id}
          className={`
            relative inline-flex items-center w-11 h-6 rounded-full cursor-pointer
            transition-colors duration-200
            focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${
              checked
                ? "bg-sky-600 hover:bg-sky-700"
                : "bg-zinc-700 hover:bg-zinc-600"
            }
          `}
        >
          {/* Sliding dot */}
          <div
            className={`
              inline-block w-5 h-5 transform rounded-full
              bg-white shadow-lg
              transition-transform duration-200
              ${checked ? "translate-x-5" : "translate-x-0.5"}
            `}
            aria-hidden="true"
          />
        </label>
      </div>

      {/* Label and description */}
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-zinc-300 cursor-pointer">
          {label}
        </label>
        {description && (
          <p id={`${id}-description`} className="text-xs text-zinc-500 mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
