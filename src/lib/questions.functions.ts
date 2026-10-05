// Questions: database first, then AI-written (saved back to the database), else the built-in list.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODES = ["interview", "conversation", "presentation", "group", "sales", "everyday"] as const;

/** Signed-in: write one new question for a topic the person has finished, and save it. */
export const generateQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ mode: z.enum(MODES), avoid: z.array(z.string().max(300)).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return null;
    try {
      const { createOpenAI } = await import("@ai-sdk/openai");
      const { generateText, Output } = await import("ai");
      const provider = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" } });
      const schema = z.object({ text: z.string(), context: z.string(), difficulty: z.enum(["Easy", "Medium", "Hard"]), seconds: z.number() });
      const { output } = await generateText({
        model: provider.responses("openai/gpt-6-astra"),
        output: Output.object({ schema }),
        prompt: `Write one realistic spoken-communication practice question for the "${data.mode}" category (interview, high-stakes conversation, presentation, group discussion, persuasion, or leadership). The person answers out loud in 45-120 seconds. Give a short one-line context (who is asking / setting). Do not repeat any of these:\n${data.avoid.join("\n")}`,
        providerOptions: { openai: { store: false } },
      });
      const id = `ai-${Date.now().toString(36)}`;
      const q = { id, mode: data.mode, text: output.text, context: output.context, difficulty: output.difficulty, seconds: Math.min(180, Math.max(30, Math.round(output.seconds))) };
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("content_questions").insert({ id, mode: q.mode, title: q.text, prompt: q.text, context: q.context, difficulty: q.difficulty, time_limit: q.seconds, data: q as never, sort: 1000, source: "ai" });
      return q;
    } catch (e) { console.error("generateQuestion", e); return null; }
  });
