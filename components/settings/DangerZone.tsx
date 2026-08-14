/**
 * DangerZone - Reusable danger zone section container
 * Provides a consistent red/rose themed section for dangerous actions
 * Features:
 * - Warning icon header
 * - Red/rose color scheme
 * - Clear visual hierarchy
 * - Children slot for danger actions
 */

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export interface DangerZoneProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function DangerZone({
  children,
  title = "Danger Zone",
  description = "Irreversible and destructive actions",
}: DangerZoneProps) {
  return (
    <section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-rose-500/20 bg-rose-500/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/20 rounded-lg flex-shrink-0">
            <ExclamationTriangleIcon className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {description && (
              <p className="text-sm text-rose-300/70 mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}
