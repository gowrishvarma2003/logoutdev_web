import { cn } from "@/lib/utils";

type AlertTone = "default" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<AlertTone, string> = {
  default: "border-border-default bg-surface-muted text-text-secondary",
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-100",
  danger: "border-rose-500/25 bg-rose-500/10 text-rose-100",
  info: "border-sky-500/25 bg-sky-500/10 text-sky-100",
};

export default function Alert({
  tone = "default",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border px-4 py-3", toneClasses[tone], className)}>
      {title ? <p className="text-sm font-semibold">{title}</p> : null}
      {children ? <div className={cn("text-sm leading-relaxed", title && "mt-1")}>{children}</div> : null}
    </div>
  );
}
