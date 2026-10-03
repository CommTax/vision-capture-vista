import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo, useHydrated } from "@/components/app-shell";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, demoModeEnabled, seedDemoAccount } from "@/lib/demo-accounts";

export const Route = createFileRoute("/demo")({
  head: () => ({ meta: [{ title: "Demo Mode — Cadence" }, { name: "description", content: "Internal QA accounts for inspecting Cadence plans." }, { name: "robots", content: "noindex" }, { property: "og:title", content: "Demo Mode — Cadence" }, { property: "og:description", content: "Internal QA accounts." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Demo,
});

function Demo() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  if (!hydrated) return null;
  if (!demoModeEnabled()) return <div className="grid min-h-screen place-items-center px-5 text-center"><div><p className="text-muted-foreground">This page isn't available.</p><Link to="/" className="btn btn-ghost mt-4">Home</Link></div></div>;
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="mb-8"><Logo /></div>
      <div className="eyebrow mb-2 !text-primary">Demo Mode · preview only</div>
      <h1 className="text-[30px] font-bold">Inspect Cadence by plan</h1>
      <p className="mt-2 text-[14px] text-muted-foreground">Each account loads seeded test data and runs through the normal plan checks. Loading one replaces what's saved in this browser. Password for all: <span className="font-mono">{DEMO_PASSWORD}</span></p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {DEMO_ACCOUNTS.map((a) => (
          <div key={a.id} className="glass flex flex-col p-5">
            <div className="font-display text-[18px] font-bold">{a.label}</div>
            <div className="mt-1 font-mono text-[11px] text-primary">{a.entitlement}</div>
            <div className="mt-2 break-all text-[12px] text-muted-foreground">{a.email}<br />+91 {a.phone} (test)</div>
            <p className="mt-2 flex-1 text-[13px] text-muted-foreground">{a.blurb}</p>
            <button className="btn btn-primary btn-sm mt-4" onClick={() => { seedDemoAccount(a.id); navigate({ to: a.id === "sprint" ? "/sprint" : "/dashboard" }); }}>Open {a.label}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
