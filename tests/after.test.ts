import { beforeEach, describe, expect, it, vi } from "vitest";

const afterMock = vi.hoisted(() => vi.fn());

vi.mock("next/server", () => ({
  after: afterMock,
}));

import { runAfterResponse } from "@/lib/after";

describe("runAfterResponse", () => {
  beforeEach(() => {
    afterMock.mockReset();
  });

  it("schedules tasks with Next.js after", async () => {
    const task = vi.fn();
    let scheduled: (() => Promise<void>) | undefined;
    afterMock.mockImplementation((callback: () => Promise<void>) => {
      scheduled = callback;
    });

    runAfterResponse("test.task", task);

    expect(task).not.toHaveBeenCalled();
    expect(afterMock).toHaveBeenCalledTimes(1);

    expect(scheduled).toBeDefined();
    await scheduled!();

    expect(task).toHaveBeenCalledTimes(1);
  });

  it("contains scheduled task failures", async () => {
    let scheduled: (() => Promise<void>) | undefined;
    afterMock.mockImplementation((callback: () => Promise<void>) => {
      scheduled = callback;
    });

    runAfterResponse("test.task", async () => {
      throw new Error("boom");
    });

    expect(scheduled).toBeDefined();
    await expect(scheduled!()).resolves.toBeUndefined();
  });

  it("falls back to running the task when after cannot be scheduled", async () => {
    const task = vi.fn();
    afterMock.mockImplementation(() => {
      throw new Error("missing request context");
    });

    runAfterResponse("test.task", task);
    await Promise.resolve();

    expect(task).toHaveBeenCalledTimes(1);
  });
});
