import { useEffect, useRef, useState } from "react";
import { Download, Instagram, MessageCircle, Share2 } from "lucide-react";
import qrAsset from "@/assets/instagram-qr.png.asset.json";

export type ShareCardData = { title: string; line: string; lost: string; focus: string; code?: string; handle?: string };
type Format = "square" | "story";

const W = 1080;

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(/\s+/); const lines: string[] = []; let cur = "";
  for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (ctx.measureText(t).width > max && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}

/** Draws the pattern card (square for feeds, 9:16 for Stories/Status). Never includes contact details. */
export function drawCard(c: HTMLCanvasElement, d: ShareCardData, format: Format = "square", qr?: HTMLImageElement | null) {
  const H = format === "story" ? 1920 : 1080;
  const top = format === "story" ? 360 : 0;
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  const ink = "#17181C", soft = "#70747D", accent = "#3157E8";
  ctx.fillStyle = "#F8F7F3"; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(880, 200 + top, 10, 880, 200 + top, 460);
  g.addColorStop(0, "rgba(49,87,232,0.16)"); g.addColorStop(1, "rgba(49,87,232,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(23,24,28,0.08)"; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(880, 200 + top, 120 + i * 60, 0, Math.PI * 2); ctx.stroke(); }
  const pad = 96;
  ctx.fillStyle = ink; ctx.font = "700 34px 'Space Grotesk', sans-serif"; ctx.fillText("unspoken", pad, 140 + (format === "story" ? 60 : 0));
  if (format === "story") { ctx.fillStyle = soft; ctx.font = "500 36px 'DM Sans', sans-serif"; ctx.fillText("I found out how I really come across.", pad, 360); }
  ctx.fillStyle = soft; ctx.font = "500 24px 'JetBrains Mono', monospace"; ctx.fillText("MY COMMUNICATION PATTERN", pad, 300 + top);
  ctx.fillStyle = ink; ctx.font = "700 92px 'Space Grotesk', sans-serif";
  let y = 410 + top; for (const l of wrap(ctx, d.title, W - pad * 2)) { ctx.fillText(l, pad, y); y += 100; }
  ctx.fillStyle = accent; ctx.fillRect(pad, y - 40, 72, 6); y += 30;
  ctx.fillStyle = ink; ctx.font = "italic 400 38px 'DM Sans', sans-serif";
  for (const l of wrap(ctx, `“${d.line}”`, W - pad * 2)) { ctx.fillText(l, pad, y); y += 52; }
  y = Math.max(y + 40, 760 + top);
  const col = (W - pad * 2 - 48) / 2;
  const block = (x: number, label: string, body: string) => {
    ctx.fillStyle = soft; ctx.font = "500 22px 'JetBrains Mono', monospace"; ctx.fillText(label, x, y);
    ctx.fillStyle = ink; ctx.font = "500 28px 'DM Sans', sans-serif";
    let yy = y + 44; for (const l of wrap(ctx, body, col).slice(0, 3)) { ctx.fillText(l, x, yy); yy += 38; }
  };
  block(pad, "WHAT GOT LOST", d.lost);
  block(pad + col + 48, "MY FOCUS", d.focus);
  if (format === "story") {
    // Big challenge block — the viral hook
    ctx.fillStyle = ink; ctx.fillRect(pad, 1400, W - pad * 2, 260);
    ctx.fillStyle = "#F8F7F3"; ctx.font = "700 56px 'Space Grotesk', sans-serif"; ctx.fillText("What's your pattern?", pad + 48, 1500);
    ctx.font = "500 30px 'DM Sans', sans-serif"; ctx.fillStyle = "rgba(248,247,243,0.75)";
    ctx.fillText(d.code ? `Find out free · use code ${d.code}` : "Find out free in 90 seconds.", pad + 48, 1570);
    if (d.handle) { ctx.fillStyle = ink; ctx.font = "600 32px 'DM Sans', sans-serif"; ctx.fillText(`Tag ${d.handle}`, pad, 1760); }
    if (qr) {
      const s = 190, x = W - pad - s, qy = 1690;
      ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.roundRect(x - 14, qy - 14, s + 28, s + 28, 24); ctx.fill();
      ctx.drawImage(qr, x, qy, s, s);
      ctx.fillStyle = soft; ctx.font = "500 20px 'JetBrains Mono', monospace";
      ctx.fillText("SCAN TO FOLLOW", x - 14, qy + s + 44);
    }
  } else {
    ctx.strokeStyle = "rgba(23,24,28,0.15)"; ctx.beginPath(); ctx.moveTo(pad, 960); ctx.lineTo(W - pad, 960); ctx.stroke();
    ctx.fillStyle = ink; ctx.font = "600 28px 'DM Sans', sans-serif"; ctx.fillText("What's your pattern?", pad, 1012);
    ctx.fillStyle = soft; ctx.font = "500 24px 'DM Sans', sans-serif";
    const right = d.code ? `Code ${d.code}` : d.handle ?? "";
    if (right) { const w = ctx.measureText(right).width; ctx.fillText(right, W - pad - w, 1012); }
  }
}

