// QA / product-inspection accounts. TEST DATA ONLY — fake +91 900000000x numbers, not real people.
// Demo Mode is environment-gated: shown only in local dev and the editor preview, never on the published site.
// Seeds write the same profile / entitlement / response records real users get, so every page runs the real entitlement checks.
import { A1, A2, rec } from "./demo";
import type { Entitlement } from "./entitlements";
import { setState, type State } from "./store";

export type DemoId = "free" | "practice" | "sprint";
export const DEMO_PASSWORD = "TheUnspokenDemo123!";
export const DEMO_ACCOUNTS: { id: DemoId; label: string; email: string; phone: string; entitlement: string; blurb: string }[] = [
  { id: "free", label: "Free Demo", email: "demo.free@unspoken.test", phone: "9000000001", entitlement: "FREE", blurb: "Free limits, locked previews, unlock CTAs." },
  { id: "practice", label: "Practice Demo", email: "demo.practice@unspoken.test", phone: "9000000002", entitlement: "PRACTICE_PAID · monthly", blurb: "Full practice, history, skills, drills, progress." },
  { id: "sprint", label: "Sprint Demo", email: "demo.sprint@unspoken.test", phone: "9000000003", entitlement: "SPRINT_PAID · 28 days", blurb: "Senior Interview Preparation Sprint, day 11." },
];

export function demoModeEnabled() {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h.startsWith("id-preview--") || h.endsWith("-dev.lovable.app");
}

const iso = (daysAgo: number) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString(); };
const day = (n: number) => iso(n).slice(0, 10);

const OVERTALK = "I think leading through ambiguity is really about a lot of things. In my last role we had a reorg and nobody really knew what the priorities were, and leadership kept changing direction. There were a lot of meetings and I tried to talk to everyone and understand all the perspectives. We also had some attrition. Eventually I wrote a short plan with the team and we focused on the two things we could control, and things settled down.";
const CRISP = "I give the team a fixed point even when the strategy isn't fixed. During our reorg I set a two-week plan with the two outcomes we owned, reviewed it every Friday, and said openly what we didn't know yet. We shipped both outcomes on time and lost nobody from the team that quarter.";
const MID = "I'd lead with the decision: we should pause the dashboard rebuild for two weeks. The data team's API change broke three sources, and fixing them first protects the quarter. Then I'd say what I need — one engineer for ten days.";

function base(id: DemoId, name: string): State {
  const a = DEMO_ACCOUNTS.find((x) => x.id === id)!;
  const created = iso(id === "free" ? 1 : id === "practice" ? 21 : 12);
  return {
    profile: { id: `demo_${id}`, name, email: a.email, phone: a.phone, phone_country_code: "+91", created_at: created, updated_at: created, goal: "Job Interview", struggle: "I lose my structure", experience: "5–15 years", level: id === "sprint" ? "Senior" : "Mid career", onboarded: true, plan: id },
    responses: [], drillsDone: [], practiceDays: [],
    lead: { name, email: a.email, phone: `+91 ${a.phone}`, captured_at: created },
    marketing: { consent: false, consent_at: null, unsubscribed: false },
  };
}

function ent(id: DemoId, extra: Partial<Entitlement>): Entitlement {
  const start = iso(id === "practice" ? 20 : 10);
  return { user_id: DEMO_ACCOUNTS.find((x) => x.id === id)!.email, product_type: id === "practice" ? "practice" : "sprint", plan_type: "", billing_frequency: null, status: "active", started_at: start, trial_started_at: null, trial_ends_at: null, expires_at: null, cancelled_at: null, ...extra };
}

