"use client";

import { forwardRef } from "react";
import Spinner from "./Spinner";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success"
  | "link";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
  secondary:
    "border-border-default bg-secondary text-text-primary hover:bg-secondary-hover",
  outline:
    "border-border-default bg-transparent text-text-secondary hover:border-border-strong hover:bg-surface-hover hover:text-text-primary",
  ghost:
    "border-transparent bg-transparent text-text-muted hover:bg-surface-hover hover:text-text-primary",
  danger:
    "border-rose-500/25 bg-rose-500/10 text-rose-200 hover:border-rose-500/40 hover:bg-rose-500/18 hover:text-text-primary",
  success:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-200 hover:border-emerald-500/40 hover:bg-emerald-500/18 hover:text-text-primary",
  link:
    "border-transparent bg-transparent px-0 text-accent underline-offset-4 hover:text-sky-300 hover:underline",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-11 gap-2.5 rounded-xl px-5 text-sm",
  icon: "h-9 w-9 rounded-xl p-0",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex shrink-0 items-center justify-center border font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/70 focus-visible:ring-offset-2 focus-visible:ring-offset-app active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;

export function IconButton({
  "aria-label": ariaLabel,
  children,
  ...props
}: ButtonProps & { "aria-label": string }) {
  return (
    <Button size="icon" variant="ghost" aria-label={ariaLabel} {...props}>
      {children}
    </Button>
  );
}
