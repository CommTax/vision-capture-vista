import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Logo, useHydrated } from "@/components/app-shell";
import { setState } from "@/lib/store";
import { seedDemo } from "@/lib/demo";
import { demoModeEnabled, matchDemoLogin, seedDemoAccount } from "@/lib/demo-accounts";

export const Route = createFileRoute("/signup")({
  validateSearch: z.object({ mode: z.enum(["signup", "signin"]).optional() }),
  head: () => ({ meta: [{ title: "Create your account — Unspoken" }, { name: "description", content: "Start practicing real responses with Unspoken." }, { property: "og:title", content: "Create your account — Unspoken" }, { property: "og:description", content: "Start practicing real responses with Unspoken." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Signup,
});

function Signup() {
  const { mode } = Route.useSearch();
  const signin = mode === "signin";
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const demo = matchDemoLogin(email, pw);
    if (demo) { seedDemoAccount(demo); navigate({ to: demo === "sprint" ? "/sprint" : "/dashboard" }); return; }
    if (signin) { seedDemo(name || "Arun", email); navigate({ to: "/dashboard" }); return; }
    setState((s) => ({ ...s, profile: { name: name.trim() || "Friend", email, goal: "", struggle: "", experience: "", level: "Mid career", onboarded: false, plan: "free" } }));
    navigate({ to: "/onboarding" });
  };
  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center"><Logo /></div>
        <form onSubmit={submit} className="glass glass-float rise space-y-4 p-7">
          <h1 className="text-[28px] font-bold">{signin ? "Welcome back" : "Start practicing"}</h1>
          {!signin && <input className="field" placeholder="Your first name" value={name} onChange={(e) => setName(e.target.value)} required />}
          <input className="field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="field" type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} />
          <button className="btn btn-primary w-full" disabled={!hydrated}>{signin ? "Sign in" : "Create account"}</button>
          <p className="text-center text-[12px] text-muted-foreground">Accounts are stored in this browser for now — cloud sign-in is coming.</p>
          <p className="text-center text-[13px] text-muted-foreground">{signin ? <>New here? <Link to="/signup" className="text-primary">Create an account</Link></> : <>Have an account? <Link to="/signup" search={{ mode: "signin" }} className="text-primary">Sign in</Link></>}</p>
        </form>
        {hydrated && demoModeEnabled() && <Link to="/demo" className="mt-4 block text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground">Demo Mode (preview only)</Link>}
        <button className="mt-4 w-full text-center text-[13px] text-muted-foreground hover:text-foreground" onClick={() => { seedDemo(); navigate({ to: "/dashboard" }); }}>Explore with demo data →</button>
      </div>
    </div>
  );
}
