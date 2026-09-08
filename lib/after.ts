import "server-only";
import { after } from "next/server";
import { logger } from "@/lib/logger";

type AfterTask = () => Promise<void> | void;
type AfterTaskFields = Record<string, unknown>;

async function runTask(
  taskName: string,
  task: AfterTask,
  fields: AfterTaskFields,
): Promise<void> {
  try {
    await task();
  } catch (err) {
    logger.error({ ...fields, err, task: taskName }, "after.task.failed");
  }
}

export function runAfterResponse(
  taskName: string,
  task: AfterTask,
  fields: AfterTaskFields = {},
): void {
  try {
    after(() => runTask(taskName, task, fields));
  } catch (err) {
    logger.warn({ ...fields, err, task: taskName }, "after.schedule_failed");
    void runTask(taskName, task, fields);
  }
}
