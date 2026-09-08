import { ChangePassword } from "@/components/settings/change-password";
import { Passkeys } from "@/components/settings/passkeys";
import { Sessions } from "@/components/settings/sessions";
import { TwoFactorSetup } from "@/components/settings/two-factor-setup";
import { getAppContext } from "@/lib/app-context";
import { features } from "@/lib/config";
import { listPasskeys, listUserSessions } from "@/lib/data/account";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata = createNoIndexMetadata({
  title: "Security settings",
  description:
    "Manage password, two-factor authentication, passkeys, and sessions.",
  path: "/settings/security",
});

export default async function SecuritySettingsPage() {
  const ctx = await getAppContext();
  if (!ctx) return null;

  const [passkeys, sessions] = await Promise.all([
    listPasskeys(ctx.user.id),
    listUserSessions(ctx.user.id),
  ]);

  const twoFactorEnabled = !!(ctx.user as { twoFactorEnabled?: boolean | null })
    .twoFactorEnabled;

  return (
    <>
      <ChangePassword />
      {features.twoFactor && <TwoFactorSetup enabled={twoFactorEnabled} />}
      {features.passkeys && <Passkeys passkeys={passkeys} />}
      <Sessions sessions={sessions} currentToken={ctx.session.session.token} />
    </>
  );
}
