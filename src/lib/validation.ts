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
  // Normalize to NFC so visually-equivalent names (precomposed é vs
  // decomposed e + ◌́) round-trip to the same stored bytes. Without
  // this, two accounts could register names that render identically
  // but compare unequal, which is a real-world homoglyph attack vector
  // on human-facing screens (support console, shared workspace lists).
  .transform((s) => s.normalize("NFC"))
  .pipe(
    z
      .string()
      .min(1, "Required")
      .max(60, "Too long")
      .regex(
        /^[\p{L}\p{M}'\-. ]+$/u,
        "Only letters, spaces, apostrophes, hyphens",
      ),
  );

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

// Reserved tokens that would look like admin / system accounts if they
// ever ended up in URLs or UI lists. HubSpot portalIds are numeric in
// production so normal traffic never hits these; the blocklist catches
// a misuse of the test-stub path that currently accepts arbitrary
// [a-zA-Z0-9_-]+ so e2e fixtures and local dev scaffolding can seed.
const RESERVED_PORTAL_IDS = new Set([
  "admin",
  "root",
  "system",
  "support",
  "test",
  "internal",
  "api",
  "null",
  "undefined",
]);

export const portalIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid portal id")
  .refine(
    (id) => !RESERVED_PORTAL_IDS.has(id.toLowerCase()),
    "This portal id is reserved",
  );

/**
 * Parse the `{product}:{portalId}` claim token used in the HubSpot-
 * install → Dunamis-signup handoff. Returns null if the shape or
 * components don't validate. Both halves are validated with their
 * respective schemas so callers can trust the result without
 * re-validating.
 */
export function parseClaimToken(
  raw: string | null | undefined,
): { product: z.infer<typeof productSlugSchema>; portalId: string } | null {
  if (!raw || typeof raw !== "string") return null;
  const idx = raw.indexOf(":");
  if (idx <= 0 || idx === raw.length - 1) return null;
  const productCandidate = raw.slice(0, idx);
  const portalIdCandidate = raw.slice(idx + 1);
  const productParsed = productSlugSchema.safeParse(productCandidate);
  if (!productParsed.success) return null;
  const portalIdParsed = portalIdSchema.safeParse(portalIdCandidate);
  if (!portalIdParsed.success) return null;
  return { product: productParsed.data, portalId: portalIdParsed.data };
}

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
