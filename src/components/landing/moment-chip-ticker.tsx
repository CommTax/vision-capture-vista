import { useEffect, useState } from "react";

type Props = {
  chips: string[];
  /** Seconds per loop. Longer = slower. */
  speed?: number;
};

/**
 * Single-line looping chip ticker.
 * Chips duplicate so the animation wraps seamlessly.
 * Pauses on hover. On reduced-motion, becomes a static scroll row.
 */
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
      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => (
          <Chip key={chip} label={chip} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="group/ticker relative overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0, black 10px, black calc(100% - 10px), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0, black 10px, black calc(100% - 10px), transparent 100%)",
      }}
    >
      <div
        className="ticker-track flex w-max gap-1.5 group-hover/ticker:[animation-play-state:paused]"
        style={{ "--ticker-speed": `${speed}s` } as React.CSSProperties}
      >
        {[...chips, ...chips].map((chip, i) => (
          <Chip key={`${chip}-${i}`} label={chip} />
        ))}
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="shrink-0 whitespace-nowrap rounded-full border border-border bg-background/40 px-2.5 py-1 font-mono text-[10px] tracking-[0.06em] text-muted-foreground">
      {label}
    </span>
  );
}
