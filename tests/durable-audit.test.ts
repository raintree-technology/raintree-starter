import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectActions = readFileSync(
  join(process.cwd(), "lib/actions/projects.ts"),
  "utf8",
);
const auditWriter = readFileSync(join(process.cwd(), "lib/audit.ts"), "utf8");

describe("durable audit writes", () => {
  it("writes successful project mutation events through the active RLS transaction", () => {
    expect(projectActions).toContain("await writeAuditEvent(tx");
    expect(projectActions).toContain('action: "project.create"');
    expect(projectActions).toContain('action: "project.delete"');
    expect(auditWriter).toContain("tx.insert(schema.auditEvent)");
  });
});
