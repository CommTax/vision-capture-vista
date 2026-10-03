import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/app-shell";
import { ScoreBar } from "@/components/analysis-view";
import { getState } from "@/lib/store";
import { seedDemo } from "@/lib/demo";
import { MODES } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cadence — Practice what you'll actually have to say" },
      { name: "description", content: "Practice interviews, high-stakes conversations and presentations. Get AI analysis of what got lost, fix one thing, and try again." },
      { property: "og:title", content: "Cadence — Practice what you'll actually have to say" },
      { property: "og:description", content: "AI communication practice: respond, see what got lost, retry, improve." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const HERO_SCORES: [string, number][] = [["Structure", 68], ["Clarity", 76], ["Conciseness", 73], ["Relevance", 81], ["Impact", 69], ["Delivery", 70], ["Confidence", 66], ["Memorability", 62]];

function Landing() {
  const navigate = useNavigate();
  const tryFree = () => { if (!getState().profile) seedDemo(); navigate({ to: "/practice/$questionId", params: { questionId: "int-3" } }); };
  return (
    <div className="overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-border bg-glass backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 text-[13px] text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">How it works</a><a href="#modes" className="hover:text-foreground">Practice</a><a href="#analysis" className="hover:text-foreground">Analysis</a><a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-3"><Link to="/signup" search={{ mode: "signin" }} className="text-[13px] text-muted-foreground hover:text-foreground">Sign in</Link><Link to="/signup" className="btn btn-primary btn-sm">Start free</Link></div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 pt-16 pb-10 md:px-8 lg:grid-cols-12">
        <div className="rise lg:col-span-5">
          <div className="eyebrow mb-5 !text-primary">Communication practice studio</div>
          <h1 className="text-balance text-[clamp(40px,5.4vw,66px)] font-bold leading-[1.02]">Practice what you'll actually have to say.</h1>
          <p className="mt-6 max-w-[42ch] text-[16px] leading-6 text-muted-foreground">Improve how you structure, explain, and deliver your ideas — before the moment that matters.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/signup" className="btn btn-primary">Start Practicing</Link><button onClick={tryFree} className="btn btn-ghost">Try a Free Practice</button></div>
          <div className="mt-8 flex gap-6 text-[12px] text-muted-foreground"><span><b className="font-mono font-medium text-foreground">8</b> scored dimensions</span><span><b className="font-mono font-medium text-foreground">7</b> practice modes</span></div>
        </div>
        <div className="rise lg:col-span-7" style={{ animationDelay: "120ms" }}>
          <div className="glass glass-float p-5">
            <div className="mb-4 flex justify-between"><span className="eyebrow">Attempt 02 · difficult stakeholder</span><span className="text-[11px] text-muted-foreground">0:38 recorded</span></div>
            <div className="mb-5 flex items-center gap-3">
              <span className="font-mono text-[12px] text-muted-foreground line-through">SCATTERED</span><span className="text-primary">→</span>
              <span className="clip-in font-display text-[22px] font-bold">STRUCTURED</span>
              <span className="ml-auto rounded-full bg-primary/15 px-2 py-1 text-[11px] text-primary">+26 structure</span>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">{HERO_SCORES.map(([l, v]) => <ScoreBar key={l} label={l} value={v} />)}</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-16 md:px-8">
        <div className="eyebrow mb-4">The problem</div>
        <h2 className="max-w-2xl text-[clamp(28px,3.4vw,40px)] font-bold leading-tight">You know what you want to say.<br /><span className="text-muted-foreground">But sometimes it comes out differently.</span></h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[["RAMBLING", "CONCISE"], ["SCATTERED", "STRUCTURED"], ["UNCLEAR", "PRECISE"], ["FORGETTABLE", "MEMORABLE"], ["UNCONVINCING", "PERSUASIVE"]].map(([a, b]) => (
            <div key={a} className="glass p-5"><div className="font-mono text-[11px] text-muted-foreground line-through">{a}</div><div className="mt-2 font-display text-[18px] font-bold"><span className="text-primary">→ </span>{b}</div></div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1200px] px-5 py-16 md:px-8">
        <div className="eyebrow mb-6">How it works</div>
        <div className="grid gap-4 md:grid-cols-5">
          {["Practice a real situation", "Get your response analyzed", "See what got lost", "Fix one thing", "Try again"].map((s, i) => (
            <div key={s} className="border-t border-border pt-4"><div className="font-mono text-[12px] text-primary">0{i + 1}</div><div className="mt-2 font-display text-[18px] font-bold leading-tight">{s}</div></div>
          ))}
        </div>
      </section>

      <section id="modes" className="mx-auto max-w-[1200px] px-5 py-16 md:px-8">
        <div className="eyebrow mb-6">Practice modes</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.filter((m) => m.id !== "custom").map((m) => (
            <div key={m.id} className="glass p-6"><div className="eyebrow !text-primary">{m.tag}</div><div className="mt-3 font-display text-[20px] font-bold">{m.name}</div><p className="mt-2 text-[14px] text-muted-foreground">{m.blurb}</p></div>
          ))}
        </div>
      </section>

      <section id="analysis" className="mx-auto grid max-w-[1200px] gap-6 px-5 py-16 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-12 mb-2"><div className="eyebrow mb-3">Personalized feedback</div><h2 className="max-w-2xl text-[clamp(28px,3.4vw,40px)] font-bold leading-tight">Not generic communication advice. Feedback based on what <span className="text-primary">you</span> actually said.</h2></div>
        <div className="glass p-7 lg:col-span-5">
          <div className="eyebrow mb-4">What got lost</div>
          <h3 className="text-[24px] font-bold leading-tight">You opened with the background, not the result.</h3>
          <p className="mt-3 text-[14px] leading-6 text-muted-foreground">You meant: “I turned around a difficult stakeholder.” They heard: “Several things happened and eventually it was resolved.”</p>
          <div className="mt-5 space-y-2 text-[13px]">{["Main point appeared at 23 seconds", "Too much background", "Result was not specific"].map((x) => <div key={x} className="flex gap-2"><span className="text-primary">·</span>{x}</div>)}</div>
        </div>
        <div className="glass p-7 lg:col-span-7">
          <div className="mb-6 flex justify-between"><div className="eyebrow">Attempt comparison</div><span className="text-[11px] text-muted-foreground">retry · same prompt</span></div>
          <div className="grid grid-cols-3 text-center text-[13px]">
            <div><div className="mb-2 text-muted-foreground">Attempt 01</div><div className="font-mono text-[15px]">42</div><div className="text-[11px] text-muted-foreground">structure</div></div>
            <div><div className="mb-2 text-muted-foreground">Δ</div><div className="font-mono text-[15px] text-primary">+26</div><div className="text-[11px] text-muted-foreground">23s → 5s to point</div></div>
            <div><div className="mb-2 text-muted-foreground">Attempt 02</div><div className="font-mono text-[15px] text-primary">68</div><div className="text-[11px] text-muted-foreground">structure</div></div>
          </div>
          <div className="mt-6 space-y-3"><ScoreBar label="Structure" value={68} prev={42} /><ScoreBar label="Clarity" value={76} prev={61} /><ScoreBar label="Impact" value={69} prev={53} /></div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-16 md:px-8">
        <div className="eyebrow mb-6">Your response pattern</div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass p-6"><div className="eyebrow">Primary</div><div className="mt-3 font-display text-[24px] font-bold leading-tight">SCATTERED<br /><span className="text-primary">→ STRUCTURED</span></div><div className="mt-2 text-[12px] text-muted-foreground">Several ideas without a clear order</div></div>
          <div className="glass p-6"><div className="eyebrow">Avg time to point</div><div className="mt-2 font-display text-[40px] font-bold">5.2s</div><div className="text-[12px] text-muted-foreground">down from 23s</div></div>
          <div className="glass p-6"><div className="eyebrow">Strength · Focus</div><div className="mt-3 font-display text-[22px] font-bold">Relevance</div><div className="text-[13px] text-muted-foreground">Focus next: <span className="text-primary">Structure</span></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-16 md:px-8">
        <div className="glass p-8 md:p-12">
          <div className="eyebrow mb-3">Targeted practice</div>
          <h2 className="max-w-2xl text-[clamp(26px,3vw,36px)] font-bold leading-tight">Don't learn communication. Practice the specific thing holding you back.</h2>
          <div className="mt-6 flex flex-wrap gap-2">{["5-Second Main Point", "Cut 30 Words", "Answer in 3 Steps", "Give the Result First", "Make It Specific"].map((d) => <span key={d} className="chip">{d}</span>)}</div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-[1200px] px-5 py-16 md:px-8">
        <div className="eyebrow mb-6">Pricing</div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: "Free", p: "₹0", f: ["Limited practice sessions", "Basic analysis", "Primary communication pattern", "Limited response history"], c: "Start Free" },
            { n: "Practice", p: "₹499/mo", f: ["Unlimited practice", "Detailed AI analysis", "Voice + text", "Response history", "Targeted drills", "Progress tracking"], c: "Choose Plan", hi: true },
            { n: "Pro Sprint", p: "₹1,499/mo", f: ["Personalized practice program", "Advanced analytics", "Interview-specific practice", "High-stakes scenarios", "Deep pattern analysis", "Progress reports"], c: "Start Sprint" },
          ].map((t) => (
            <div key={t.n} className={`glass p-7 ${t.hi ? "border-primary/50" : ""}`}>
              <div className="eyebrow">{t.n}</div><div className="mt-3 font-display text-[36px] font-bold">{t.p}</div>
              <ul className="mt-5 space-y-2 text-[14px]">{t.f.map((x) => <li key={x} className="flex gap-2"><span className="text-primary">·</span>{x}</li>)}</ul>
              <Link to="/signup" className={`btn mt-7 w-full ${t.hi ? "btn-primary" : "btn-ghost"}`}>{t.c}</Link>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[12px] text-muted-foreground">Payments are coming soon — every plan starts free today.</p>
      </section>

      <footer className="mt-8 border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center md:px-8">
          <div><Logo /><div className="mt-1 text-[13px] text-muted-foreground">Say the thing you actually mean, on the first try.</div></div>
          <div className="flex gap-6 text-[13px] text-muted-foreground"><span>Privacy</span><Link to="/responses">Practice log</Link><span>Contact</span></div>
        </div>
      </footer>
    </div>
  );
}
