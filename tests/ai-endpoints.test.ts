import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  features: { aiChat: true, aiStructured: true, aiPersist: true },
  configured: true,
  session: vi.fn(),
  stream: vi.fn(),
  save: vi.fn(),
  after: vi.fn(),
  usage: vi.fn(),
}));
vi.mock("@/lib/config", () => ({ features: state.features }));
vi.mock("@/lib/ai", () => ({
  get isAiConfigured() {
    return state.configured;
  },
  getAiModel: () => "test-model",
}));
vi.mock("@/lib/rate-limit", () => ({ checkAiUsage: state.usage }));
vi.mock("@/lib/session", () => ({ getSession: state.session }));
vi.mock("@/lib/data/chat", () => ({ saveChat: state.save }));
vi.mock("@/lib/after", () => ({ runAfterResponse: state.after }));
vi.mock("@/lib/logger", () => ({
  createRequestLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  durationMs: () => 0,
}));
vi.mock("ai", async (original) => ({
  ...(await original<typeof import("ai")>()),
  streamText: state.stream,
}));

import { POST as object } from "@/app/api/ai/object/route";
import { POST as chat } from "@/app/api/chat/route";

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(state.features, {
    aiChat: true,
    aiStructured: true,
    aiPersist: true,
  });
  state.usage.mockResolvedValue(null);
  state.configured = true;
  state.session.mockResolvedValue({ user: { id: "user" } });
});
const request = (body: unknown) =>
  new Request("http://localhost/api", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
it.each([
  ["chat", chat],
  ["structured", object],
] as const)(
  "%s rejects disabled, unconfigured, anonymous, and malformed requests before provider calls",
  async (_, handler) => {
    state.features.aiChat = state.features.aiStructured = false;
    expect((await handler(request({}))).status).toBe(404);
    state.features.aiChat = state.features.aiStructured = true;
    state.configured = false;
    expect((await handler(request({}))).status).toBe(503);
    state.configured = true;
    state.session.mockResolvedValue(null);
    expect((await handler(request({}))).status).toBe(401);
    state.session.mockResolvedValue({ user: { id: "user" } });
    expect((await handler(request("{"))).status).toBe(400);
    expect((await handler(request({}))).status).toBe(400);
    expect(state.stream).not.toHaveBeenCalled();
  },
);
it("streams validated structured prompts and rejects oversized prompts", async () => {
  state.stream.mockReturnValue({
    toTextStreamResponse: () => new Response("test-output"),
  });
  expect((await object(request({ prompt: "x".repeat(4001) }))).status).toBe(
    400,
  );
  expect(
    await (await object(request({ prompt: "  Plan an app  " }))).text(),
  ).toBe("test-output");
  expect(state.stream.mock.calls[0][0].maxOutputTokens).toBe(2048);
  expect(state.stream.mock.calls[0][0].prompt).toContain("Plan an app");
});
it("validates chat messages and persists the finished stream as the signed-in user", async () => {
  expect(
    (await chat(request({ id: "chat", messages: [{ role: "invalid" }] })))
      .status,
  ).toBe(400);
  let finish: (args: { messages: unknown[] }) => void = () => {};
  state.stream.mockReturnValue({
    toUIMessageStreamResponse: (options: { onFinish: typeof finish }) => {
      finish = options.onFinish;
      return new Response("stream");
    },
  });
  const messages = [
    { id: "message", role: "user", parts: [{ type: "text", text: "Hello" }] },
  ];
  expect(
    await (
      await chat(request({ id: "chat", messages, userId: "attacker" }))
    ).text(),
  ).toBe("stream");
  expect(state.stream.mock.calls[0][0].maxOutputTokens).toBe(2048);
  finish({ messages });
  await state.after.mock.calls[0][1]();
  expect(state.save).toHaveBeenCalledWith({
    chatId: "chat",
    userId: "user",
    messages,
  });
  state.features.aiPersist = false;
  state.save.mockClear();
  await state.after.mock.calls[0][1]();
  expect(state.save).not.toHaveBeenCalled();
});

const validChat = {
  id: "chat",
  messages: [
    { id: "m", role: "user", parts: [{ type: "text", text: "Hello" }] },
  ],
};
it.each([
  ["chat", chat, validChat],
  ["structured", object, { prompt: "Plan an app" }],
] as const)(
  "%s enforces shared authenticated usage before spending",
  async (_, handler, body) => {
    for (const status of [429, 503]) {
      state.usage.mockResolvedValue(new Response("Unavailable", { status }));
      expect(
        (await handler(request({ ...body, userId: "spoofed" }))).status,
      ).toBe(status);
      expect(state.usage).toHaveBeenLastCalledWith("user");
      expect(state.stream).not.toHaveBeenCalled();
    }
  },
);
it("rejects oversized chat history and provider-download inputs", async () => {
  for (const parts of [
    [{ type: "text", text: "x".repeat(16001) }],
    [
      {
        type: "file",
        url: "https://example.com/large.pdf",
        mediaType: "application/pdf",
      },
    ],
  ]) {
    expect(
      (
        await chat(
          request({ id: "chat", messages: [{ id: "m", role: "user", parts }] }),
        )
      ).status,
    ).toBe(400);
  }
  expect(state.stream).not.toHaveBeenCalled();
});

it("continues an SDK conversation with step and reasoning history", async () => {
  state.stream.mockReturnValue({
    toUIMessageStreamResponse: () => new Response("continued"),
  });
  const messages = [
    ...validChat.messages,
    {
      id: "reply",
      role: "assistant",
      parts: [
        { type: "step-start" },
        { type: "reasoning", text: "Consider the request", state: "done" },
        { type: "text", text: "Hello", state: "done" },
      ],
    },
    { id: "next", role: "user", parts: [{ type: "text", text: "Continue" }] },
  ];
  expect(await (await chat(request({ id: "chat", messages }))).text()).toBe(
    "continued",
  );
  expect(state.stream).toHaveBeenCalledOnce();
});
