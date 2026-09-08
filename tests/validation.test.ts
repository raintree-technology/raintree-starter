import { describe, expect, it } from "vitest";
import {
  createOrganizationSchema,
  inviteMemberSchema,
  signUpSchema,
} from "@/lib/validation";

describe("signUpSchema", () => {
  it("accepts valid input", () => {
    expect(
      signUpSchema.safeParse({
        name: "Ada",
        email: "ada@example.com",
        password: "password1",
      }).success,
    ).toBe(true);
  });
  it("rejects short passwords", () => {
    expect(
      signUpSchema.safeParse({
        name: "Ada",
        email: "ada@example.com",
        password: "short",
      }).success,
    ).toBe(false);
  });
  it("rejects malformed emails", () => {
    expect(
      signUpSchema.safeParse({
        name: "Ada",
        email: "nope",
        password: "password1",
      }).success,
    ).toBe(false);
  });
});

describe("createOrganizationSchema", () => {
  it("accepts a kebab-case slug", () => {
    expect(
      createOrganizationSchema.safeParse({ name: "Acme", slug: "acme-co" })
        .success,
    ).toBe(true);
  });
  it("rejects slugs with spaces or capitals", () => {
    expect(
      createOrganizationSchema.safeParse({ name: "Acme", slug: "Acme Co" })
        .success,
    ).toBe(false);
  });
});

describe("inviteMemberSchema", () => {
  it("defaults role to member", () => {
    const result = inviteMemberSchema.safeParse({ email: "a@example.com" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.role).toBe("member");
  });
});
