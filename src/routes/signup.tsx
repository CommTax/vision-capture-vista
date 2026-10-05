import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Logo, useHydrated } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { syncNow } from "@/lib/cloud-sync";
import { demoModeEnabled } from "@/lib/demo-accounts";

export const Route = createFileRoute("/signup")({
  validateSearch: z.object({ mode: z.enum(["signup", "signin"]).optional() }),
  head: () => ({ meta: [{ title: "Sign in — Unspoken" }, { name: "description", content: "Sign in to Unspoken with a one-time code sent to your email." }, { property: "og:title", content: "Sign in — Unspoken" }, { property: "og:description", content: "Sign in to Unspoken with a one-time code sent to your email." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [cool, setCool] = useState(0);

  useEffect(() => { if (cool <= 0) return; const t = setTimeout(() => setCool((c) => c - 1), 1000); return () => clearTimeout(t); }, [cool]);

  async function route() {
    const st = await syncNow();
    navigate({ to: st?.startsWith("SPRINT") ? "/sprint" : st?.startsWith("PRACTICE") ? "/dashboard" : "/practice", replace: true });
  }
  // Already signed in (or arrived from the email link): go straight in.
  useEffect(() => { if (!hydrated) return; supabase.auth.getSession().then(({ data }) => { if (data.session) void route(); }); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault(); setErr("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErr("Please enter a valid email."); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/signup?mode=signin` } });
    setBusy(false);
    if (error) { setErr(/signup|not found|not allowed/i.test(error.message) ? "We couldn't find an account with this email. Try a free practice first — your account is created after your first answer." : "We couldn't send a code right now. Please try again in a minute."); return; }
    setStep("code"); setCool(60);
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
    if (error) { setBusy(false); setErr("That code didn't work. Check it, or send a new one."); return; }
    await route();
  }

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center"><Logo /></div>
        {step === "email" ? (
          <form onSubmit={send} className="glass glass-float rise space-y-4 p-7" noValidate>
            <h1 className="text-[28px] font-bold">Sign in</h1>
            <p className="text-[14px] text-muted-foreground">We'll email you a code. No password needed.</p>
            <input className="field" type="email" autoComplete="email" placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {err && <p className="text-[13px] text-destructive">{err}</p>}
            <button className="btn btn-primary w-full" disabled={!hydrated || busy}>{busy ? "Sending…" : "Continue"}</button>
            <p className="text-center text-[13px] text-muted-foreground">New here? <Link to="/practice" className="text-primary">Try Unspoken free</Link></p>
          </form>
        ) : (
          <form onSubmit={verify} className="glass glass-float rise space-y-4 p-7" noValidate>
            <h1 className="text-[28px] font-bold">Enter your code</h1>
            <p className="text-[14px] text-muted-foreground">Sent to {email}. You can also open the link in that email.</p>
            <input className="field text-center font-mono text-[22px] tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={8} placeholder="••••••" aria-label="Code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
            {err && <p className="text-[13px] text-destructive">{err}</p>}
            <button className="btn btn-primary w-full" disabled={busy || code.length < 6}>{busy ? "Checking…" : "Verify"}</button>
            <div className="flex justify-between text-[13px] text-muted-foreground">
              <button type="button" onClick={() => { setStep("email"); setCode(""); setErr(""); }} className="hover:text-foreground">Change email</button>
              <button type="button" disabled={cool > 0 || busy} onClick={() => void send()} className="hover:text-foreground disabled:opacity-50">{cool > 0 ? `Resend code in ${cool}s` : "Resend code"}</button>
            </div>
          </form>
        )}
        {hydrated && demoModeEnabled() && <Link to="/demo" className="mt-4 block text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground">Demo Mode (preview only)</Link>}
      </div>
    </div>
  );
}
