import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Home, Mic, BookOpen, Menu, Lock, ArrowRight } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useStore } from "@/lib/store";
import { useEntitlement } from "@/lib/entitlements";
import { dataProvider } from "@/services/data-provider";

type Item = { label: string; to?: string; hash?: string; href?: string; locked?: boolean; highlight?: boolean };

/** One entitlement-aware bottom navigation shared by every user state (logged out, Free, Practice, Sprint). */
export function MobileNav() {
  const signedIn = useStore((s) => !!s.profile?.onboarded);
  const { free, has } = useEntitlement();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const email = dataProvider.getHomepageContent().contact.email;

  const groups: { title: string; items: Item[] }[] = signedIn
    ? [
        ...(has("sprint") ? [{ title: "Your Sprint", items: [{ label: "Sprint", to: "/sprint", highlight: true }] }] : []),
        { title: "Practice", items: [
          { label: "Dashboard", to: "/dashboard" },
          { label: "My Responses", to: "/responses", locked: free },
          { label: "Skills", to: "/skills", locked: free },
          { label: "Progress", to: "/progress", locked: free },
          { label: "Drills", to: "/drills", locked: free },
        ] },
        { title: "Account", items: [
          { label: "Profile", to: "/profile" },
          { label: free ? "Unlock your practice path" : "Plan", to: "/plans", highlight: free },
          { label: "Contact", href: `mailto:${email}` },
        ] },
      ]
    : [
        { title: "Explore", items: [
          { label: "How it works", to: "/", hash: "how" },
          { label: "Practice moments", to: "/", hash: "modes" },
          { label: "Pricing", to: "/", hash: "pricing" },
          { label: "Questions", to: "/", hash: "faq" },
        ] },
        { title: "Account", items: [
          { label: "Sign in", to: "/signup" },
          { label: "Contact", href: `mailto:${email}` },
        ] },
      ];

  // Home + Practice are always present. The third tab is conditional:
  // signed in → Drills; signed out → University (labelled "Learn").
  const tabs = [
    { to: signedIn ? "/dashboard" : "/", label: "Home", icon: Home },
    { to: "/practice", label: "Practice", icon: Mic },
  ] as const;

  const go = (i: Item) => {
    setOpen(false);
    if (i.href) { window.location.href = i.href; return; }
    if (i.to) navigate({ to: i.to, hash: i.hash, ...(i.label === "Sign in" ? { search: { mode: "signin" } } : {}) } as never);
  };

  return (
    <>
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-popover/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        {tabs.map(({ to, label, icon: Icon }) => (
          <Link key={label} to={to} activeOptions={{ exact: to === "/" }} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground" activeProps={{ className: "text-primary" }}>
            <Icon className="size-5" aria-hidden />{label}
          </Link>
        ))}

        {signedIn ? (
          <Link
            to="/drills"
            className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <BookOpen className="size-5" aria-hidden />Drill
          </Link>
        ) : (
          <a
            href="/university/index.html"
            className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground"
          >
            <BookOpen className="size-5" aria-hidden />Learn
          </a>
        )}

        <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground">
          <Menu className="size-5" aria-hidden />More
        </button>
      </nav>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="border-border bg-popover pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <DrawerTitle className="sr-only">More</DrawerTitle>
          <DrawerDescription className="sr-only">All destinations</DrawerDescription>
          <div className="max-h-[70vh] space-y-6 overflow-y-auto px-5 pt-4">
            {groups.map((g) => (
              <div key={g.title}>
                <div className="eyebrow mb-2">{g.title}</div>
                <ul className="divide-y divide-border rounded-2xl border border-border">
                  {g.items.map((i) => (
                    <li key={i.label}>
                      <button type="button" onClick={() => go(i)} className={`flex min-h-12 w-full items-center justify-between px-4 text-left text-[15px] ${i.highlight ? "text-primary" : ""}`}>
                        <span>{i.label}</span>
                        {i.locked ? <Lock className="size-3.5 text-muted-foreground" aria-label="Preview" /> : <ArrowRight className="size-4 text-muted-foreground" aria-hidden />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
