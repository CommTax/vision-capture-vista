import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square } from "lucide-react";

type SR = { start(): void; stop(): void; continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null };

export function Recorder({ max, onDone, submitLabel = "Analyze my response", stopLabel = "Stop" }: { max: number; submitLabel?: string; stopLabel?: string; onDone: (r: { transcript: string; duration: number; audioUrl: string; audioBlob: Blob | null }) => void }) {
  const [state, setState] = useState<"idle" | "rec" | "paused" | "done">("idle");
  const [sec, setSec] = useState(0);
  const [levels, setLevels] = useState<number[]>(Array(32).fill(0.08));
  const [audioUrl, setAudioUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [err, setErr] = useState("");
  const mr = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audioBlob = useRef<Blob | null>(null);
  const raf = useRef(0);
  const sr = useRef<SR | null>(null);
  const finalText = useRef("");
  const stream = useRef<MediaStream | null>(null);
  const supportsSR = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    if (state !== "rec") return;
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, max]);

  useEffect(() => { if (state === "rec" && sec >= max) stop(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sec, max, state]);

  useEffect(() => () => { cancelAnimationFrame(raf.current); stream.current?.getTracks().forEach((t) => t.stop()); }, []);

  async function start() {
    setErr("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const rec = new MediaRecorder(s);
      chunks.current = [];
      rec.ondataavailable = (e) => chunks.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        audioBlob.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
      };
      rec.start(); mr.current = rec;
      const ctx = new AudioContext(); const an = ctx.createAnalyser(); an.fftSize = 64; ctx.createMediaStreamSource(s).connect(an);
      const data = new Uint8Array(an.frequencyBinCount);
      const loop = () => { an.getByteFrequencyData(data); setLevels(Array.from(data).slice(0, 32).map((v) => Math.max(0.08, v / 255))); raf.current = requestAnimationFrame(loop); };
      loop();
      if (supportsSR) {
        const C = (window as unknown as Record<string, new () => SR>)["SpeechRecognition"] ?? (window as unknown as Record<string, new () => SR>)["webkitSpeechRecognition"];
        const r = new C(); r.continuous = true; r.interimResults = true; r.lang = "en-US";
        r.onresult = (e) => { let interim = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const res = e.results[i]; if (res.isFinal) finalText.current += res[0].transcript + ". "; else interim += res[0].transcript; } setTranscript((finalText.current + interim).trim()); };
        r.start(); sr.current = r;
      }
      setSec(0); setState("rec");
    } catch { setErr("Microphone access was blocked. Allow it in your browser, or type your response instead."); }
  }
  function pause() { if (state === "rec") { mr.current?.pause(); setState("paused"); } else { mr.current?.resume(); setState("rec"); } }
  function stop() {
    mr.current?.stop(); sr.current?.stop(); cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    setLevels(Array(32).fill(0.08)); setState("done");
  }

  const mm = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  return (
    <div className="space-y-5">
      <div className="flex h-24 items-center justify-center gap-[3px]">
        {levels.map((l, i) => <span key={i} className={`w-[5px] rounded-full ${state === "rec" ? "bg-primary" : "bg-muted-foreground/30"}`} style={{ height: `${l * 100}%`, transition: "height 80ms" }} />)}
      </div>
      <div className="text-center font-mono text-[28px]">{mm}<span className="text-[14px] text-muted-foreground"> / {Math.floor(max / 60)}:{String(max % 60).padStart(2, "0")}</span></div>
      <div className="flex justify-center gap-3">
        {state === "idle" && <button className="btn btn-primary" onClick={start}><Mic className="size-4" />Start recording</button>}
        {(state === "rec" || state === "paused") && <>
          <button className="btn btn-ghost" onClick={pause}>{state === "rec" ? <><Pause className="size-4" />Pause</> : <><Play className="size-4" />Resume</>}</button>
          <button className="btn btn-primary" onClick={stop}><Square className="size-4" />{stopLabel}</button>
        </>}
        {state === "done" && <button className="btn btn-ghost" onClick={() => { setState("idle"); setSec(0); setTranscript(""); finalText.current = ""; setAudioUrl(""); audioBlob.current = null; }}>Re-record</button>}
      </div>
      {err && <p className="text-center text-[13px] text-destructive">{err}</p>}
      {state === "done" && (
        <div className="space-y-3">
          {audioUrl && <audio controls src={audioUrl} className="w-full" />}
          <div className="text-[12px] text-muted-foreground">{supportsSR ? "Transcript — correct anything we misheard." : "Live transcription isn't supported in this browser. Type what you said so we can analyze it."}</div>
          <textarea className="field min-h-32" value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Your words…" />
          <button className="btn btn-primary w-full" disabled={transcript.trim().split(/\s+/).length < 5} onClick={() => onDone({ transcript, duration: sec, audioUrl, audioBlob: audioBlob.current })}>{submitLabel}</button>
        </div>
      )}
    </div>
  );
}
