import "server-only";
import pino from "pino";
import { features } from "@/lib/config";

const isTest = process.env.NODE_ENV === "test";
type LogFields = Record<string, unknown>;

export const logger = pino({
  name: features.appName,
  enabled: process.env.LOG_ENABLED !== "false",
  level:
    process.env.LOG_LEVEL ??
    (isTest
      ? "silent"
      : process.env.NODE_ENV === "development"
        ? "debug"
        : "info"),
  base: {
    env: process.env.NODE_ENV ?? "development",
  },
  redact: {
    censor: "[redacted]",
    paths: [
      "authorization",
      "cookie",
      "password",
      "secret",
      "token",
      "apiKey",
      "headers.authorization",
      "headers.cookie",
      "*.authorization",
      "*.cookie",
      "*.password",
      "*.secret",
      "*.token",
      "*.apiKey",
      "*.accessToken",
      "*.refreshToken",
      "*.stripeSecretKey",
      "*.stripeWebhookSecret",
      "*.resendApiKey",
    ],
  },
  serializers: {
    err: pino.stdSerializers.err,
  },
});

export function createRequestLogger(
  request: Request,
  bindings: Record<string, unknown> = {},
) {
  const url = new URL(request.url);
  const requestId =
    request.headers.get("x-request-id") ??
    request.headers.get("x-correlation-id") ??
    request.headers.get("x-vercel-id") ??
    request.headers.get("cf-ray") ??
    undefined;

  return logger.child({
    requestId,
    method: request.method,
    path: url.pathname,
    ...bindings,
  });
}

export function durationMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}

export function createOperationLogger(bindings: LogFields) {
  const startedAt = performance.now();
  const log = logger.child(bindings);

  function withDuration(fields: LogFields = {}) {
    return { ...fields, durationMs: durationMs(startedAt) };
  }

  return {
    log,
    durationMs: () => durationMs(startedAt),
    debug: (fields: LogFields, message: string) =>
      log.debug(withDuration(fields), message),
    info: (fields: LogFields, message: string) =>
      log.info(withDuration(fields), message),
    warn: (fields: LogFields, message: string) =>
      log.warn(withDuration(fields), message),
    error: (fields: LogFields, message: string) =>
      log.error(withDuration(fields), message),
  };
}
