type Props = {
  count: number;
  active: number;
  onSelect: (i: number) => void;
  /** Accessibility label for the tablist. */
  label?: string;
  /** Optional className for outer wrapper positioning. */
  className?: string;
};

/**
 * Shared carousel indicator dots.
 * Renders a horizontal row of pills — active one is wider.
 * Always place ABOVE the carousel content on mobile so users see it
 * without scrolling past the carousel.
 */
export function CarouselDots({
  count,
  active,
  onSelect,
  label = "Carousel",
  className = "",
}: Props) {
  return (
    <div
      className={`flex items-center justify-center gap-2.5 ${className}`}
      role="tablist"
      aria-label={label}
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === active}
          aria-label={`Slide ${i + 1}`}
          onClick={() => onSelect(i)}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === active
              ? "w-8 bg-primary"
              : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
          }`}
        />
      ))}
    </div>
  );
}
