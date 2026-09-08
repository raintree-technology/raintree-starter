import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  signup: vi.fn(),
  login: vi.fn(),
  magic: vi.fn(),
  reset: vi.fn(),
  requestReset: vi.fn(),
  verifyEmail: vi.fn(),
  totp: vi.fn(),
  backup: vi.fn(),
  profile: vi.fn(),
  password: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: state.push, refresh: state.refresh }),
}));
vi.mock("sonner", () => ({
  toast: { success: state.success, error: state.error },
}));
vi.mock("@/lib/config", () => ({ features: { magicLink: true } }));
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signUp: { email: state.signup },
    signIn: { email: state.login, magicLink: state.magic },
    resetPassword: state.reset,
    requestPasswordReset: state.requestReset,
    sendVerificationEmail: state.verifyEmail,
    twoFactor: { verifyTotp: state.totp, verifyBackupCode: state.backup },
    updateUser: state.profile,
    changePassword: state.password,
  },
}));

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LoginForm } from "@/components/auth/login-form";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SignupForm } from "@/components/auth/signup-form";
import { TwoFactorForm } from "@/components/auth/two-factor-form";
import { VerifyEmailCard } from "@/components/auth/verify-email-card";
import { ChangePassword } from "@/components/settings/change-password";
import { ProfileForm } from "@/components/settings/profile-form";

const providers = { google: false, github: false };
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  for (const fn of [
    state.signup,
    state.login,
    state.magic,
    state.reset,
    state.requestReset,
    state.verifyEmail,
    state.profile,
    state.password,
  ])
    fn.mockResolvedValue({ data: {}, error: null });
  state.totp.mockResolvedValue({ error: { message: "Invalid code" } });
  state.backup.mockResolvedValue({ error: { message: "Invalid code" } });
});

let root: Root;
async function render(node: ReactNode) {
  root = createRoot(document.body.appendChild(document.createElement("div")));
  await act(async () => root.render(node));
}
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  document.body.replaceChildren();
});
async function submit(values: Record<string, string>) {
  await act(async () => {
    for (const [label, value] of Object.entries(values)) {
      const fieldLabel = [...document.querySelectorAll("label")].find(
        (el) => el.textContent === label,
      );
      const input = document.getElementById(
        fieldLabel?.htmlFor ?? "",
      ) as HTMLInputElement;
      if (!input) throw new Error(`Missing input: ${label}`);
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  await act(async () => {
    document
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}
async function click(name: string) {
  const button = [...document.querySelectorAll("button")].find(
    (el) => el.textContent === name,
  );
  if (!button) throw new Error(`Missing button: ${name}`);
  await act(async () => button.click());
}

it("validates signup input, submits valid details, and navigates to email verification", async () => {
  await render(<SignupForm providers={providers} />);
  await submit({ Name: "", Email: "bad", Password: "short" });
  expect(state.signup).not.toHaveBeenCalled();
  expect(document.body.textContent).toContain("Name is required");
  await submit({
    Name: "Test Person",
    Email: "test@example.test",
    Password: "test-only-password",
  });
  expect(state.push).toHaveBeenCalledWith(
    "/verify-email?email=test%40example.test",
  );
});
it("keeps signup provider failures visible without navigating", async () => {
  state.signup.mockRejectedValue(new Error("Test failure"));
  await render(<SignupForm providers={providers} />);
  await submit({
    Name: "Test",
    Email: "test@example.test",
    Password: "test-only-password",
  });
  expect(state.error).toHaveBeenCalled();
  expect(state.push).not.toHaveBeenCalled();
});
it("routes a challenged login to two-factor and displays rejected credentials", async () => {
  state.login.mockResolvedValueOnce({
    data: { twoFactorRedirect: true },
    error: null,
  });
  await render(<LoginForm redirect="/dashboard" providers={providers} />);
  await submit({ Email: "test@example.test", Password: "test-only-password" });
  expect(state.push).toHaveBeenCalledWith("/two-factor");
  state.login.mockResolvedValueOnce({ error: { message: "Wrong password" } });
  await submit({ Email: "test@example.test", Password: "wrong" });
  expect(state.error).toHaveBeenCalledWith("Wrong password");
});
it("blocks invalid reset input and sends matching passwords with the supplied token", async () => {
  await render(<ResetPasswordForm />);
  expect(document.body.textContent).toContain("Invalid link");
  await act(async () =>
    root.render(<ResetPasswordForm token="test-only-token" />),
  );
  await submit({
    "New password": "long-enough",
    "Confirm password": "different",
  });
  expect(state.reset).not.toHaveBeenCalled();
  await submit({
    "New password": "long-enough",
    "Confirm password": "long-enough",
  });
  expect(state.reset).toHaveBeenCalledWith({
    newPassword: "long-enough",
    token: "test-only-token",
  });
  expect(state.push).toHaveBeenCalledWith("/login");
});
it("requests a password reset and renders the confirmation", async () => {
  await render(<ForgotPasswordForm />);
  await submit({ Email: "test@example.test" });
  expect(state.requestReset).toHaveBeenCalledWith(
    expect.objectContaining({ email: "test@example.test" }),
  );
  expect(document.body.textContent).toContain(
    "If an account exists for that email, a reset link is on its way.",
  );
});
it("requires an email before resending verification and submits the configured address", async () => {
  await render(<VerifyEmailCard />);
  await click("Resend email");
  expect(state.verifyEmail).not.toHaveBeenCalled();
  await act(async () =>
    root.render(<VerifyEmailCard email="test@example.test" />),
  );
  await click("Resend email");
  expect(state.verifyEmail).toHaveBeenCalledWith({
    email: "test@example.test",
    callbackURL: "/dashboard",
  });
});
it("switches between TOTP and backup code verification", async () => {
  await render(<TwoFactorForm />);
  await submit({ Code: "123456" });
  expect(state.totp).toHaveBeenCalledWith({ code: "123456" });

  await click("Use a backup code");
  await submit({ "Backup code": "test-backup" });
  expect(state.backup).toHaveBeenCalledWith({ code: "test-backup" });
});
it("trims profile names and refuses empty names", async () => {
  await render(<ProfileForm initialName="Old" email="test@example.test" />);
  await submit({ Name: "   " });
  expect(state.profile).not.toHaveBeenCalled();
  await submit({ Name: "  New name  " });
  expect(state.profile).toHaveBeenCalledWith({ name: "New name" });
  expect(state.refresh).toHaveBeenCalled();
});
it("rejects unchanged passwords and requests revocation of other sessions", async () => {
  await render(<ChangePassword />);
  await submit({
    "Current password": "same-password",
    "New password": "same-password",
  });
  expect(state.password).not.toHaveBeenCalled();
  await submit({
    "Current password": "same-password",
    "New password": "new-password",
  });
  expect(state.password).toHaveBeenCalledWith({
    currentPassword: "same-password",
    newPassword: "new-password",
    revokeOtherSessions: true,
  });
});
