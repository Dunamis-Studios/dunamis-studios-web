import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Email is required")
  .max(254, "Email is too long")
  .email("Enter a valid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password is too long")
  .refine((pw) => /[\d\W_]/.test(pw), {
    message: "Password must contain a number or symbol",
  });

const nameSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .max(60, "Too long")
  .regex(/^[\p{L}\p{M}'\-. ]+$/u, "Only letters, spaces, apostrophes, hyphens");

export const signupSchema = z
  .object({
    email: emailSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(200),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(16).max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(16).max(200),
});

export const profileUpdateSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const productSlugSchema = z.enum(["property-pulse", "debrief"]);
export const portalIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid portal id");

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
