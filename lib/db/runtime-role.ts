export type RuntimeRolePosture = {
  name: string;
  superuser: boolean;
  bypassRls: boolean;
  ownedTenantTables: string[];
};

export function assertSafeRuntimeRole(posture: RuntimeRolePosture): void {
  if (posture.superuser) {
    throw new Error(`Runtime role ${posture.name} must not be a superuser.`);
  }
  if (posture.bypassRls) {
    throw new Error(`Runtime role ${posture.name} must not have BYPASSRLS.`);
  }
  if (posture.ownedTenantTables.length > 0) {
    throw new Error(
      `Runtime role ${posture.name} must not own tenant tables: ${posture.ownedTenantTables.join(", ")}.`,
    );
  }
}
