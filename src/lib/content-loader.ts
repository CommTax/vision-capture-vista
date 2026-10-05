// Loads questions from the database into the shared list once at startup (built-in list stays as fallback).
import { QUESTIONS, type Question } from "./data";
import { getBackendContent } from "./growth.functions";

export function addQuestions(qs: Question[]) {
  const ids = new Set(QUESTIONS.map((q) => q.id));
  for (const q of qs) if (q?.id && q.text && !ids.has(q.id)) { QUESTIONS.push(q); ids.add(q.id); }
}

export async function loadBackendQuestions() {
  try {
    const raw = await getBackendContent();
    if (!raw) return;
    addQuestions((JSON.parse(raw) as { questions: Question[] }).questions);
  } catch { /* keep built-in questions */ }
}
