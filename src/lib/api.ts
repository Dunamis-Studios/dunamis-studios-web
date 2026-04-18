import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}

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

export function fieldsFromZod(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".");
    if (!out[path]) out[path] = issue.message;
  }
  return out;
}

export async function parseJson<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<
  | { ok: true; data: T }
  | { ok: false; response: NextResponse<ApiErrorBody> }
> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: apiError(400, "invalid_json", "Request body must be JSON"),
    };
  }
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
