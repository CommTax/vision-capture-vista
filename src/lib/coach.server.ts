import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";
import type { CoachInput } from "./coach.functions";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

export const coachingSchema = z.object({
  headline: z.string(),
  first_impression: z.string(),
  what_worked: z.array(z.string()),
  what_to_fix: z.array(z.object({ issue: z.string(), quote: z.string(), fix: z.string() })),
  stronger_opening: z.string(),
  delivery_notes: z.string(),
  interviewer_follow_up: z.string(),
  practice_plan: z.array(z.string()),
});
export type Coaching = z.infer<typeof coachingSchema>;

export class CoachError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function generateCoaching(input: CoachInput, apiKey: string): Promise<Coaching> {
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });

  const m = input.metrics;
  const prompt = `You are a candid, warm interview coach. Coach this candidate on THEIR answer — help them improve their own response, do not write a perfect replacement answer.

Candidate level: ${input.level}
Practice mode: ${input.mode}
Question: "${input.question}"
Response type: ${input.responseType}${input.responseType === "voice" ? " (recorded, transcribed)" : ""}
Measured: ${m.duration}s, ${m.wordCount} words, ${m.wpm} wpm, main point reached at ${m.mainPointDelay}s, filler words: ${m.fillers || "none"}.
Rule-based scores (0-100): ${m.scores}

Transcript:
"""${input.transcript.slice(0, 6000)}"""

Return:
- headline: 3-6 word diagnosis in caps style, e.g. "STRONG STORY, BURIED RESULT"
- first_impression: 1-2 sentences on how an interviewer would likely react
- what_worked: exactly 2 short points
- what_to_fix: exactly 3 items; quote = a short exact phrase from the transcript (or "" if none), fix = concrete action
- stronger_opening: one rewritten first sentence using THEIR facts only
- delivery_notes: 1-2 sentences on pace, fillers, confidence${input.responseType === "voice" ? "" : " (note this was typed)"}
- interviewer_follow_up: a realistic follow-up question an interviewer would ask next
- practice_plan: exactly 3 short next reps
Be specific to this transcript. Plain language, no jargon.`;

  const result = streamText({
    model: provider.responses(MODEL),
    prompt,
    output: Output.object({ schema: coachingSchema }),
    providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
  });

  try {
    return await result.output;
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e)) throw new CoachError("The coach returned an incomplete answer. Please try again.", 502);
    const status = (e as { statusCode?: number }).statusCode ?? 500;
    if (status === 429) throw new CoachError("The coach is busy right now. Please wait a moment and try again.", 429);
    if (status === 402) throw new CoachError("AI credits have run out. Add credits in Settings → Plans & credits to keep using the coach.", 402);
    if (status === 403) throw new CoachError("AI coaching isn't available for this workspace right now.", 403);
    throw new CoachError("Coaching failed. Please try again.", status);
  }
}
