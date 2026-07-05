"use client";

import { SparklesIcon } from "@/components/ui/Icons";
import type { ProofOfWorkBand } from "@/lib/types";

interface ProfileBandChipProps {
  band: ProofOfWorkBand | null;
  badge?: string | null;
  score?: number;
  className?: string;
}

const BAND_STYLES: Record<ProofOfWorkBand, { text: string; ring: string; bg: string }> = {
  Strong: { text: "text-emerald-300", ring: "border-emerald-500/30", bg: "bg-emerald-500/10" },
  Growing: { text: "text-sky-300", ring: "border-sky-500/30", bg: "bg-sky-500/10" },
  Early: { text: "text-zinc-400", ring: "border-zinc-700", bg: "bg-zinc-800/60" },
};

export default function ProfileBandChip({ band, badge, score, className = "" }: ProfileBandChipProps) {
  const style = band ? BAND_STYLES[band] ?? BAND_STYLES.Early : BAND_STYLES.Early;
  const label = badge || band || "New Builder";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${style.ring} ${style.bg} px-2.5 py-0.5 text-xs font-medium ${style.text} ${className}`}
      title="Proof-of-Work badge"
    >
      <SparklesIcon className="w-3 h-3" />
      {label}
      {typeof score === "number" ? (
        <span className="text-zinc-500 font-normal">· {score}</span>
      ) : null}
    </span>
  );
}
