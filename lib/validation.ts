import { z } from "zod";

/** Project create/update (tenant-scoped resource). */
export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Too long"),
});

/** Organization creation (multi-tenant mode). */
export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes only"),
});

/** Invite a member to the active organization. */
export const inviteMemberSchema = z.object({
  email: z.email("Enter a valid email"),
  role: z.enum(["member", "admin", "owner"]).default("member"),
});

/** Auth form schemas (shared by client forms + server validation). */
export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters").max(128),
});

export const signInSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
