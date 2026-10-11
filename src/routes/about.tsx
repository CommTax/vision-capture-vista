import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — TheUnspoken" },
      {
        name: "description",
        content:
          "Why TheUnspoken exists: to give every thought the clarity to be understood, the structure to be followed, and the impact to be remembered.",
      },
      { property: "og:title", content: "About — TheUnspoken" },
      {
        property: "og:description",
        content:
          "A place to practise real moments, see where your message loses its impact, and try again — with purpose.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell allowGuest>
      <About />
    </AppShell>
  ),
});

const H2 = "text-balance text-[clamp(28px,3.6vw,44px)] font-bold leading-[1.1]";
const PROSE = "text-[16px] leading-7 text-muted-foreground md:text-[17px] md:leading-8";

function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-16 py-8 md:space-y-24 md:py-16">
      {/* Hero */}
      <header className="space-y-4">
        <div className="eyebrow !text-primary">About</div>
        <h1 className="text-balance text-[clamp(34px,5vw,56px)] font-bold leading-[1.05] tracking-tight">
          To give every thought the clarity to be understood, the structure to be
          followed, and the impact to be remembered.
        </h1>
      </header>

      {/* Why we exist */}
      <section id="why" className="space-y-6 scroll-mt-24">
        <h2 className={H2}>Why we exist</h2>
        <p className={PROSE}>
          People have ideas worth hearing, knowledge worth sharing, and potential
          worth realising. Yet too often, their true value gets lost in the way
          they communicate.
        </p>
        <p className={PROSE}>
          We speak before organising our thoughts. We explain more, but communicate
          less. Important ideas get buried, contributions go unseen, and decisions
          that should move forward lead to more meetings instead of meaningful
          action.
        </p>
        <p className="font-display text-[20px] font-bold leading-7 text-foreground md:text-[22px]">
          The result? Lost time. Missed opportunities. Untapped potential.
        </p>
      </section>

      {/* Why we started */}
      <section id="story" className="space-y-6 scroll-mt-24">
        <h2 className={H2}>Why we started</h2>
        <p className={PROSE}>
          We kept seeing the same thing: capable people with valuable ideas
          struggling to express them in the moments that mattered. Their points
          came out late, their thinking sounded scattered, and their contributions
          failed to reflect what they were truly capable of.
        </p>
        <p className={PROSE}>
          Sometimes, the same ideas would surface later, expressed by someone
          else — and receive the recognition they deserved.
        </p>
        <p className={PROSE}>
          It wasn't a lack of knowledge. It was the gap between knowing something
          and communicating it in a way others could understand, remember, and act
          on.
        </p>
        <p className={PROSE}>
          And often, no one tells you what went wrong. You leave the room without
          knowing what got lost.
        </p>
        <p className={PROSE}>
          Most advice stops at "be clear" or "be confident." But clarity is a
          skill. And skills improve through deliberate practice and feedback you
          can see.
        </p>
        <p className="font-display text-[20px] font-bold leading-7 text-foreground md:text-[22px]">
          So we built TheUnspoken: a place to practise real moments, see where
          your message loses its impact, and try again — with purpose.
        </p>
      </section>

      {/* What we do */}
      <section id="what" className="space-y-6 scroll-mt-24">
        <h2 className={H2}>What we do</h2>
        <p className={PROSE}>
          At TheUnspoken, we help people turn their thoughts into clear,
          structured, and purposeful communication through deliberate practice and
          meaningful feedback.
        </p>
        <p className={PROSE}>
          So ideas land, contributions count, and decisions move forward. So people
          spend less time explaining themselves and more time making a difference.
        </p>
        <p className={PROSE}>Because when people communicate better, better things happen.</p>
      </section>

      {/* Vision */}
      <section id="vision" className="scroll-mt-24">
        <div className="glass glass-float rounded-3xl border-primary/40 p-8 text-center md:p-12">
          <div className="eyebrow !text-primary mb-3">Our Vision</div>
          <p className="font-display text-[clamp(24px,3.4vw,38px)] font-bold leading-tight text-foreground">
            A world where every idea of value is heard.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <Link to="/practice" className="btn btn-primary px-6 py-3 text-[15px]">
          Start practising →
        </Link>
        <p className="mt-3 font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
          No card needed. Free practice.
        </p>
      </section>
    </div>
  );
}