export function seedDemoAccount(id: DemoId) {
  let s: State;
  if (id === "free") {
    s = base("free", "Priya");
    // One real free attempt already used on the stakeholder question; two remain.
    s.responses = [rec("free-1", "int-3", A1, 0, 1, 52, { structure: 42, clarity: 61, impact: 53, conciseness: 55 }, 23, undefined, "scatterer", "overexplainer")];
    s.freeAttemptsUsed = 1; s.practiceDays = [day(0)];
  } else if (id === "practice") {
    s = base("practice", "Arun");
    s.responses = [
      rec("pr-7", "int-3", A2, 1, 2, 38, { structure: 68, clarity: 76, impact: 69, conciseness: 73 }, 5, "pr-6", "structured", "overexplainer"),
      rec("pr-6", "int-3", A1, 1, 1, 52, { structure: 42, clarity: 61, impact: 53, conciseness: 55 }, 23, undefined, "scatterer", "overexplainer"),
      rec("pr-5", "pre-2", MID, 4, 1, 28, { structure: 63, clarity: 70 }, 3, undefined, "structured", "safe"),
      rec("pr-4", "evd-1", "Hi, so I wanted to give you a heads up about the dashboard project. There have been a few things going on with the data team and some of the APIs changed. We are probably going to be about two weeks late. I think we can still make the quarter if we prioritise.", 7, 1, 24, { structure: 51, impact: 48 }, 14, undefined, "context", "flat"),
      rec("pr-3", "pre-1", "Last quarter we grew revenue 22% while cutting support tickets by a third. Today I'll show what drove that, where we're still exposed, and the one decision I need from you.", 10, 1, 15, { structure: 74, clarity: 79 }, 1, undefined, "structured", "safe"),
      rec("pr-2", "con-1", "I've been here for three years and I've worked on many projects, including the onboarding launch and the pricing project, and I think I've grown a lot, and I was wondering if maybe we could talk about whether a promotion might be possible at some point.", 14, 1, 21, { confidence: 38, structure: 44 }, 17, undefined, "underseller", "flat"),
      rec("pr-1", "int-1", "So I studied engineering and then I joined a startup, and after that I moved into product, and I've done a few different roles across analytics and operations, and currently I'm a product manager working on payments, and before that there was a lot of variety in what I did.", 18, 1, 40, { structure: 40, conciseness: 47, memorability: 41 }, 19, undefined, "scatterer", "overexplainer"),
    ];
    s.practiceDays = [1, 4, 7, 10, 14, 18].map(day);
    s.drillsDone = ["five-sec", "cut-30"];
    s.drillResults = {
      "five-sec": { skill: "structure", first_score: 46, last_score: 66, first_delay: 14, last_delay: 3, attempts: 3, at: iso(5) },
      "cut-30": { skill: "conciseness", first_score: 52, last_score: 68, first_delay: 9, last_delay: 4, attempts: 2, at: iso(9) },
    };
    s.entitlement = ent("practice", { plan_type: "practice", billing_frequency: "monthly" });
  } else {
    s = base("sprint", "Meera");
    s.responses = [
      rec("sp-6", "int-6", CRISP, 0, 2, 34, { structure: 68, clarity: 74, conciseness: 72, impact: 66 }, 5, "sp-1", "structured", "safe"),
      rec("sp-5", "int-3", A2, 2, 2, 38, { structure: 66, clarity: 75, impact: 69, conciseness: 71 }, 5, "sp-4", "structured", "overexplainer"),
      rec("sp-4", "int-3", A1, 3, 1, 52, { structure: 47, clarity: 62, impact: 54, conciseness: 56 }, 18, undefined, "scatterer", "overexplainer"),
      rec("sp-3", "imp-1", "We were about to renew a vendor contract by default. I asked for one week to compare two alternatives, and switching saved 18% and cut onboarding from six weeks to three. The main thing I did was force a decision instead of a renewal.", 5, 1, 30, { structure: 58, impact: 64 }, 9, undefined, "context", "safe"),
      rec("sp-2", "int-2", "I think I bring a lot of experience across different areas and I've worked with many kinds of teams, so I can adapt quickly, and I'm also very passionate about this space and I've followed the company for a while.", 7, 1, 26, { structure: 45, impact: 44, confidence: 49 }, 15, undefined, "scatterer", "flat"),
      rec("sp-1", "int-6", OVERTALK, 10, 1, 58, { structure: 42, clarity: 58, conciseness: 50, impact: 49 }, 23, undefined, "scatterer", "overexplainer"),
    ];
    s.practiceDays = [0, 2, 3, 5, 7, 8, 10].map(day);
    s.drillsDone = ["five-sec", "result-first", "three-steps"];
    s.drillResults = {
      "five-sec": { skill: "structure", first_score: 44, last_score: 67, first_delay: 16, last_delay: 4, attempts: 3, at: iso(8) },
      "result-first": { skill: "impact", first_score: 49, last_score: 65, first_delay: 12, last_delay: 5, attempts: 2, at: iso(6) },
      "three-steps": { skill: "structure", first_score: 55, last_score: 66, first_delay: 8, last_delay: 4, attempts: 2, at: iso(4) },
    };
    s.entitlement = ent("sprint", { plan_type: "sprint-28d", sprint: { duration: "28d", goal: "interview", goal_text: "Senior Interview Preparation", start_date: day(10), end_date: iso(-18).slice(0, 10), status: "active" } });
  }
  setState(() => s);
}

/** Sign-in form hook: returns the demo id for valid demo credentials when Demo Mode is enabled. */
export function matchDemoLogin(email: string, password: string): DemoId | null {
  if (!demoModeEnabled() || password !== DEMO_PASSWORD) return null;
  return DEMO_ACCOUNTS.find((a) => a.email === email.trim().toLowerCase())?.id ?? null;
}
