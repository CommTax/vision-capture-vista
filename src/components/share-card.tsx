import { useEffect, useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";

export type ShareCardData = { title: string; line: string; lost: string; focus: string };

const S = 1080;

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(/\s+/); const lines: string[] = []; let cur = "";
  for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (ctx.measureText(t).width > max && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}

/** Draws the 1080×1080 pattern card. Never includes contact details. */
export function drawCard(c: HTMLCanvasElement, d: ShareCardData) {
  c.width = S; c.height = S;
  const ctx = c.getContext("2d")!;
  const ink = "#1f2433", soft = "#6b6f7d", amber = "#d98a2b";
  ctx.fillStyle = "#f7f2ea"; ctx.fillRect(0, 0, S, S);
  // graphic detail: soft amber sun + fine rules
  const g = ctx.createRadialGradient(880, 200, 10, 880, 200, 420);
  g.addColorStop(0, "rgba(217,138,43,0.32)"); g.addColorStop(1, "rgba(217,138,43,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = "rgba(31,36,51,0.08)"; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(880, 200, 120 + i * 60, 0, Math.PI * 2); ctx.stroke(); }
  const pad = 96;
  ctx.fillStyle = ink; ctx.font = "700 34px 'Space Grotesk', sans-serif"; ctx.fillText("unspoken", pad, 140);
  ctx.fillStyle = soft; ctx.font = "500 24px 'JetBrains Mono', monospace"; ctx.fillText("MY COMMUNICATION PATTERN", pad, 300);
  ctx.fillStyle = ink; ctx.font = "700 92px 'Space Grotesk', sans-serif";
  let y = 410; for (const l of wrap(ctx, d.title, S - pad * 2)) { ctx.fillText(l, pad, y); y += 100; }
  ctx.fillStyle = amber; ctx.fillRect(pad, y - 40, 72, 6); y += 30;
  ctx.fillStyle = ink; ctx.font = "italic 400 38px 'Inter', sans-serif";
  for (const l of wrap(ctx, `“${d.line}”`, S - pad * 2)) { ctx.fillText(l, pad, y); y += 52; }
  y = Math.max(y + 40, 760);
  const col = (S - pad * 2 - 48) / 2;
  const block = (x: number, label: string, body: string) => {
    ctx.fillStyle = soft; ctx.font = "500 22px 'JetBrains Mono', monospace"; ctx.fillText(label, x, y);
    ctx.fillStyle = ink; ctx.font = "500 28px 'Inter', sans-serif";
    let yy = y + 44; for (const l of wrap(ctx, body, col).slice(0, 3)) { ctx.fillText(l, x, yy); yy += 38; }
  };
  block(pad, "WHAT GOT LOST", d.lost);
  block(pad + col + 48, "WHAT I'M WORKING ON", d.focus);
  ctx.strokeStyle = "rgba(31,36,51,0.15)"; ctx.beginPath(); ctx.moveTo(pad, 980); ctx.lineTo(S - pad, 980); ctx.stroke();
  ctx.fillStyle = soft; ctx.font = "500 24px 'Inter', sans-serif"; ctx.fillText("Practice. See what got lost. Say it again.", pad, 1024);
}

export function ShareCard({ data }: { data: ShareCardData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    let off = false;
    void document.fonts?.ready.then(() => { if (off || !ref.current) return; drawCard(ref.current, data); setUrl(ref.current.toDataURL("image/png")); });
    return () => { off = true; };
  }, [data]);

  const blob = () => new Promise<Blob | null>((r) => ref.current?.toBlob(r, "image/png"));
  async function share() {
    setMsg("");
    const b = await blob(); if (!b) return;
    const file = new File([b], "my-unspoken-pattern.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "My communication pattern", text: `My communication pattern: ${data.title}` }); } catch { /* cancelled */ }
    } else setMsg("Sharing isn't supported in this browser — download the card instead.");
  }

  return (
    <div className="space-y-4">
      <canvas ref={ref} className="hidden" />
      {url ? <img src={url} alt={`Pattern card: ${data.title}`} className="mx-auto aspect-square w-full max-w-[420px] rounded-[20px] border border-border shadow-[var(--shadow-float)]" /> : <div className="mx-auto aspect-square w-full max-w-[420px] animate-pulse rounded-[20px] bg-muted" />}
      <div className="flex flex-wrap justify-center gap-3">
        <a className="btn btn-primary" href={url} download="my-unspoken-pattern.png"><Download className="size-4" />Download</a>
        <button className="btn btn-ghost" onClick={share}><Share2 className="size-4" />Share</button>
      </div>
      {msg && <p className="text-center text-[13px] text-muted-foreground">{msg}</p>}
    </div>
  );
}