export function ShareCard({ data, inviteUrl }: { data: ShareCardData; inviteUrl?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<Format>("story");
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    let off = false;
    void document.fonts?.ready.then(() => { if (off || !ref.current) return; drawCard(ref.current, data, format); setUrl(ref.current.toDataURL("image/png")); });
    return () => { off = true; };
  }, [data, format]);

  const link = inviteUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
  const caption = `My communication pattern: ${data.title}. What's yours?${data.handle ? ` ${data.handle}` : ""} ${link}`.trim();
  const blob = () => new Promise<Blob | null>((r) => ref.current?.toBlob(r, "image/png"));

  async function nativeShare(): Promise<boolean> {
    const b = await blob(); if (!b) return false;
    const file = new File([b], "my-unspoken-pattern.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], text: caption }); } catch { /* cancelled */ }
      return true;
    }
    return false;
  }
  function download() { const a = document.createElement("a"); a.href = url; a.download = "my-unspoken-pattern.png"; a.click(); }

  async function instagram() {
    setMsg("");
    await navigator.clipboard?.writeText(caption).catch(() => {});
    if (await nativeShare()) return;
    download();
    setMsg(`Card saved and caption copied. Post it on Instagram${data.handle ? ` and tag ${data.handle}` : ""}.`);
  }
  async function whatsapp() {
    setMsg("");
    if (await nativeShare()) return;
    download();
    window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, "_blank", "noopener");
  }
  async function share() { setMsg(""); if (!(await nativeShare())) setMsg("Sharing isn't supported in this browser — download the card instead."); }

  return (
    <div className="space-y-4">
      <canvas ref={ref} className="hidden" />
      <div className="flex justify-center gap-2 text-[13px]">
        {(["story", "square"] as const).map((f) => (
          <button key={f} onClick={() => setFormat(f)} className={`rounded-full border px-3 py-1 ${format === f ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
            {f === "story" ? "Story / Status" : "Post"}
          </button>
        ))}
      </div>
      {url ? <img src={url} alt={`Pattern card: ${data.title}`} className={`mx-auto w-full rounded-[20px] border border-border shadow-[var(--shadow-float)] ${format === "story" ? "aspect-[9/16] max-w-[300px]" : "aspect-square max-w-[420px]"}`} />
        : <div className="mx-auto aspect-square w-full max-w-[420px] animate-pulse rounded-[20px] bg-muted" />}
      <div className="flex flex-wrap justify-center gap-3">
        <button className="btn btn-primary" onClick={instagram}><Instagram className="size-4" />Instagram</button>
        <button className="btn btn-ghost" onClick={whatsapp}><MessageCircle className="size-4" />WhatsApp</button>
        <button className="btn btn-ghost" onClick={share} aria-label="More sharing options"><Share2 className="size-4" /></button>
        <button className="btn btn-ghost" onClick={download} aria-label="Download card"><Download className="size-4" /></button>
      </div>
      {msg && <p className="text-center text-[13px] text-muted-foreground">{msg}</p>}
    </div>
  );
}
