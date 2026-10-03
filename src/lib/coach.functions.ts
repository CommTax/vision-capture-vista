import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  question: z.string().min(1).max(500),
  transcript: z.string().min(5).max(8000),
  mode: z.string().max(40),
  level: z.string().max(40),
  responseType: z.enum(["voice", "text"]),
  metrics: z.object({ duration: z.number(), wordCount: z.number(), wpm: z.number(), mainPointDelay: z.number(), fillers: z.string().max(300), scores: z.string().max(400) }),
});
export type CoachInput = z.infer<typeof inputSchema>;

export type CoachResult =
  | { ok: true; coaching: import("./coach.server").Coaching }
  | { ok: false; error: string; status: number };

export const getCoaching = createServerFn({ method: "POST" })
  .validator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<CoachResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false, error: "AI coaching isn't configured yet.", status: 401 };
    const { generateCoaching, CoachError } = await import("./coach.server");
    try {
      return { ok: true, coaching: await generateCoaching(data, key) };
    } catch (e) {
      if (e instanceof CoachError) return { ok: false, error: e.message, status: e.status };
      console.error(e);
      return { ok: false, error: "Coaching failed. Please try again.", status: 500 };
    }
  });
