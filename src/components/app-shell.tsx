import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Flame } from "lucide-react";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme";
import { streak, useStore } from "@/lib/store";
import { STATE_LABEL, useEntitlement } from "@/lib/entitlements";

export function useHydrated() {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}

export function Logo() {
  return <Link to="/" className="font-display text-[19px] font-bold tracking-tight">unspoken</Link>;
}

const NAV = [
  { to: "/practice", label: "Practice" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/responses", label: "My Responses" },
  { to: "/skills", label: "Skills" },
  { to: "/drills", label: "Drills" },
  { to: "/progress", label: "Progress" },
] as const;


export function AppShell({ children, allowGuest = false }: { children: ReactNode; allowGuest?: boolean }) {
  const { state, has } = useEntitlement();
  const hydrated = useHydrated();
  const profile = useStore((s) => s.profile);
  const days = useStore((s) => s.practiceDays);
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated) return;
    if (!profile) { if (!allowGuest) navigate({ to: "/signup" }); }
    else if (!profile.onboarded && !allowGuest) navigate({ to: "/onboarding" });
  }, [hydrated, profile, navigate, allowGuest]);

  if (!hydrated || (!allowGuest && !profile?.onboarded)) return <div className="min-h-screen" />;

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-glass backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 text-[13px] text-muted-foreground md:flex">
            {[...NAV, ...(has("sprint") ? [{ to: "/sprint", label: "Sprint" } as const] : [])].map((n) => (
              <Link key={n.to} to={n.to} className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>{n.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/plans" className="hidden rounded-full border border-border px-3 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground sm:inline">{STATE_LABEL[state]}</Link>
            {profile ? <>
              <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-mono text-[12px]"><Flame className="size-3.5 text-primary" />{streak(days)}</span>
              <Link to="/profile" className="grid size-8 place-items-center rounded-full bg-secondary font-display text-[13px] font-bold">{profile.name.slice(0, 1).toUpperCase()}</Link>
            </> : <Link to="/signup" search={{ mode: "signin" }} className="text-[13px] text-muted-foreground hover:text-foreground">Sign in</Link>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-5 py-8 md:px-8 md:py-12">{children}</main>
      <MobileNav />
    </div>
  );
}

export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><div className="eyebrow mb-2">{eyebrow}</div><h1 className="text-[clamp(28px,4vw,40px)] font-bold">{title}</h1></div>
      {children}
    </div>
  );
}
