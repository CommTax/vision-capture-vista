import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square } from "lucide-react";

type SR = {
  start(): void;
  stop(): void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult:
    | ((e: {
        resultIndex: number;
        results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
      }) => void)
    | null;
};

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "https://unspoken-backend-nqvl.onrender.com";

function pickSupportedMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/aac",
  ];
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}

export function Recorder({
  max,
  onDone,
  submitLabel = "Analyze my response",
  stopLabel = "Stop",
}: {
  max: number;
  submitLabel?: string;
  stopLabel?: string;
  onDone: (r: {
    transcript: string;
    duration: number;
    audioUrl: string;
    audioBlob: Blob | null;
  }) => void;
}) {
  const [state, setState] = useState<"idle" | "rec" | "paused" | "done">("idle");
  const [sec, setSec] = useState(0);
  const [levels, setLevels] = useState<number[]>(Array(32).fill(0.08));
  const [audioUrl, setAudioUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [err, setErr] = useState("");
  const [transcribing, setTranscribing] = useState(false);

  const mr = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audioBlob = useRef<Blob | null>(null);
  const raf = useRef(0);
  const sr = useRef<SR | null>(null);
  const finalText = useRef("");
  const stream = useRef<MediaStream | null>(null);
  // Track whether SR produced any final text during this recording.
  const srCapturedText = useRef(false);

  const supportsSR =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    if (state !== "rec") return;
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, max]);

  useEffect(() => {
    if (state === "rec" && sec >= max) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sec, max, state]);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    []
  );

  async function start() {
    setErr("");
    srCapturedText.current = false;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;

      const mimeType = pickSupportedMime();
      const rec = mimeType
        ? new MediaRecorder(s, { mimeType })
        : new MediaRecorder(s);

      chunks.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunks.current, {
          type: rec.mimeType || mimeType || "audio/webm",
        });
        audioBlob.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
      };
      rec.start();
      mr.current = rec;

      const ctx = new AudioContext();
      const an = ctx.createAnalyser();
      an.fftSize = 64;
      ctx.createMediaStreamSource(s).connect(an);
      const data = new Uint8Array(an.frequencyBinCount);
      const loop = () => {
        an.getByteFrequencyData(data);
        setLevels(
          Array.from(data)
            .slice(0, 32)
            .map((v) => Math.max(0.08, v / 255))
        );
        raf.current = requestAnimationFrame(loop);
      };
      loop();

      if (supportsSR) {
        try {
          const C =
            (window as unknown as Record<string, new () => SR>)[
              "SpeechRecognition"
            ] ??
            (window as unknown as Record<string, new () => SR>)[
              "webkitSpeechRecognition"
            ];
          const r = new C();
          r.continuous = true;
          r.interimResults = true;
          r.lang = "en-US";
          r.onresult = (e) => {
            let interim = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
              const res = e.results[i];
              if (res.isFinal) {
                finalText.current += res[0].transcript + ". ";
                srCapturedText.current = true;
              } else {
                interim += res[0].transcript;
              }
            }
            setTranscript((finalText.current + interim).trim());
          };
          r.start();
          sr.current = r;
        } catch {
          // SpeechRecognition unavailable — silently skip
        }
      }

      setSec(0);
      setState("rec");
    } catch {
      setErr(
        "Microphone access was blocked. Allow it in your browser, or type your response instead."
      );
    }
  }

  function pause() {
    if (state === "rec") {
      mr.current?.pause();
      setState("paused");
    } else {
      mr.current?.resume();
      setState("rec");
    }
  }

  async function stop() {
    mr.current?.stop();
    sr.current?.stop();
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    setLevels(Array(32).fill(0.08));
    setState("done");

    // ── Auto-transcribe if SpeechRecognition didn't capture anything ──
    // Wait a beat so `rec.onstop` can fire and populate `audioBlob.current`.
    setTimeout(() => {
      if (!finalText.current.trim() && !srCapturedText.current) {
        void transcribeOnServer();
      }
    }, 250);
  }

  async function transcribeOnServer() {
    if (!audioBlob.current) {
      // Retry once if the blob isn't ready yet
      await new Promise((r) => setTimeout(r, 300));
      if (!audioBlob.current) return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("unspoken-session-token")
        : null;

    if (!token) {
      setErr("Please sign in again to transcribe.");
      return;
    }

    setTranscribing(true);
    setErr("");

    try {
      const { buildPaidUploadForm, uploadPaidResponse } = await import(
        "@/lib/backend-api"
      );

      const blob = audioBlob.current;
      const ext = (blob.type || "").includes("mp4") ? "m4a" : "webm";
      const file = new File([blob], `recording.${ext}`, { type: blob.type });

      const form = buildPaidUploadForm({
        audio: file,
        mode: "voice",
        question_slot: "transcribe-only",
        question_type: "intro",
        question_prompt: "Voice transcription",
        duration_seconds: sec,
      });

      const uploaded = await uploadPaidResponse(form);
      const drill_id = uploaded?.drill_id;
      if (!drill_id) {
        throw new Error("Upload succeeded but no drill_id returned");
      }

      const res = await fetch(`${API_BASE}/api/paid/transcribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ drill_id }),
      });

      if (res.status === 401) {
        setErr("Your session expired. Please sign in again.");
        return;
      }
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`${res.status} ${detail}`);
      }

      const { transcript: t } = await res.json();
      if (t && t.trim()) {
        setTranscript(t.trim());
      } else {
        setErr("We couldn't hear anything. Try again or type your response.");
      }
    } catch (e) {
      console.error("[recorder] transcribe failed:", e);
      setErr("We couldn't transcribe that recording. Please type your response.");
    } finally {
      setTranscribing(false);
    }
  }

  const mm = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = !transcribing && wordCount >= 5;

  return (
    <div className="space-y-5">
      <div className="flex h-24 items-center justify-center gap-[3px]">
        {levels.map((l, i) => (
          <span
            key={i}
            className={`w-[5px] rounded-full ${
              state === "rec" ? "bg-primary" : "bg-muted-foreground/30"
            }`}
            style={{ height: `${l * 100}%`, transition: "height 80ms" }}
          />
        ))}
      </div>

      <div className="text-center font-mono text-[28px]">
        {mm}
        <span className="text-[14px] text-muted-foreground">
          {" "}
          / {Math.floor(max / 60)}:{String(max % 60).padStart(2, "0")}
        </span>
      </div>

      <div className="flex justify-center gap-3">
        {state === "idle" && (
          <button className="btn btn-primary" onClick={start}>
            <Mic className="size-4" />
            Start recording
          </button>
        )}
        {(state === "rec" || state === "paused") && (
          <>
            <button className="btn btn-ghost" onClick={pause}>
              {state === "rec" ? (
                <>
                  <Pause className="size-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="size-4" />
                  Resume
                </>
              )}
            </button>
            <button className="btn btn-primary" onClick={stop}>
              <Square className="size-4" />
              {stopLabel}
            </button>
          </>
        )}
        {state === "done" && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              setState("idle");
              setSec(0);
              setTranscript("");
              finalText.current = "";
              srCapturedText.current = false;
              setAudioUrl("");
              audioBlob.current = null;
              setErr("");
            }}
          >
            Re-record
          </button>
        )}
      </div>

      {err && <p className="text-center text-[13px] text-destructive">{err}</p>}

      {state === "done" && (
        <div className="space-y-3">
          {audioUrl && <audio controls src={audioUrl} className="w-full" />}

          {transcribing ? (
            <div
              className="flex items-center justify-center gap-3 rounded-xl border border-border bg-muted/20 p-4 text-[13px] text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              <span className="inline-block size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Transcribing your recording…
            </div>
          ) : (
            <>
              <div className="text-[12px] text-muted-foreground">
                {supportsSR
                  ? "Transcript — correct anything we misheard."
                  : "Your transcript is below. You can also edit it."}
              </div>

              <textarea
                className="field min-h-32"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Your words…"
              />

              <button
                className="btn btn-primary w-full"
                disabled={!canSubmit}
                onClick={() =>
                  onDone({
                    transcript,
                    duration: sec,
                    audioUrl,
                    audioBlob: audioBlob.current,
                  })
                }
              >
                {submitLabel}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
