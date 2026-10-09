import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { X, ArrowRight } from "lucide-react";
import type { PracticeMoment, PracticeMomentChip } from "@/content/types";

/**
 * Bottom sheet (mobile) / centered modal (desktop) showing
 * the roles and question types inside a practice moment.
 * Content is derived from `moment.chips` grouped by category.
 */
export function ExploreSheet({
  moment,
  open,
  onClose,
  tint,
}: {
  moment: PracticeMoment | null;
  open: boolean;
  onClose: () => void;
  tint: string;
}) {
  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Escape key closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !moment) return null;

  // Group chips by category
  const chips: PracticeMomentChip[] = moment.chips ?? [];
  const grouped = chips.reduce<Record<string, string[]>>((acc, chip) => {
    const key = chip.category ?? "other";
    (acc[key] ??= []).push(chip.label);
    return acc;
  }, {});

  const CATEGORY_LABELS: Record<string, string> = {
    role: "Roles",
    type: "Question types",
    situation: "Situations",
    scenario: "Common scenarios",
    custom: "Things you can try",
    other: "Also available",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Explore ${moment.name}`}
        className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl border-t border-border bg-popover shadow-2xl md:max-h-[80vh] md:max-w-lg md:rounded-3xl md:border"
      >
        {/* Header */}
        <div className="relative flex items-start justify-between gap-4 border-b border-border p-5 md:p-6">
          <div className="min-w-0">
            <div
              className="font-mono text-[10px] uppercase tracking-[0.14em]"
              style={{ color: tint }}
            >
              Explore
            </div>
            <h3 className="mt-1.5 font-display text-[22px] font-bold leading-tight">
              {moment.name}
            </h3>
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
              {moment.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6">
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, labels]) => (
              <div key={cat}>
                <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {CATEGORY_LABELS[cat] ?? cat}
                </div>
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full border px-3 py-1.5 text-[12.5px] leading-5"
                      style={{
                        borderColor: `${tint}40`,
                        background: `${tint}10`,
                        color: "rgb(230, 230, 235)",
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-border bg-popover p-5 md:p-6">
          <Link
            to="/practice"
            search={{ mode: moment.category }}
            onClick={onClose}
            className="btn btn-primary w-full justify-center"
            style={{ background: tint, color: "rgb(15, 15, 20)" }}
          >
            Start practicing
            <ArrowRight className="ml-1 size-4" />
          </Link>
          <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            no card required · free to try
          </p>
        </div>
      </div>
    </div>
  );
}
