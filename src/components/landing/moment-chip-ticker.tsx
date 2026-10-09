import { useEffect, useRef, useState } from "react";
import type { PracticeMomentChipRow } from "@/content/types";

type Props = PracticeMomentChipRow & {
  /** Seconds per loop. Longer = slower. */
  speed?: number;
};

/**
 * A single horizontal chip row that loops infinitely like a ticker.
 * Chips are duplicated so the animation wraps seamlessly.
 * Pauses on hover (desktop). On reduced-motion, becomes a static
 * horizontally-scrollable row (no animation).
 */
export function MomentChipTicker({ label, items, moreLabel, speed = 30 }: Props) {
  const [reduced, setReduced] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const chips = [...items, ...(moreLabel ? [moreLabel] : [])];

  // Reduced motion: static, no looping
  if (reduced) {
    return (
      <div>
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips.map((chip, i) => (
            <Chip key={`${chip}-${i}`} label={chip} faded={!!moreLabel && i === chips.length - 1} />
          ))}
        </div>
      </div>
    );
  }

  // Animated: duplicate content for seamless loop
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div
        className="group/ticker relative overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)",
        }}
      >
        <div
          ref={trackRef}
          className="ticker-track flex w-max gap-1.5 group-hover/ticker:[animation-play-state:paused]"
          style={{ "--ticker-speed": `${speed}s` } as React.CSSProperties}
        >
          {[...chips, ...chips].map((chip, i) => (
            <Chip
              key={`${chip}-${i}`}
              label={chip}
              faded={!!moreLabel && chip === moreLabel}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Chip({ label, faded }: { label: string; faded?: boolean }) {
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[0.06em] ${
        faded
          ? "border-dashed border-border text-muted-foreground/60"
          : "border-border bg-background/40 text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}
