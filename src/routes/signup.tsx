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
      {
        name: "description",
        content:
          "Sign in to TheUnspoken with a one-time code sent to your email.",
      },
      {
        property: "og:title",
        content: "Sign in — TheUnspoken",
      },
      {
        property: "og:description",
        content:
          "Sign in to TheUnspoken with a one-time code sent to your email.",
      },
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

const [step, setStep] = useState<"email" | "code">(() =>
  typeof window !== "undefined" &&
  sessionStorage.getItem("unspoken-login-step") === "code"
    ? "code"
    : "email",
);
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

      const plan = String(session.plan ?? "").toUpperCase();

      if (plan.startsWith("SPRINT")) {
        navigate({
          to: "/sprint",
          replace: true,
        });
      } else if (plan.startsWith("PRACTICE")) {
        navigate({
          to: "/dashboard",
          replace: true,
        });
      } else {
        navigate({
          to: "/practice",
          replace: true,
        });
      }
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
      const message =
        error instanceof Error ? error.message : "";

      setErr(
        /not found|inactive|not allowed|account/i.test(message)
          ? "We couldn't find an account with this email. Try a free practice first — your account is created after your first answer."
          : "We couldn't send a code right now. Please try again in a minute.",
      );
    } finally {
      setBusy(false);
    }
  }

async function verify(e: React.FormEvent) {
  e.preventDefault();

  console.log("VERIFY BUTTON FIRED", {
    email,
    codeLength: code.length,
  });

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

        {step === "email" ? (
          <form
            onSubmit={send}
            className="glass glass-float rise space-y-4 p-7"
            noValidate
          >
            <h1 className="text-[28px] font-bold">Sign in</h1>

            <p className="text-[14px] text-muted-foreground">
              We'll email you a code. No password needed.
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

            {err && (
              <p className="text-[13px] text-destructive">
                {err}
              </p>
            )}

            <button
              className="btn btn-primary w-full"
              disabled={!hydrated || busy}
            >
              {busy ? "Sending…" : "Continue"}
            </button>

            <p className="text-center text-[13px] text-muted-foreground">
              New here?{" "}
              <Link to="/practice" className="text-primary">
                Try TheUnspoken free
              </Link>
            </p>
          </form>
        ) : (
          <form
            onSubmit={verify}
            className="glass glass-float rise space-y-4 p-7"
            noValidate
          >
            <h1 className="text-[28px] font-bold">
              Enter your code
            </h1>

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
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, ""))
              }
            />

            {err && (
              <p className="text-[13px] text-destructive">
                {err}
              </p>
            )}

            <button
              className="btn btn-primary w-full"
              disabled={busy || code.length < 6}
            >
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
                {cool > 0
                  ? `Resend code in ${cool}s`
                  : "Resend code"}
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
