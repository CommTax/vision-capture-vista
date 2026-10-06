import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Logo, useHydrated } from "@/components/app-shell";
import {
  getBackendSession,
  requestOtp,
  verifyOtp,
} from "@/lib/backend-auth";
import { demoModeEnabled } from "@/lib/demo-accounts";

export const Route = createFileRoute("/signup")({
  validateSearch: z.object({
    mode: z.enum(["signup", "signin"]).optional(),
  }),
  head: () => ({
    meta: [
      { title: "Sign in — TheUnspoken" },
      { name: "description", content: "Sign in to TheUnspoken with a one-time code sent to your email." },
      { property: "og:title", content: "Sign in — TheUnspoken" },
      { property: "og:description", content: "Sign in to TheUnspoken with a one-time code sent to your email." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const hydrated = useHydrated();

  const [email, setEmail] = useState(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("unspoken-login-email") || ""
      : "",
  );

  const [code, setCode] = useState("");

  // "email" → input email
  // "code"  → OTP step
  // "noplan"→ backend said no paid plan for this email
  const [step, setStep] = useState<"email" | "code" | "noplan">(() => {
    if (typeof window === "undefined") return "email";
    return sessionStorage.getItem("unspoken-login-step") === "code" ? "code" : "email";
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [cool, setCool] = useState(0);

  useEffect(() => {
    if (cool <= 0) return;
    const t = setTimeout(() => setCool((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cool]);

  async function route() {
    try {
      const session = await getBackendSession();

      if (!session) {
        setErr("Your session could not be loaded. Please try signing in again.");
        return;
      }

      navigate({ to: "/practice", replace: true });
    } catch {
      setErr("We couldn't load your account. Please try again.");
    }
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setErr("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setErr("Please enter a valid email.");
      return;
    }

    setBusy(true);

    try {
      await requestOtp(normalizedEmail);

      sessionStorage.setItem("unspoken-login-email", normalizedEmail);
      sessionStorage.setItem("unspoken-login-step", "code");

      setEmail(normalizedEmail);
      setStep("code");
      setCool(60);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      // The backend returns 403 for two distinct cases:
      //   "No account with that email."       → brand-new visitor
      //   "This is a free account. ..."       → existing free user
      // Both mean: no *paid* account here. Show the no-plan screen.
      const isNoPlan =
        /no account|no active plan|free account|not allowed|not found|inactive/i.test(message);

      if (isNoPlan) {
        sessionStorage.setItem("unspoken-login-email", normalizedEmail);
        sessionStorage.removeItem("unspoken-login-step");
        setEmail(normalizedEmail);
        setStep("noplan");
      } else {
        setErr("We couldn't send a code right now. Please try again in a minute.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();

    setErr("");
    setBusy(true);

    try {
      await verifyOtp(email.trim().toLowerCase(), code.trim());

      sessionStorage.removeItem("unspoken-login-step");
      sessionStorage.removeItem("unspoken-login-email");

      await route();
    } catch {
      setBusy(false);
      setErr("That code didn't work. Check it, or send a new one.");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo />
        </div>

        {step === "email" && (
          <form onSubmit={send} className="glass glass-float rise space-y-4 p-7" noValidate>
            <h1 className="text-[28px] font-bold">Sign in</h1>

            <p className="text-[14px] text-muted-foreground">
              Sign in to your paid account. We'll email you a code.
            </p>

            <input
              className="field"
              type="email"
              autoComplete="email"
              placeholder="Email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {err && <p className="text-[13px] text-destructive">{err}</p>}

            <button className="btn btn-primary w-full" disabled={!hydrated || busy}>
              {busy ? "Sending…" : "Continue"}
            </button>

            <p className="text-center text-[13px] text-muted-foreground">
              New here?{" "}
              <Link to="/practice" className="text-primary">
                Try TheUnspoken free
              </Link>
            </p>
          </form>
        )}

        {step === "noplan" && (
          <div className="glass glass-float rise space-y-4 p-7">
            <h1 className="text-[28px] font-bold leading-tight">
              We don't see an active account for this email
            </h1>

            <p className="text-[14px] text-muted-foreground">
              There's no paid plan linked to <span className="text-foreground">{email}</span>.
              You can choose a plan to unlock the full experience, or continue with the free
              version — the same product with a lifetime cap of 5 responses.
            </p>

<Link to="/checkout" search={{ product: "practice" }} className="btn btn-primary w-full">
  Create a paid account →
</Link>

            <Link to="/practice" className="btn btn-ghost w-full">
              Try TheUnspoken free
            </Link>

            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem("unspoken-login-email");
                setStep("email");
                setErr("");
              }}
              className="block w-full text-center text-[13px] text-muted-foreground hover:text-foreground"
            >
              Use a different email
            </button>
          </div>
        )}

        {step === "code" && (
          <form onSubmit={verify} className="glass glass-float rise space-y-4 p-7" noValidate>
            <h1 className="text-[28px] font-bold">Enter your code</h1>

            <p className="text-[14px] text-muted-foreground">
              Sent to {email}. You can also open the link in that email.
            </p>

            <input
              className="field text-center font-mono text-[22px] tracking-[0.4em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              placeholder="••••••"
              aria-label="Code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />

            {err && <p className="text-[13px] text-destructive">{err}</p>}

            <button className="btn btn-primary w-full" disabled={busy || code.length < 6}>
              {busy ? "Checking…" : "Verify"}
            </button>

            <div className="flex justify-between text-[13px] text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem("unspoken-login-step");
                  sessionStorage.removeItem("unspoken-login-email");
                  setStep("email");
                  setCode("");
                  setErr("");
                }}
                className="hover:text-foreground"
              >
                Change email
              </button>

              <button
                type="button"
                disabled={cool > 0 || busy}
                onClick={() => void send()}
                className="hover:text-foreground disabled:opacity-50"
              >
                {cool > 0 ? `Resend code in ${cool}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}

        {hydrated && demoModeEnabled() && (
          <Link
            to="/demo"
            className="mt-4 block text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Demo Mode (preview only)
          </Link>
        )}
      </div>
    </div>
  );
}
