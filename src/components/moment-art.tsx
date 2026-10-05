import type { ReactNode } from "react";
import { CheckCircle2, MessageSquareText, Mic, Pencil, Target, Users } from "lucide-react";

type MomentId = "interview" | "leadership" | "presentation" | "high-stakes" | "persuasion" | "custom";

function Stroke({ children, className = "text-foreground/70" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 200 120" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-full w-full ${className}`} aria-hidden="true">
      {children}
    </svg>
  );
}

function InterviewArt() {
  return (
    <Stroke>
      {/* table */}
      <path d="M52 88h96M64 88v14M136 88v14" />
      {/* interviewer */}
      <circle cx="62" cy="46" r="7" />
      <path d="M62 53v18M62 58l-8 7M62 58l11 8M62 71l-6 13M62 71l7 13" />
      {/* candidate */}
      <circle cx="142" cy="42" r="7" />
      <path d="M142 49v20M142 55l-11 9M142 55l10 8" />
      {/* speech bubble */}
      <rect x="112" y="12" width="56" height="20" rx="9" className="text-primary" />
      <path d="M122 22h30M136 27h12" className="text-primary" />
      <path d="M126 32l-5 6" className="text-primary" />
    </Stroke>
  );
}

function LeadershipArt() {
  return (
    <Stroke>
      {/* standing speaker */}
      <circle cx="52" cy="30" r="7" />
      <path d="M52 37v34M52 46l-10 10M52 46l12 12M52 71l-7 15M52 71l8 15" />
      {/* seated listeners */}
      <circle cx="122" cy="52" r="6" />
      <path d="M122 58v12M122 63l-7 6M122 70h11M133 70v7" />
      <circle cx="156" cy="52" r="6" />
      <path d="M156 58v12M156 63l-7 6M156 70h11M167 70v7" />
      {/* direction arrow */}
      <path d="M70 44c14-2 26 2 34 10" className="text-primary" />
      <path d="M99 48l6 7-9 2" className="text-primary" />
    </Stroke>
  );
}

function PresentationArt() {
  return (
    <Stroke>
      {/* screen */}
      <rect x="42" y="16" width="116" height="58" rx="6" />
      {/* rising bars */}
      <path d="M60 60v-14M78 60v-24M96 60v-34" className="text-primary" />
      <path d="M110 46c8-8 16-12 26-14" className="text-primary" />
      <path d="M131 30h8v8" className="text-primary" />
      {/* presenter */}
      <circle cx="176" cy="82" r="6" />
      <path d="M176 88v14M176 94l-8 5" />
    </Stroke>
  );
}

function HighStakesArt() {
  return (
    <Stroke>
      {/* two people facing off */}
      <circle cx="66" cy="42" r="7" />
      <path d="M66 49v20M66 55l-9 8M66 55l9 8M66 69l-6 15M66 69l6 15" />
      <circle cx="134" cy="42" r="7" />
      <path d="M134 49v20M134 55l-9 8M134 55l9 8M134 69l-6 15M134 69l6 15" />
      {/* charged pause between them */}
      <path d="M92 44c3 4-3 8 0 12s-3 8 0 12" className="text-primary" />
      <path d="M104 46c2 3-2 6 0 9s-2 6 0 9" className="text-primary" />
    </Stroke>
  );
}

function PersuasionArt() {
  return (
    <Stroke>
      {/* two parties */}
      <circle cx="46" cy="40" r="7" />
      <path d="M46 47c0 14 8 22 24 28M46 47l-6 12M46 47l7 11" />
      <circle cx="154" cy="40" r="7" />
      <path d="M154 47c0 14-8 22-24 28M154 47l6 12M154 47l-7 11" />
      {/* handshake */}
      <path d="M84 78c6-4 10-4 16 0s10 4 16 0" className="text-primary" />
      <path d="M92 74l6-4 6 4 6-4 6 4" className="text-primary" />
    </Stroke>
  );
}

function CustomArt() {
  return (
    <Stroke>
      {/* note */}
      <rect x="62" y="18" width="76" height="76" rx="8" />
      <path d="M76 38h30M76 52h48M76 66h40" />
      {/* pencil */}
      <path d="M138 78l18-18 8 8-18 18-10 2z" className="text-primary" />
      <path d="M150 66l8 8" className="text-primary" />
    </Stroke>
  );
}

const ART: Record<MomentId, () => ReactNode> = {
  interview: InterviewArt,
  leadership: LeadershipArt,
  presentation: PresentationArt,
  "high-stakes": HighStakesArt,
  persuasion: PersuasionArt,
  custom: CustomArt,
};

const CHIPS: Record<MomentId, { text: string; tone: "amber" | "green" | "plain"; icon?: "mic" | "target" | "check" | "talk" | "pencil" | "users" }[]> = {
  interview: [
    { text: "Tell me about yourself", tone: "amber", icon: "mic" },
    { text: "Why this role?", tone: "plain", icon: "talk" },
  ],
  leadership: [
    { text: "Set the direction", tone: "amber", icon: "target" },
    { text: "One clear ask", tone: "green", icon: "check" },
  ],
  presentation: [
    { text: "Lead with the point", tone: "amber", icon: "target" },
    { text: "3 talking points", tone: "green", icon: "check" },
  ],
  "high-stakes": [
    { text: "Say it honestly", tone: "amber", icon: "mic" },
    { text: "Stay calm", tone: "green", icon: "check" },
  ],
  persuasion: [
    { text: "Handle the objection", tone: "amber", icon: "talk" },
    { text: "Make the ask", tone: "green", icon: "check" },
  ],
  custom: [
    { text: "Your own question", tone: "amber", icon: "pencil" },
    { text: "Any moment", tone: "plain", icon: "users" },
  ],
};

const CHIP_ICONS = { mic: Mic, target: Target, check: CheckCircle2, talk: MessageSquareText, pencil: Pencil, users: Users };

export function MomentArt({ id }: { id: string }) {
  const Art = ART[id as MomentId] ?? CustomArt;
  const chips = CHIPS[id as MomentId] ?? CHIPS.custom;
  const toneClass: Record<string, string> = {
    amber: "border-primary/45 bg-primary/12 text-primary",
    green: "border-success/45 bg-success/12 text-success",
    plain: "border-border bg-card/95 text-muted-foreground",
  };
  return (
    <span className="relative block aspect-[16/10] w-full">
      <span className="absolute inset-x-6 inset-y-3 rounded-xl border border-border bg-secondary/40">
        <span className="absolute inset-3 block"><Art /></span>
      </span>
      {chips.map((c, i) => {
        const Icon = CHIP_ICONS[c.icon ?? "talk"];
        const pos = i === 0
          ? "-left-1 top-2 sm:top-3"
          : i === 1
            ? "-right-1 bottom-3 sm:bottom-4"
            : "-left-1 bottom-3";
        return (
          <span key={c.text} className={`absolute ${pos} z-10 inline-flex max-w-[92%] items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] font-medium leading-none shadow-sm ${toneClass[c.tone]}`}>
            <Icon className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{c.text}</span>
          </span>
        );
      })}
    </span>
  );
}
