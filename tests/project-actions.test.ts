import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  billing: true,
  subscription: vi.fn(),
  session: vi.fn(),
  query: vi.fn(),
  values: vi.fn(),
  deleted: vi.fn(),
  rls: vi.fn(),
  audit: vi.fn(),
  revalidate: vi.fn(),
  plan: { name: "free", label: "Free", limits: { projects: 3 } },
}));
const tx = {
  select: () => ({ from: () => ({ where: state.query }) }),
  insert: () => ({ values: state.values }),
  delete: () => ({ where: state.deleted }),
};
vi.mock("@/lib/config", () => ({
  features: {
    get billing() {
      return state.billing;
    },
  },
}));
vi.mock("@/lib/session", () => ({
  requireSession: state.session,
  getActiveOrganizationId: () => "org",
}));
vi.mock("@/lib/tenancy", () => ({ isMultiTenant: true }));
vi.mock("@/lib/db/rls", () => ({ withRlsContext: state.rls }));
vi.mock("@/lib/audit", () => ({ writeAuditEvent: state.audit }));
vi.mock("@/lib/auth-audit", () => ({ auditAuthEventAfterResponse: vi.fn() }));
vi.mock("@/lib/logger", () => ({
  createOperationLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));
vi.mock("@/lib/billing/subscription", () => ({
  billingReferenceId: () => "org",
  getActiveSubscription: state.subscription,
  planForSubscription: () => state.plan,
}));
vi.mock("next/cache", () => ({ revalidatePath: state.revalidate }));

import {
  createProjectAction,
  deleteProjectAction,
} from "@/lib/actions/projects";

beforeEach(() => {
  vi.clearAllMocks();
  state.billing = true;
  state.subscription.mockResolvedValue(null);
  state.session.mockResolvedValue({ user: { id: "user" } });
  state.rls.mockImplementation(async (_actor, fn) => fn(tx));
  state.query.mockResolvedValue([{ value: 0 }]);
  state.values.mockReturnValue({ returning: async () => [{ id: "new" }] });
});
const form = (name: string) => {
  const data = new FormData();
  data.set("name", name);
  data.set("userId", "forged-user");
  data.set("organizationId", "forged-org");
  return data;
};
it("requires a session and rejects invalid project names", async () => {
  state.session.mockRejectedValueOnce(new Error("Unauthenticated"));
  await expect(createProjectAction({}, form("Name"))).rejects.toThrow(
    "Unauthenticated",
  );
  expect(await createProjectAction({}, form(" "))).toHaveProperty("error");
  expect(state.rls).not.toHaveBeenCalled();
});
it("enforces the project limit before inserting", async () => {
  state.query.mockResolvedValue([{ value: 3 }]);
  expect(await createProjectAction({}, form("Name"))).toHaveProperty("error");
  expect(state.values).not.toHaveBeenCalled();
});
it("uses session ownership, writes audit history in the transaction, and refreshes the dashboard", async () => {
  expect(await createProjectAction({}, form(" New Project "))).toEqual({
    success: true,
  });
  expect(state.values).toHaveBeenCalledWith({
    name: "New Project",
    slug: "new-project",
    userId: "user",
    organizationId: "org",
  });
  expect(state.audit).toHaveBeenCalledWith(
    tx,
    expect.objectContaining({ action: "project.create", resourceId: "new" }),
  );
  expect(state.revalidate).toHaveBeenCalledWith("/dashboard");
});
it("refuses deletion when the RLS-scoped lookup cannot find the project", async () => {
  state.query.mockResolvedValue([]);
  expect(await deleteProjectAction("foreign")).toEqual({
    error: "Project not found",
  });
  expect(state.deleted).not.toHaveBeenCalled();
  expect(state.audit).not.toHaveBeenCalled();
});
it("deletes visible projects and propagates storage failures", async () => {
  state.query.mockResolvedValue([{ id: "owned", name: "Owned" }]);
  expect(await deleteProjectAction("owned")).toEqual({ success: true });
  expect(state.audit).toHaveBeenCalledWith(
    tx,
    expect.objectContaining({ action: "project.delete" }),
  );
  state.deleted.mockRejectedValueOnce(new Error("Database unavailable"));
  await expect(deleteProjectAction("owned")).rejects.toThrow(
    "Database unavailable",
  );
});

it("does not query subscriptions or impose plan limits when billing is disabled", async () => {
  state.billing = false;
  state.query.mockResolvedValue([{ value: 100 }]);
  expect(await createProjectAction({}, form("No billing"))).toEqual({
    success: true,
  });
  expect(state.subscription).not.toHaveBeenCalled();
  expect(state.query).not.toHaveBeenCalled();
  expect(state.values).toHaveBeenCalled();
});
