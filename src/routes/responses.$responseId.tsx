import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AnalysisView, ComparePanel } from "@/components/analysis-view";
import { modeName } from "@/lib/data";
import { AICoach } from "@/components/ai-coach";
import { useStore } from "@/lib/store";
import { useEntitlement } from "@/lib/entitlements";
import { FreeResult } from "@/components/plan-gate";

export const Route = createFileRoute("/responses/$responseId")({
  head: () => ({ meta: [{ title: "Response analysis — TheUnspoken" }, { name: "description", content: "Detailed analysis of a practiced response." }, { property: "og:title", content: "Response analysis — TheUnspoken" }, { property: "og:description", content: "Pattern, what got lost, and how to improve." }] }),
  component: () => <AppShell><Detail /></AppShell>,
});

function Detail() {
  const { responseId } = Route.useParams();
  const rs = useStore((s) => s.responses);
  const level = useStore((s) => s.profile?.level ?? "Mid career");
  const { free } = useEntitlement();
  const canCoach = !free;
  const r = rs.find((x) => x.id === responseId);
  if (!r) return <div className="glass p-10 text-center">Response not found. <Link to="/responses" className="text-primary">Back to responses</Link></div>;
  const newest = [...rs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (free && newest?.id !== r.id) return <LockedResponse />;
  const parent = r.parent_id ? rs.find((x) => x.id === r.parent_id) : undefined;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><Link to="/responses" className="font-mono text-[12px] text-muted-foreground">← My Responses</Link><div className="eyebrow mt-3">{modeName(r.mode)} · Attempt {r.attempt} · {new Date(r.created_at).toLocaleString()}</div><h1 className="mt-1 text-[26px] font-bold">{r.question}</h1></div>
        {r.question_id !== "custom" && <Link to="/practice/$questionId" params={{ questionId: r.question_id }} search={{ retry: parent?.id ?? r.id }} className="btn btn-primary">Try Again</Link>}
      </div>
      {r.audio_url?.startsWith("blob:") && <audio controls src={r.audio_url} className="w-full" />}
      {parent && !free && <ComparePanel a1={parent.analysis} a2={r.analysis} />}
      {canCoach && <AICoach r={r} level={level} />}
      {free ? <FreeResult a={r.analysis} transcript={r.transcript} /> : <AnalysisView a={r.analysis} transcript={r.transcript} />}
    </div>
  );
}

function LockedResponse() {
  return <div className="mx-auto max-w-2xl"><Link to="/responses" className="font-mono text-[12px] text-muted-foreground">← My Responses</Link><div className="mt-6"><FreeHistoryLock /></div></div>;
}

function FreeHistoryLock() {
  return <div className="glass p-8 text-center"><h1 className="text-[26px] font-bold">This response is in your full history</h1><p className="mx-auto mt-3 max-w-md text-[14px] text-muted-foreground">Unlock saved responses, detailed evidence, and attempt comparisons.</p><Link to="/plans" className="btn btn-primary mt-5">Unlock response history</Link></div>;
}
