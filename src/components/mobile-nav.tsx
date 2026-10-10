import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Home,
  Mic,
  BookOpen,
  Menu,
  Lock,
  ArrowRight,
  Sparkles,
  History,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useEntitlement } from "@/lib/entitlements";
import { dataProvider } from "@/services/data-provider";
import { getSessionToken } from "@/lib/backend-auth";

type Item = {
  label: string;
  to?: string;
  hash?: string;
  href?: string;
  locked?: boolean;
  highlight?: boolean;
};

type NavState = "guest" | "free" | "paid";

/**
 * Determine which of the three nav states the user is in.
 *  - guest: no token
 *  - free:  token exists + plan is free
 *  - paid:  token exists + plan is paid (Sprint or Practice Pass)
 *
 * Uses the token as the ground truth for "signed in", so this is
 * stable on the first paint (no flicker while the store hydrates).
 */
function useNavState(): NavState {
  // Synchronous — read the token once on mount.
  const [token] = useState<string | null>(() => getSessionToken());

  // useEntitlement reads the cached plan hint synchronously on first
  // render, so `free` is accurate from the first paint.
  const { free } = useEntitlement();

  // No token → guest. Regardless of any stale store state.
  if (!token) return "guest";

  // Token exists → at minimum a free user. Paid if the plan hint says so.
  return free ? "free" : "paid";
}

export function MobileNav() {
  const navState = useNavState();
  const { has } = useEntitlement();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const email = dataProvider.getHomepageContent().contact.email;

  // ── Tabs per state ───────────────────────────────────────────
  const tabs =
    navState === "guest"
      ? ([
          { to: "/", label: "Home", icon: Home },
          { to: "/practice", label: "Practice", icon: Mic },
          { href: "/university/index.html", label: "Learn", icon: BookOpen },
          { more: true, label: "More", icon: Menu },
        ] as const)
      : navState === "free"
        ? ([
            { to: "/dashboard", label: "Home", icon: Home },
            { to: "/practice", label: "Practice", icon: Mic },
            { to: "/plans", label: "Upgrade", icon: Sparkles },
            { more: true, label: "More", icon: Menu },
          ] as const)
        : ([
            { to: "/dashboard", label: "Home", icon: Home },
            { to: "/practice", label: "Practice", icon: Mic },
            { to: "/responses", label: "History", icon: History },
            { more: true, label: "More", icon: Menu },
          ] as const);

  // ── Drawer groups per state ──────────────────────────────────
  const groups: { title: string; items: Item[] }[] =
    navState === "guest"
      ? [
          {
            title: "Explore",
            items: [
              { label: "How it works", to: "/", hash: "how" },
              { label: "Practice moments", to: "/", hash: "modes" },
              { label: "Pricing", to: "/", hash: "pricing" },
              { label: "Questions", to: "/", hash: "faq" },
            ],
          },
          {
            title: "Account",
            items: [
              { label: "Sign in", to: "/signup" },
              { label: "Contact", href: `mailto:${email}` },
            ],
          },
        ]
      : navState === "free"
        ? [
            {
              title: "Practice",
              items: [
                { label: "Dashboard", to: "/dashboard" },
                { label: "My Responses", to: "/responses" },
                { label: "Drills", to: "/drills", locked: true },
                { label: "Skills", to: "/skills", locked: true },
                { label: "Progress", to: "/progress", locked: true },
              ],
            },
            {
              title: "Account",
              items: [
                { label: "Profile", to: "/profile" },
                { label: "Upgrade your plan", to: "/plans", highlight: true },
                { label: "Contact", href: `mailto:${email}` },
              ],
            },
          ]
        : [
            ...(has("sprint")
              ? [
                  {
                    title: "Your Sprint",
                    items: [
                      { label: "Sprint", to: "/sprint", highlight: true },
                    ],
                  },
                ]
              : []),
            {
              title: "Practice",
              items: [
                { label: "Dashboard", to: "/dashboard" },
                { label: "My Responses", to: "/responses" },
                { label: "Drills", to: "/drills" },
                { label: "Skills", to: "/skills" },
                { label: "Progress", to: "/progress" },
              ],
            },
            {
              title: "Account",
              items: [
                { label: "Profile", to: "/profile" },
                { label: "Plan", to: "/plans" },
                { label: "Contact", href: `mailto:${email}` },
              ],
            },
          ];

  const go = (i: Item) => {
    setOpen(false);
    if (i.href) {
      window.location.href = i.href;
      return;
    }
    if (i.to) {
      navigate({
        to: i.to,
        hash: i.hash,
        ...(i.label === "Sign in" ? { search: { mode: "signin" } } : {}),
      } as never);
    }
  };

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-popover/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;

          // "More" opens the drawer
          if ("more" in tab && tab.more) {
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={open}
                className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground"
              >
                <Icon className="size-5" aria-hidden />
                {tab.label}
              </button>
            );
          }

          // External href (guest → Learn → University)
          if ("href" in tab && tab.href) {
            return (
              <a
                key={tab.label}
                href={tab.href}
                className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground"
              >
                <Icon className="size-5" aria-hidden />
                {tab.label}
              </a>
            );
          }

          // Internal route (TanStack Link)
          return (
            <Link
              key={tab.label}
              to={tab.to as string}
              activeOptions={{ exact: tab.to === "/" }}
              className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <Icon className="size-5" aria-hidden />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="border-border bg-popover pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <DrawerTitle className="sr-only">More</DrawerTitle>
          <DrawerDescription className="sr-only">
            All destinations
          </DrawerDescription>
          <div className="max-h-[70vh] space-y-6 overflow-y-auto px-5 pt-4">
            {groups.map((g) => (
              <div key={g.title}>
                <div className="eyebrow mb-2">{g.title}</div>
                <ul className="divide-y divide-border rounded-2xl border border-border">
                  {g.items.map((i) => (
                    <li key={i.label}>
                      <button
                        type="button"
                        onClick={() => go(i)}
                        className={`flex min-h-12 w-full items-center justify-between px-4 text-left text-[15px] ${
                          i.highlight ? "text-primary" : ""
                        }`}
                      >
                        <span>{i.label}</span>
                        {i.locked ? (
                          <Lock
                            className="size-3.5 text-muted-foreground"
                            aria-label="Preview"
                          />
                        ) : (
                          <ArrowRight
                            className="size-4 text-muted-foreground"
                            aria-hidden
                          />
                        )}
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
