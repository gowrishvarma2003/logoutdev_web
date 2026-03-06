interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-10 h-10 border-[3px]",
};

export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full border-zinc-800 border-t-zinc-300 animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
