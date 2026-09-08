export type ReadinessProbe = {
  name: string;
  check: () => Promise<void>;
};

export type ReadinessResult = {
  ready: boolean;
  checks: Array<{ name: string; ready: boolean }>;
};

export async function runReadinessChecks(
  probes: ReadinessProbe[],
): Promise<ReadinessResult> {
  const results = await Promise.allSettled(
    probes.map((probe) => probe.check()),
  );
  const checks = results.map((result, index) => ({
    name: probes[index]?.name ?? "unknown",
    ready: result.status === "fulfilled",
  }));
  return { ready: checks.every((check) => check.ready), checks };
}
