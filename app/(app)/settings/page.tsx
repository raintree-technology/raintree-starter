import { ProfileForm } from "@/components/settings/profile-form";
import { getAppContext } from "@/lib/app-context";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata = createNoIndexMetadata({
  title: "Profile settings",
  description: "Update your profile name and account email.",
  path: "/settings",
});

export default async function ProfileSettingsPage() {
  const ctx = await getAppContext();
  if (!ctx) return null;
  return <ProfileForm initialName={ctx.user.name} email={ctx.user.email} />;
}
