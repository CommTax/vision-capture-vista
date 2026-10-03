// Client store persisted in localStorage. Shapes mirror the planned backend tables
// (profiles, responses, response_analysis, user_progress) so it can be swapped for Lovable Cloud.
import { useSyncExternalStore } from "react";
import type { Analysis } from "./analysis";
import type { ModeId } from "./data";
import type { Coaching } from "./coach.server";
import type { Entitlement, Interest, Lead, Marketing } from "./entitlements";

export type Profile = { id?: string; name: string; email: string; phone?: string; phone_country_code?: string; created_at?: string; updated_at?: string; goal: string; struggle: string; experience: string; level: string; onboarded: boolean; plan: "free" | "practice" | "sprint" };
export type ResponseRecord = {
  id: string; question_id: string; question: string; mode: ModeId; response_type: "voice" | "text";
  transcript: string; audio_url?: string; duration: number; created_at: string;
  attempt: number; parent_id?: string; analysis: Analysis; coaching?: Coaching;
};
export type DrillResult = { skill: string; first_score: number; last_score: number; first_delay: number; last_delay: number; attempts: number; at: string };
export type State = {
  profile: Profile | null; responses: ResponseRecord[]; drillsDone: string[]; practiceDays: string[]; drillResults?: Record<string, DrillResult>;
  // Kept separate from identity: entitlement (access), lead (contact capture), marketing (consent).
  entitlement?: Entitlement; freeAttemptsUsed?: number; lead?: Lead; marketing?: Marketing; interests?: Interest[];
};

const KEY = "cadence-state-v1";
const listeners = new Set<() => void>();
let state: State = { profile: null, responses: [], drillsDone: [], practiceDays: [] };
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); if (raw) state = JSON.parse(raw); } catch { /* ignore */ }
}
function emit() { localStorage.setItem(KEY, JSON.stringify(state)); listeners.forEach((l) => l()); }

export function setState(fn: (s: State) => State) { load(); state = fn(state); emit(); }
export function getState() { load(); return state; }

const SERVER: State = { profile: null, responses: [], drillsDone: [], practiceDays: [] };
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => sel(getState()),
    () => sel(SERVER),
  );
}

export const today = () => new Date().toISOString().slice(0, 10);

export function addResponse(r: ResponseRecord) {
  setState((s) => ({ ...s, responses: [r, ...s.responses], practiceDays: s.practiceDays.includes(today()) ? s.practiceDays : [...s.practiceDays, today()] }));
}

export function streak(days: string[]) {
  const set = new Set(days); let n = 0; const d = new Date();
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
