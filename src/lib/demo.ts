import { heuristicProvider } from "./analysis";
import type { Dimension } from "./data";
import { QUESTIONS } from "./data";
import { startPracticeTrial } from "./entitlements";
import { setState, type ResponseRecord, type State } from "./store";

export const A1 = "So, at my last company we had a big migration project and there were a lot of teams involved. The project had started before I joined and there were already some issues with timelines. There was one stakeholder, the head of finance operations, who was quite unhappy because their reports kept breaking. We had many meetings and I basically tried to understand everything that was going on, like the systems and the dependencies. There were also some vendor issues and the budget was kind of tight. Eventually I set up a weekly review with her and we started tracking the issues together. After some time things got better and she was happier with the project.";
export const A2 = "I turned an unhappy finance head into one of the project's strongest supporters by giving her visibility and a say in priorities. Her month-end reports were breaking during our migration, and she had escalated twice. I set up a 20-minute weekly review where she ranked the top three issues. Within six weeks report failures dropped by 80%, and she sponsored our next phase in the budget review.";

export function rec(id: string, qid: string, transcript: string, daysAgo: number, attempt: number, duration: number, over: Partial<Record<Dimension, number>>, delay: number, parent?: string, primary?: string, secondary?: string): ResponseRecord {
  const q = QUESTIONS.find((x) => x.id === qid)!;
  const a = heuristicProvider({ question: q.text, transcript, mode: q.mode, level: "Mid career", durationSec: duration, responseType: "voice" });
  Object.entries(over).forEach(([k, v]) => { a.scores[k as Dimension] = v!; a.dimensions[k as Dimension].score = v!; });
  a.overall = Math.round(Object.values(a.scores).reduce((x, y) => x + y, 0) / 8);
  a.main_point_delay = delay;
  if (primary) a.primary_pattern = primary;
  if (secondary) a.secondary_pattern = secondary;
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return { id, question_id: qid, question: q.text, mode: q.mode, response_type: "voice", transcript, duration, created_at: d.toISOString(), attempt, parent_id: parent, analysis: a };
}

export function seedDemo(name = "Arun", email = "arun@example.com") {
  const days: string[] = [];
  for (let i = 1; i <= 4; i++) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().slice(0, 10)); }
  const responses: ResponseRecord[] = [
    rec("demo-2", "int-3", A2, 1, 2, 38, { structure: 68, clarity: 76, impact: 69, conciseness: 73 }, 5, "demo-1", "structured", "overexplainer"),
    rec("demo-1", "int-3", A1, 1, 1, 52, { structure: 42, clarity: 61, impact: 53, conciseness: 55 }, 23, undefined, "scatterer", "overexplainer"),
    rec("demo-3", "evd-1", "Hi, so I wanted to give you a heads up about the dashboard project. There have been a few things going on with the data team and some of the APIs changed. We are probably going to be about two weeks late. I think we can still make the quarter if we prioritise.", 2, 1, 24, { structure: 51, impact: 48 }, 14, undefined, "context", "flat"),
    rec("demo-4", "pre-1", "Last quarter we grew revenue 22% while cutting support tickets by a third. Today I'll show what drove that, where we're still exposed, and the one decision I need from you.", 3, 1, 15, { structure: 78, clarity: 81 }, 1, undefined, "structured", "safe"),
    rec("demo-5", "con-1", "I've been here for three years and I've worked on many projects, including the onboarding launch and the pricing project, and I think I've grown a lot, and I was wondering if maybe we could talk about whether a promotion might be possible at some point.", 4, 1, 21, { confidence: 38, structure: 44 }, 17, undefined, "underseller", "flat"),
  ];
  const s: State = {
    profile: { name, email, goal: "Job Interview", struggle: "I lose my structure", experience: "5–15 years", level: "Mid career", onboarded: true, plan: "free" },
    responses, drillsDone: ["five-sec"], practiceDays: days,
  };
  setState(() => s);
  startPracticeTrial("monthly"); // demo account runs on a real Practice trial entitlement
}
