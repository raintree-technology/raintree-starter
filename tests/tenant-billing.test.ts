import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  organizations: [] as { id: string; name: string }[],
  query: vi.fn(),
  subscription: vi.fn(),
  retrieve: vi.fn(),
  update: vi.fn(),
  after: vi.fn(),
  sync: vi.fn(),
}));
vi.mock("@/lib/logger", () => {
  const log = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return {
    logger: { child: () => log },
    createOperationLogger: () => ({ ...log, log }),
  };
});
vi.mock("@/lib/session", () => ({
  getSession: async () => ({
    user: { id: "user" },
    session: { activeOrganizationId: "removed" },
  }),
  getActiveOrganizationId: () => "removed",
}));
vi.mock("@/lib/tenancy", () => ({ isMultiTenant: true }));
vi.mock("@/lib/organizations", () => ({
  getOrganizationsForUser: async () => state.organizations,
}));
vi.mock("@/lib/billing/subscription", () => ({
  billingReferenceId: ({
    userId,
    activeOrganizationId,
  }: {
    userId: string;
    activeOrganizationId: string | null;
  }) => activeOrganizationId ?? userId,
  getActiveSubscription: state.subscription,
  planForSubscription: () => null,
}));
vi.mock("@/db", () => ({
  db: { select: () => ({ from: () => ({ where: state.query }) }) },
}));
vi.mock("@/lib/config", () => ({ features: { billing: true } }));
vi.mock("@/lib/stripe", () => ({
  isStripeConfigured: true,
  stripe: { subscriptions: { retrieve: state.retrieve, update: state.update } },
}));
vi.mock("@better-auth/stripe", () => ({
  stripe: (options: unknown) => options,
}));
vi.mock("better-auth/plugins/organization", () => ({
  organization: (options: unknown) => options,
}));
vi.mock("@/lib/email", () => ({
  sendMagicLinkEmail: vi.fn(),
  sendOrganizationInvitation: vi.fn(),
}));
vi.mock("@/lib/after", () => ({ runAfterResponse: state.after }));

import { getAppContext } from "@/lib/app-context";
import {
  createBillingPlugins,
  createOrganizationPlugin,
} from "@/lib/auth/plugins";
import { syncOrganizationSeats } from "@/lib/billing/seats";

beforeEach(() => {
  vi.clearAllMocks();
  state.organizations = [];
});

it("does not use a removed organization from a signed session for billing or page context", async () => {
  const context = await getAppContext();
  expect(context?.activeOrganization).toBeNull();
  expect(context?.activeOrganizationId).toBeNull();
  expect(state.subscription).toHaveBeenCalledWith("user");
  state.organizations = [{ id: "removed", name: "Current membership" }];
  expect((await getAppContext())?.activeOrganizationId).toBe("removed");
});

it("derives organization checkout quantities from membership and rejects ordinary members", async () => {
  // The mocked plugin returns its configuration so its real callback can run.
  const [plugin] = createBillingPlugins() as unknown as [
    {
      subscription: {
        authorizeReference: (
          input: { user: { id: string }; referenceId: string; action: string },
          context: { body: { plan: string; seats: number } },
        ) => Promise<boolean>;
      };
    },
  ];
  const input = {
    user: { id: "user" },
    referenceId: "org",
    action: "upgrade-subscription",
  };
  const context = { body: { plan: "team", seats: 999 } };
  state.query
    .mockResolvedValueOnce([{ role: "owner" }])
    .mockResolvedValueOnce([{ seats: 3 }]);
  expect(await plugin.subscription.authorizeReference(input, context)).toBe(
    true,
  );
  expect(context.body.seats).toBe(3);
  context.body = { plan: "pro", seats: 999 };
  state.query
    .mockResolvedValueOnce([{ role: "admin" }])
    .mockResolvedValueOnce([{ seats: 3 }]);
  expect(await plugin.subscription.authorizeReference(input, context)).toBe(
    true,
  );
  expect(context.body.seats).toBe(1);
  state.query.mockResolvedValueOnce([{ role: "member" }]);
  expect(await plugin.subscription.authorizeReference(input, context)).toBe(
    false,
  );
});

it("registers seat synchronization for accepted invitations", async () => {
  const plugin = createOrganizationPlugin() as unknown as {
    organizationHooks: {
      afterAcceptInvitation: (input: {
        organization: { id: string };
      }) => Promise<void>;
    };
  };
  await plugin.organizationHooks.afterAcceptInvitation({
    organization: { id: "org" },
  });
  expect(state.after).toHaveBeenCalledWith(
    "auth.organization.invitation.accepted",
    expect.any(Function),
    { module: "auth", organizationId: "org" },
  );
  state.query.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
  await state.after.mock.calls[0][1]();
  expect(state.query).toHaveBeenCalledTimes(2);
});

it("leaves flat subscriptions alone and updates the matching seat price rather than an unrelated item", async () => {
  state.query
    .mockResolvedValueOnce([{ id: "a" }, { id: "b" }])
    .mockResolvedValueOnce([{ plan: "pro", stripeSubscriptionId: "sub" }]);
  await syncOrganizationSeats("org");
  expect(state.retrieve).not.toHaveBeenCalled();
  state.query
    .mockResolvedValueOnce([{ id: "a" }, { id: "b" }])
    .mockResolvedValueOnce([{ plan: "team", stripeSubscriptionId: "sub" }]);
  state.retrieve.mockResolvedValue({
    items: {
      data: [
        { id: "unrelated", price: { id: "other" }, quantity: 1 },
        { id: "seat", price: { id: "price_team_year_test" }, quantity: 1 },
      ],
    },
  });
  await syncOrganizationSeats("org");
  expect(state.update).toHaveBeenCalledWith("sub", {
    items: [{ id: "seat", quantity: 2 }],
    proration_behavior: "create_prorations",
  });
});
