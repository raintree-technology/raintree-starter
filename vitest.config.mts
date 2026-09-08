import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    env: {
      SKIP_ENV_VALIDATION: "1",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      STRIPE_PRICE_PRO_MONTHLY: "price_pro_test",
      STRIPE_PRICE_TEAM_MONTHLY: "price_team_test",
      STRIPE_PRICE_TEAM_YEARLY: "price_team_year_test",
    },
  },
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${resolve(root)}/` },
      {
        find: "server-only",
        replacement: resolve(root, "tests/shims/environment-boundary.ts"),
      },
      {
        find: "client-only",
        replacement: resolve(root, "tests/shims/environment-boundary.ts"),
      },
    ],
  },
});
