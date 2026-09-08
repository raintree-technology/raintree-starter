import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata = createNoIndexMetadata({
  title: "Forgot password",
  description: "Request a password reset link for your account.",
  path: "/forgot-password",
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
