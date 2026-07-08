"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full border border-border-default bg-surface px-3 text-sm text-text-primary transition-colors placeholder:text-text-disabled focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-focus/35 disabled:cursor-not-allowed disabled:opacity-55";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        fieldBase,
        "h-10 rounded-xl",
        invalid && "border-rose-500/45 focus:border-rose-400 focus:ring-rose-400/25",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        fieldBase,
        "min-h-28 resize-y rounded-xl py-2.5 leading-relaxed",
        invalid && "border-rose-500/45 focus:border-rose-400 focus:ring-rose-400/25",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        fieldBase,
        "h-10 rounded-xl",
        invalid && "border-rose-500/45 focus:border-rose-400 focus:ring-rose-400/25",
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = "Select";

export const Checkbox = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    className={cn(
      "h-4 w-4 rounded border-border-strong bg-surface text-primary accent-primary focus:ring-2 focus:ring-focus/35",
      className,
    )}
    {...props}
  />
));
Checkbox.displayName = "Checkbox";

export function Switch({
  checked,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { checked?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/50",
        checked
          ? "border-primary/30 bg-primary"
          : "border-border-default bg-surface-elevated",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-app shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );
}

export function FormField({
  label,
  description,
  error,
  htmlFor,
  children,
  className,
}: {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="ld-label block">
          {label}
        </label>
      ) : null}
      {children}
      {description ? <p className="ld-caption">{description}</p> : null}
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </div>
  );
}

export function SearchInput({
  className,
  wrapperClassName,
  icon,
  ...props
}: InputProps & { wrapperClassName?: string; icon?: React.ReactNode }) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      {icon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled">
          {icon}
        </span>
      ) : null}
      <Input className={cn(icon && "pl-9", className)} {...props} />
    </div>
  );
}
