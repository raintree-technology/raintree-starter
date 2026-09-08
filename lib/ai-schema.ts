import { z } from "zod";

/**
 * Schema shared by the structured-output route (Output.object) and the client
 * (useObject). Keeping it in one client-safe module guarantees server and client
 * agree on the shape being streamed.
 */
export const generationSchema = z.object({
  title: z.string().describe("A short, punchy project title"),
  summary: z.string().describe("A one-sentence summary of the project"),
  tasks: z
    .array(
      z.object({
        id: z.string().describe("Stable kebab-case identifier for this task"),
        name: z.string().describe("Task name"),
        priority: z.enum(["low", "medium", "high"]),
        estimateHours: z.number().describe("Rough estimate in hours"),
      }),
    )
    .describe("Between 3 and 6 concrete tasks"),
});

export type Generation = z.infer<typeof generationSchema>;

export const chatRequestSchema = z.object({
  id: z.string().trim().min(1).max(200),
  messages: z
    .array(
      z.object({
        id: z.string().min(1).max(200),
        role: z.enum(["user", "assistant"]),
        parts: z
          .array(
            z.discriminatedUnion("type", [
              z.object({
                type: z.literal("text"),
                text: z.string().max(16_000),
              }),
              z.object({
                type: z.literal("reasoning"),
                text: z.string().max(16_000),
              }),
              z.object({ type: z.literal("step-start") }),
            ]),
          )
          .min(1)
          .max(100),
      }),
    )
    .min(1)
    .max(100)
    .refine(
      (messages) => JSON.stringify(messages).length <= 16_000,
      "Chat history must fit within 16000 characters",
    ),
});
