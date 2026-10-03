import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/app-shell";
import { ScoreBar } from "@/components/analysis-view";
import { getState } from "@/lib/store";
import { seedDemo } from "@/lib/demo";
import landingVideo from "@/assets/landing-transformation.mp4.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cadence — Say what you mean. Make it land." },
      { name: "description", content: "Practice the answers, conversations, and high-stakes moments that matter — then see exactly what gets lost when you speak." },
      { property: "og:title", content: "Cadence — Say what you mean. Make it land." },
      { property: "og:description", content: "Practice what you need to say, see what isn't landing, fix it, and try again." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const MODE_CARDS: [string, string][] = [
  ["Interview", "Tell me about a difficult project."],
  ["Career", "Why are you ready for the next level?"],
  ["High-stakes conversation", "Tell your manager you disagree."],
  ["Presentation", "Explain your recommendation in 60 seconds."],
  ["Leadership", "Give an executive update."],
  ["Persuasion", "Get a skeptical stakeholder to support your idea."],
  ["Custom", "Practice any situation you have coming up."],
];

const DRILLS: [string, string][] = [
  ["5-Second Main Point", "Get to your answer before the background."],
  ["Answer in 3 Steps", "Turn scattered ideas into a clear sequence."],
  ["Give the Result First", "Lead with what changed."],
  ["Cut 30 Words", "Say the same thing with less."],
  ["Make It Specific", "Replace vague claims with evidence."],
];

function Landing() {
  const navigate = useNavigate();
  const tryFree = () => { if (!getState().profile) seedDemo(); navigate({ to: "/practice/$questionId", params: { questionId: "int-3" } }); };
  return (
    <div className="overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-border bg-glass backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-8">
          <Link to="/" className="font-display text-[19px] font-bold tracking-tight">Home</Link>
          <nav className="hidden items-center gap-8 text-[13px] text-muted-foreground md:flex">
            <a href="#modes" className="hover:text-foreground">Practice</a><a href="#how" className="hover:text-foreground">How it works</a><a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-3"><Link to="/signup" search={{ mode: "signin" }} className="text-[13px] text-muted-foreground hover:text-foreground">Sign in</Link><Link to="/signup" className="btn btn-primary btn-sm">Start Practicing</Link></div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 pt-20 pb-16 md:px-8 lg:grid-cols-12">
        <div className="rise lg:col-span-6">
          <div className="eyebrow mb-5 !text-primary">Practice for moments that matter.</div>
          <h1 className="text-balance text-[clamp(42px,5.8vw,72px)] font-bold leading-[1.0]">Say what you mean. <span className="text-primary">Make it land.</span></h1>
          <p className="mt-6 max-w-[46ch] text-[17px] leading-7 text-muted-foreground">Practice the answers, conversations, and high-stakes moments that matter — then see exactly what gets lost in your response.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/signup" className="btn btn-primary">Start Practicing</Link><button onClick={tryFree} className="btn btn-ghost">Try a Free Practice</button></div>
        </div>
        <div className="rise lg:col-span-6" style={{ animationDelay: "120ms" }}>
          <div className="glass glass-float p-6 md:p-7">
            <div className="mb-6"><span className="eyebrow">Same moment. Better response.</span></div>
            <div className="rounded-2xl border border-border p-4">
              <div className="eyebrow">Attempt 01</div>
              <div className="mt-1 font-display text-[20px] font-bold text-muted-foreground line-through decoration-1">SCATTERED · RAMBLING</div>
              <div className="text-[13px] text-muted-foreground">Main point at 23s</div>
            </div>
            <div className="py-2 text-center text-primary">↓</div>
            <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4">
              <div className="eyebrow !text-primary">Attempt 02</div>
              <div className="clip-in mt-1 font-display text-[24px] font-bold">STRUCTURED · CONCISE</div>
              <div className="text-[13px]">Main point at <span className="text-primary">5s</span></div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-center">
              {[["Structure", 42, 68], ["Conciseness", 55, 73]].map(([l, a, b]) => (
                <div key={l as string}><div className="text-[11px] text-muted-foreground">{l}</div><div className="mt-1 font-mono text-[13px]"><span className="text-muted-foreground">{a}</span> → <span className="text-primary">{b}</span></div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
        <div className="relative min-h-[560px] overflow-hidden rounded-3xl border border-border">
          <video
            src={landingVideo.url}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/15 to-background/90" />
          <div className="relative flex min-h-[560px] flex-col justify-between p-7 md:p-10">
            <div>
              <div className="eyebrow mb-4 !text-primary">The real problem</div>
              <h2 className="max-w-2xl text-[clamp(28px,3.6vw,44px)] font-bold leading-tight">You know what you want to say. <span className="text-muted-foreground">The problem is getting it across.</span></h2>
              <p className="mt-3 max-w-xl text-[16px] text-muted-foreground">Sometimes the idea is strong. The response isn't.</p>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[["RAMBLING", "CONCISE"], ["SCATTERED", "STRUCTURED"], ["UNCLEAR", "PRECISE"], ["FORGETTABLE", "MEMORABLE"], ["UNCONVINCING", "PERSUASIVE"]].map(([a, b]) => (
                <div key={a} className="glass rounded-2xl px-4 py-4">
                  <div className="font-mono text-[11px] text-muted-foreground line-through">{a}</div>
                  <div className="mt-2 font-display text-[15px] font-bold leading-tight"><span className="text-primary">→ </span>{b}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-8 max-w-xl text-[15px] leading-6">The goal isn't to sound perfect. It's to make the thing you actually mean easier to hear.</p>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
        <div className="eyebrow mb-6">How it works</div>
        <div className="grid gap-4 md:grid-cols-5">
          {["Choose a real situation", "Give your response", "See what got lost", "Fix one thing", "Try again"].map((s, i) => (
            <div key={s} className="border-t border-border pt-4"><div className="font-mono text-[12px] text-primary">0{i + 1}</div><div className="mt-2 font-display text-[19px] font-bold leading-tight">{s}</div></div>
          ))}
        </div>
        <p className="mt-10 font-display text-[22px] font-bold">Don't rewrite yourself. <span className="text-primary">Learn what to change.</span></p>
      </section>

      {/* MODES */}
      <section id="modes" className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
        <h2 className="text-[clamp(28px,3.4vw,40px)] font-bold leading-tight">Practice the moments that matter.</h2>
        <p className="mt-3 text-[16px] text-muted-foreground">Choose a situation. We'll give you something real to respond to.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODE_CARDS.map(([tag, q]) => (
            <div key={tag} className={`glass p-6 ${tag === "Custom" ? "border-dashed" : ""}`}><div className="eyebrow !text-primary">{tag}</div><p className="mt-4 font-display text-[18px] font-bold leading-snug">“{q}”</p></div>
          ))}
        </div>
      </section>

      {/* FEEDBACK */}
      <section id="analysis" className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
        <div className="eyebrow mb-3 !text-primary">Feedback that listens to the response.</div>
        <h2 className="max-w-2xl text-[clamp(28px,3.4vw,40px)] font-bold leading-tight">Not generic communication advice. Feedback based on what <span className="text-primary">you</span> actually said.</h2>
        <div className="glass glass-float mt-10 grid divide-y divide-border md:grid-cols-4 md:divide-x md:divide-y-0">
          {[
            ["What you said", "“I started by explaining the background...”", false],
            ["What got lost", "The decision you actually made.", true],
            ["Why", "Your main point appeared after 23 seconds of context.", false],
            ["Try this", "Lead with the decision. Then explain why.", true],
          ].map(([l, t, hi]) => (
            <div key={l as string} className="p-6 md:p-7"><div className={`eyebrow ${hi ? "!text-primary" : ""}`}>{l}</div><p className="mt-3 font-display text-[19px] font-bold leading-snug">{t}</p></div>
          ))}
        </div>
      </section>

      {/* COMPARISON */}
      <section className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
        <h2 className="text-[clamp(28px,3.4vw,40px)] font-bold leading-tight">Don't just get feedback. <span className="text-primary">Try again.</span></h2>
        <div className="mt-10 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div className="glass p-7"><div className="eyebrow">Attempt 01</div><div className="mt-4 flex gap-10"><div><div className="font-display text-[40px] font-bold text-muted-foreground">42</div><div className="text-[12px] text-muted-foreground">Structure</div></div><div><div className="font-display text-[40px] font-bold text-muted-foreground">23s</div><div className="text-[12px] text-muted-foreground">Main point</div></div></div></div>
          <div className="text-center text-[24px] text-primary"><span className="hidden md:inline">→</span><span className="md:hidden">↓</span></div>
          <div className="glass border-primary/50 p-7"><div className="eyebrow !text-primary">Attempt 02</div><div className="mt-4 flex gap-10"><div><div className="font-display text-[40px] font-bold text-primary">68</div><div className="text-[12px] text-muted-foreground">Structure</div></div><div><div className="font-display text-[40px] font-bold text-primary">5s</div><div className="text-[12px] text-muted-foreground">Main point</div></div></div><div className="mt-5"><ScoreBar label="Structure" value={68} prev={42} /></div></div>
        </div>
        <p className="mt-6 text-[15px] text-muted-foreground">Same person. Same moment. Different response.</p>
      </section>

      {/* PATTERN */}
      <section className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
        <h2 className="text-[clamp(28px,3.4vw,40px)] font-bold leading-tight">Over time, you'll start seeing your pattern.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <div className="glass p-6 md:col-span-2"><div className="eyebrow">Your primary pattern</div><div className="mt-3 font-display text-[32px] font-bold">SCATTERED</div><p className="mt-2 text-[14px] text-muted-foreground">Several useful ideas, but they compete for attention.</p></div>
          <div className="glass p-6"><div className="eyebrow">Secondary</div><div className="mt-3 font-display text-[18px] font-bold">OVER-EXPLAINING</div><div className="eyebrow mt-6">Strength</div><div className="mt-2 font-display text-[18px] font-bold">RELEVANCE</div></div>
          <div className="glass border-primary/50 p-6"><div className="eyebrow !text-primary">Current focus</div><div className="mt-3 font-display text-[24px] font-bold text-primary">STRUCTURE</div></div>
        </div>
        <p className="mt-6 text-[15px] text-muted-foreground">Your feedback gets more useful as you practice.</p>
        <p className="mt-2 text-[14px] text-muted-foreground">Your next move: Make the point → put the ideas in order → stop.</p>
      </section>

      {/* DRILLS */}
      <section className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
        <h2 className="text-[clamp(28px,3.4vw,40px)] font-bold leading-tight">Practice the specific thing <span className="text-primary">holding you back.</span></h2>
        <p className="mt-3 text-[16px] text-muted-foreground">Targeted drills turn feedback into something you can actually practice.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {DRILLS.map(([n, d]) => (
            <div key={n} className="glass flex flex-col p-6"><div className="font-mono text-[12px] uppercase tracking-[0.12em] text-primary">{n}</div><p className="mt-3 flex-1 text-[14px] leading-6 text-muted-foreground">{d}</p><Link to="/drills" className="btn btn-ghost btn-sm mt-6 self-start">Practice</Link></div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
        <div className="eyebrow mb-6">Pricing</div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: "Free", p: "₹0", f: ["First practice sessions", "Basic response analysis", "Primary response pattern", "Limited history"], c: "Start Practicing" },
            { n: "Practice Pass", p: "₹499/mo", f: ["Unlimited practice", "Detailed analysis", "Voice + text", "Response history", "Targeted drills", "Progress tracking"], c: "Choose Plan", hi: true },
            { n: "Sprint", p: "₹1,499", f: ["Goal-specific practice program", "Advanced analysis", "Interview preparation", "High-stakes scenarios", "Personalized drills", "Progress report"], c: "Start Sprint" },
          ].map((t) => (
            <div key={t.n} className={`glass p-7 ${t.hi ? "border-primary/50" : ""}`}>
              <div className="eyebrow">{t.n}</div><div className="mt-3 font-display text-[36px] font-bold">{t.p}</div>
              <ul className="mt-5 space-y-2 text-[14px]">{t.f.map((x) => <li key={x} className="flex gap-2"><span className="text-primary">·</span>{x}</li>)}</ul>
              <Link to="/signup" className={`btn mt-7 w-full ${t.hi ? "btn-primary" : "btn-ghost"}`}>{t.c}</Link>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[12px] text-muted-foreground">Payments coming soon. Start practicing free today.</p>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
        <div className="glass glass-float p-10 text-center md:p-16">
          <h2 className="mx-auto max-w-2xl text-balance text-[clamp(30px,4vw,48px)] font-bold leading-tight">Practice until the important thing doesn't get lost.</h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] text-muted-foreground">Your next interview. Your next presentation. Your next difficult conversation. Practice it before it matters.</p>
          <Link to="/signup" className="btn btn-primary mt-8">Start Practicing</Link>
        </div>
      </section>

      <footer className="mt-8 border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center md:px-8">
          <Logo />
          <div className="flex gap-6 text-[13px] text-muted-foreground"><span>Privacy</span><Link to="/responses">Practice log</Link><span>Contact</span></div>
        </div>
      </footer>
    </div>
  );
}
