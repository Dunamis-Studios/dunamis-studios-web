/**
 * Shared API response helpers for every Next.js route handler under
 * src/app/api/. Defines the canonical error envelope and the
 * Zod-validated JSON body parser the routes use uniformly.
 *
 * The error envelope shape (`{ error: { code, message, fields? } }`)
 * is the contract every fetch caller on the frontend relies on. Adding
 * a new top-level field is a breaking change; extend `error.fields`
 * for per-field detail or add new well-known `code` values instead.
 */
import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

/**
 * Standard error response body. Every 4xx/5xx response from /api/**
 * should match this shape so callers can pattern-match on `code`
 * without reaching into raw text or relying on status alone.
 */
export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}

/**
 * Build a JSON error NextResponse with the canonical envelope.
 *
 * @param status - HTTP status code (e.g. 400, 401, 404, 422, 500).
 * @param code - Stable machine-readable identifier the client can
 *               switch on (e.g. "invalid_json", "rate_limited",
 *               "unauthenticated").
 * @param message - Human-readable description for support / dev
 *                  console logs. Safe to surface to end users but
 *                  callers usually translate.
 * @param fields - Optional per-field map for form-style validation
 *                 errors. Each value is a single message string.
 * @returns A NextResponse carrying the error envelope.
 */
export function apiError(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json<ApiErrorBody>(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status },
  );
}

/**
 * Flatten a ZodError's `issues[]` into the `{ fieldPath: message }`
 * map our error envelope's `fields` slot expects.
 *
 * Joins each issue's path array with "." so nested object errors
 * surface as `parent.child`. First message per path wins, since the
 * UI only displays one per field anyway.
 *
 * @param err - Zod's structured validation error.
 * @returns A flat `{ path: message }` map ready to drop into apiError.
 */
export function fieldsFromZod(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".");
    if (!out[path]) out[path] = issue.message;
  }
  return out;
}

/**
 * Read + validate a JSON request body against a Zod schema. Returns
 * either an `ok: true` result with the parsed (typed) data, or an
 * `ok: false` result carrying a pre-built error response the route
 * can return directly.
 *
 * Two failure modes are handled distinctly so the client can react:
 * a malformed body returns 400 with code "invalid_json"; a body that
 * parses but fails the schema returns 422 with code "validation_error"
 * and per-field detail in `fields`.
 *
 * Routes uniformly use this rather than calling req.json() directly,
 * so the contract above stays consistent across the whole API.
 *
 * @param req - The incoming Request.
 * @param schema - Zod schema describing the expected body shape.
 * @returns Discriminated union with either the parsed data or a
 *          ready-to-return error NextResponse.
 */
export async function parseJson<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<
  | { ok: true; data: T }
  | { ok: false; response: NextResponse<ApiErrorBody> }
> {
  // Step 1: parse JSON. A malformed body throws; flatten to a stable
  // 400 with code "invalid_json" so the client doesn't have to
  // introspect the parse error.
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: apiError(400, "invalid_json", "Request body must be JSON"),
    };
  }

  // Step 2: schema-validate using safeParse. On failure, flatten Zod
  // issues into the per-field error map and respond 422 (Unprocessable
  // Entity), which is more accurate than 400 for a syntactically
  // valid body that fails the contract.
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: apiError(
        422,
        "validation_error",
        "One or more fields are invalid",
        fieldsFromZod(parsed.error),
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
