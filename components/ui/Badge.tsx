import { cn } from "@/lib/utils";

type BadgeTone = "default" | "primary" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<BadgeTone, string> = {
  default: "border-border-default bg-surface-muted text-text-secondary",
  primary: "border-primary/20 bg-primary/10 text-text-primary",
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  danger: "border-rose-500/25 bg-rose-500/10 text-rose-300",
  info: "border-sky-500/25 bg-sky-500/10 text-sky-300",
};

export default function Badge({
  tone = "default",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
