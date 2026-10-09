import { ScrollReveal } from "./scroll-reveal";

type ChatStyle = "imessage" | "slack" | "whatsapp" | "email";

type Testimonial = {
  id: string;
  /** Who the "screenshot" is from. Placeholder for now — replace with real names. */
  name: string;
  role: string;
  /** The quote. Placeholder — swap for real. */
  quote: string;
  style: ChatStyle;
};

// ─────────────────────────────────────────────────────────────
// PLACEHOLDER TESTIMONIALS
// Replace quote/name/role with real ones when available.
// Do NOT publish without user permission.
// ─────────────────────────────────────────────────────────────

const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Priya S.",
    role: "Product Manager",
    quote:
      "I had a PM interview in three days. I practised the same question five times. The Unspoken showed me I was leading with context every single time. I fixed it. Got the offer.",
    style: "slack",
  },
  {
    id: "t2",
    name: "Arjun M.",
    role: "Senior Engineer",
    quote:
      "I rehearsed my salary negotiation six times. On the call, I said the number without apologising. First time in my career.",
    style: "imessage",
  },
  {
    id: "t3",
    name: "Neha K.",
    role: "Marketing Lead",
    quote:
      "My presentations always felt fine in my head. Watching my structure score go from 42 to 68 after two retries — that was the moment it clicked.",
    style: "whatsapp",
  },
  {
    id: "t4",
    name: "Rahul V.",
    role: "Consultant",
    quote: "The filler-word detection was brutal. In a good way.",
    style: "email",
  },
];

// ─────────────────────────────────────────────────────────────
// Screenshot-style wrappers — mimic the look of a DM/review
// ─────────────────────────────────────────────────────────────

function SlackCard({ name, role, quote }: { name: string; role: string; quote: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span
          className="grid size-7 place-items-center rounded-md text-[11px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #611f69 0%, #e01e5a 100%)" }}
        >
          {name.charAt(0)}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold text-foreground">{name}</div>
          <div className="truncate font-mono text-[10px] text-muted-foreground">{role}</div>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-5 text-foreground/90">{quote}</p>
    </div>
  );
}

function IMessageCard({ name, quote }: { name: string; quote: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-muted-foreground/40" />
        <span className="size-2 rounded-full bg-muted-foreground/40" />
        <span className="size-2 rounded-full bg-muted-foreground/40" />
      </div>
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/90 px-3 py-2 text-[12.5px] leading-5 text-primary-foreground">
        {quote}
      </div>
      <div className="mt-2 text-right font-mono text-[10px] text-muted-foreground">
        {name} · Just now
      </div>
    </div>
  );
}

function WhatsAppCard({ name, quote }: { name: string; quote: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <span className="grid size-6 place-items-center rounded-full bg-[#25d366]/20 text-[10px] font-semibold text-[#25d366]">
          {name.charAt(0)}
        </span>
        <span className="text-[11px] font-medium text-foreground">{name}</span>
      </div>
      <div className="mt-2 rounded-lg bg-[#dcf8c6]/10 px-2.5 py-1.5 text-[12.5px] leading-5 text-foreground/90">
        {quote}
        <div className="mt-0.5 text-right font-mono text-[9px] text-muted-foreground">10:14 ✓✓</div>
      </div>
    </div>
  );
}

function EmailCard({ name, role, quote }: { name: string; role: string; quote: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2 border-b border-border pb-2">
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold text-foreground">{name}</div>
          <div className="truncate font-mono text-[10px] text-muted-foreground">{role}</div>
        </div>
        <span className="shrink-0 font-mono text-[9px] text-muted-foreground">2:47 PM</span>
      </div>
      <p className="mt-2 text-[12.5px] leading-5 text-foreground/85">{quote}</p>
    </div>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  switch (t.style) {
    case "slack":    return <SlackCard    name={t.name} role={t.role} quote={t.quote} />;
    case "imessage": return <IMessageCard name={t.name}              quote={t.quote} />;
    case "whatsapp": return <WhatsAppCard name={t.name}              quote={t.quote} />;
    case "email":    return <EmailCard    name={t.name} role={t.role} quote={t.quote} />;
  }
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────

export function TestimonialsStrip() {
  return (
    <section className="border-y border-border bg-card/20">
      <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-8 md:py-16">
        <ScrollReveal>
          <div className="text-center">
            <div className="eyebrow !text-primary">In their words</div>
            <p className="mt-2 text-[15px] text-muted-foreground md:text-[16px]">
              Practice sessions that changed something real.
              <span className="text-muted-foreground/60"> — Early user feedback</span>
            </p>
          </div>
        </ScrollReveal>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal
              key={t.id}
              delay={i * 80}
              className="w-[80vw] max-w-[320px] shrink-0 snap-start md:w-auto md:max-w-none"
            >
              <TestimonialCard t={t} />
            </ScrollReveal>
          ))}
        </div>

        {/* Stats */}
        <ScrollReveal delay={240}>
          <div className="mt-10 flex flex-col items-center gap-6 border-t border-border pt-8 md:flex-row md:justify-center md:gap-16">
            <div className="text-center">
              <div className="font-display text-[36px] font-bold leading-none text-primary md:text-[40px]">
                50+
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Professionals practiced
              </div>
            </div>
            <div className="hidden h-10 w-px bg-border md:block" />
            <div className="text-center">
              <div className="font-display text-[36px] font-bold leading-none text-primary md:text-[40px]">
                1,084
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Drills last month
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
