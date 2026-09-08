import { starterConfig } from "@/starter.config";

/**
 * Tenancy model, selected in starter.config.ts.
 *
 * - single: each user is their own billing entity. No organizations.
 * - multi:  users belong to organizations; billing is per-organization with
 *           per-seat pricing (one seat per member).
 *
 * The database schema always contains the organization tables, so switching
 * modes never requires a migration — only the auth behavior, billing reference,
 * and UI change.
 */
const tenancyMode = starterConfig.tenancy as "single" | "multi";
export const isMultiTenant = tenancyMode === "multi";
