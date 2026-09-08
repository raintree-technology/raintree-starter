import { TwoFactorForm } from "@/components/auth/two-factor-form";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata = createNoIndexMetadata({
  title: "Two-factor authentication",
  description: "Complete the second authentication step for your account.",
  path: "/two-factor",
});

export default function TwoFactorPage() {
  return <TwoFactorForm />;
}
