/**
 * SettingsSection - Reusable section wrapper for settings pages
 * Provides consistent styling and structure across all settings
 * Supports proper heading hierarchy for accessibility
 */

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  headingLevel?: "h2" | "h3";
}

export default function SettingsSection({
  title,
  description,
  children,
  icon,
  headingLevel = "h2",
}: SettingsSectionProps) {
  const HeadingTag = headingLevel;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5" aria-label={title}>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          {icon && <span className="text-zinc-400" aria-hidden="true">{icon}</span>}
          <HeadingTag className="text-base font-semibold text-white">
            {title}
          </HeadingTag>
        </div>
        {description && (
          <p className="text-sm text-zinc-500 mt-1" id={`${title}-description`}>
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
