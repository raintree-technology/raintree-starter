import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ billing: false }));
vi.mock("@/lib/config", () => ({
  features: {
    appName: "Reference",
    get billing() {
      return state.billing;
    },
  },
}));
vi.mock("@/lib/auth-client", () => ({ authClient: {} }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({}),
}));

import { AppShell } from "@/components/app/app-shell";

it("omits billing links without billing and preserves them for paid profiles", () => {
  const render = () =>
    renderToStaticMarkup(
      <AppShell
        user={{ name: "Test", email: "test@example.test" }}
        organizations={[]}
        activeOrganization={null}
        multiTenant={false}
        isAdmin={false}
        planLabel="Free"
      >
        <p>Dashboard</p>
      </AppShell>,
    );
  state.billing = false;
  expect(render()).not.toContain('href="/settings/billing"');
  state.billing = true;
  expect(render()).toContain('href="/settings/billing"');
});
