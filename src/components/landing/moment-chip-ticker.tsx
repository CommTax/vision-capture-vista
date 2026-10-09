import { useEffect, useState } from "react";
import type { PracticeMomentChip, PracticeMomentChipCategory } from "@/content/types";

type Props = {
  chips: PracticeMomentChip[];
  /** Seconds per loop. Longer = slower. */
  speed?: number;
};


/** Category → dot color. Kept muted to fit the dark theme. */
const DOT_COLOR: Record<PracticeMomentChipCategory | "default", string> = {
  role:      "rgb(251, 191, 36)",   // amber
  type:      "rgb(56, 189, 248)",   // sky
  situation: "rgb(249, 115, 111)",  // coral
  scenario:  "rgb(52, 211, 153)",   // emerald
  custom:    "rgb(167, 139, 250)",  // violet
  default:   "rgb(148, 163, 184)",  // slate
};

function Chip({ chip }: { chip: PracticeMomentChip }) {
  const dot = DOT_COLOR[chip.category ?? "default"];
  return (
    <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap font-mono text-[11px] tracking-[0.02em] text-foreground/75 transition-colors duration-300 group-hover/ticker:text-foreground/95">
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{
          background: dot,
          boxShadow: `0 0 6px ${dot}80`,
        }}
      />
      <span>{chip.label}</span>
      {/* Dot separator between chips */}
      <span aria-hidden className="ml-2 text-muted-foreground/30">·</span>
    </span>
  );
}

export function MomentChipTicker({ chips, speed = 35 }: Props) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  if (chips.length === 0) return null;

  // Reduced motion: static, horizontally scrollable
  if (reduced) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => (
          <Chip key={chip.label} chip={chip} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="group/ticker relative overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
      }}
    >
      <div
        className="ticker-track flex w-max items-center"
        style={{ "--ticker-speed": `${speed}s` } as React.CSSProperties}
      >
        {[...chips, ...chips].map((chip, i) => (
          <Chip key={`${chip.label}-${i}`} chip={chip} />
        ))}
      </div>
    </div>
  );
}
