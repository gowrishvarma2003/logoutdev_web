import { getAvatarColor, getInitials } from "@/lib/utils";

interface AvatarProps {
  user?: { id: string; name: string; email?: string } | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
};

export default function Avatar({
  user,
  size = "md",
  className = "",
}: AvatarProps) {
  const label = user?.name || user?.email || "?";
  const initials = getInitials(label);
  const color = getAvatarColor(user?.id || "default");

  return (
    <div
      className={`${SIZE_CLASSES[size]} ${color} rounded-full flex items-center justify-center font-semibold text-white shrink-0 select-none ${className}`}
      aria-label={label}
      title={label}
    >
      {initials}
    </div>
  );
}
