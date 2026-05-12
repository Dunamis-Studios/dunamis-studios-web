import { NextResponse } from "next/server";

import { apiError, parseJson } from "@/lib/api";
import { rateLimit } from "@/lib/ratelimit";
import { truncatedClientIp } from "@/lib/truncate-ip";
import {
  supportTicketSchema,
  SUPPORT_CONSENT_TEXT,
  type SupportTicketInput,
} from "@/lib/validation";
import {
  submitToHubspotForm,
  type HubspotFormField,
} from "@/lib/hubspot/submit-form";
import { verifyKey } from "@/lib/verification-key/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/support-submit
 *
 * Submits a customer support ticket to the HubSpot form whose
 * Help Desk pipeline opens a ticket on submission. Mirrors the
 * contact-submit posture (surface failures to the user) rather than
 * the notify / tools / courses posture (log-and-swallow): Help Desk
 * is the source of truth for tickets, so a failed submission is a
 * real customer-facing failure that must surface, not a silent loss.
 *
 * Rate limit: 10 submissions per hour per truncated IP via the
 * "support" limiter spec. A customer hitting the cap is rare; the
 * fallback for those is the explicit email address surfaced in the
 * 502 error message.
 *
 * Conditional required-when validation lives in the React form's UI
 * (the categories that need refund_reason, etc.). The schema accepts
 * any subset of optional fields so a misclick cannot trip a 500;
 * the route forwards whatever the form sent to HubSpot and trusts
 * the UI's required-when enforcement.
 */

const SITE_ORIGIN = "https://www.dunamisstudios.net";

function getHubspotUtk(req: Request): string | undefined {
  const header = req.headers.get("cookie");
  if (!header) return undefined;
  const match = header.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function buildFields(data: SupportTicketInput): HubspotFormField[] {
  // Order matches the HubSpot form's field order so a future audit of
  // raw submission payloads reads naturally. Optional fields appear
  // only when the form sent a value; HubSpot rejects unknown empty
  // values cleanly but adding them adds nothing.
  const fields: HubspotFormField[] = [
    { name: "firstname", value: data.firstname },
    { name: "lastname", value: data.lastname },
    { name: "email", value: data.email },
    { name: "subject", value: data.subject },
    { name: "category", value: data.category },
    { name: "what_happened", value: data.what_happened },
    {
      name: "identity_verification_reference",
      value: data.identity_verification_reference,
    },
  ];

  const conditional: Array<{ name: string; value: string | undefined }> = [
    { name: "order_email", value: data.order_email },
    { name: "license_key", value: data.license_key },
    { name: "order_or_transaction_id", value: data.order_or_transaction_id },
    { name: "refund_reason", value: data.refund_reason },
    { name: "atelier_version", value: data.atelier_version },
    { name: "operating_system", value: data.operating_system },
    { name: "os_version_or_build", value: data.os_version_or_build },
    { name: "steps_to_reproduce", value: data.steps_to_reproduce },
    { name: "issue_first_occurred", value: data.issue_first_occurred },
    {
      name: "license_or_device_transfer_action",
      value: data.license_or_device_transfer_action,
    },
    { name: "data_request_type", value: data.data_request_type },
    { name: "affected_component", value: data.affected_component },
    { name: "suggested_severity", value: data.suggested_severity },
    {
      name: "public_disclosure_status",
      value: data.public_disclosure_status,
    },
  ];
  for (const f of conditional) {
    if (f.value !== undefined && f.value !== "") {
      fields.push({ name: f.name, value: f.value });
    }
  }
  return fields;
}

export async function POST(req: Request) {
  const limited = await rateLimit(req, "support");
  if (!limited.ok) return limited.response;

  const parsed = await parseJson(req, supportTicketSchema);
  if (!parsed.ok) return parsed.response;

  // Verification key gate. The widget already enforced the
  // (key, email) pairing client-side; this is the load-bearing
  // server-side re-check that prevents anyone from POSTing directly
  // to /api/support-submit without a key (or with a key derived for a
  // different email). A ±1 window tolerance is built into verifyKey
  // for clock-skew and the natural edge-of-window submit.
  const keyOk = verifyKey(
    parsed.data.email,
    parsed.data.identity_verification_reference,
  );
  if (!keyOk) {
    return apiError(
      400,
      "verification_failed",
      "Verification key does not match this email. Generate a fresh key from the verification panel and try again.",
    );
  }

  const formId = process.env.HUBSPOT_SUPPORT_FORM_GUID;
  if (!formId) {
    console.error("[support-submit] HUBSPOT_SUPPORT_FORM_GUID is not set");
    return apiError(
      500,
      "config_missing",
      "Our support form is temporarily unavailable. Please email support@dunamisstudios.net.",
    );
  }

  const hutk = getHubspotUtk(req);
  const ipAddress = truncatedClientIp(req);

  const result = await submitToHubspotForm({
    formId,
    fields: buildFields(parsed.data),
    context: {
      ...(hutk ? { hutk } : {}),
      ...(ipAddress ? { ipAddress } : {}),
      pageUri: `${SITE_ORIGIN}/help/contact-support`,
      pageName: "Customer Support ticket submission",
    },
    legalConsent: {
      consentToProcess: parsed.data.consent === true,
      text: SUPPORT_CONSENT_TEXT,
    },
  });

  if (result.ok) {
    return NextResponse.json({ ok: true });
  }

  if (result.status === 0) {
    return apiError(
      502,
      "hubspot_unreachable",
      "We could not reach our support system. Please try again in a moment, or email support@dunamisstudios.net directly.",
    );
  }

  // Pass-through status with HubSpot's own error message when present,
  // otherwise the generic try-again-or-email fallback. The route
  // surfaces 4xx-classed HubSpot errors as 502 so the client knows
  // the issue was upstream of its payload rather than its payload's
  // shape, which the Zod schema already validated.
  const fallback =
    "Submission failed. Please try again, or email support@dunamisstudios.net directly.";
  return apiError(
    result.status >= 500 ? 502 : 502,
    "hubspot_error",
    result.error || fallback,
  );
}
