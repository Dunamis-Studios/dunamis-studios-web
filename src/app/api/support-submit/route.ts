import { NextResponse } from "next/server";

import { apiError, parseJson } from "@/lib/api";
import { rateLimit } from "@/lib/ratelimit";
import { truncatedClientIp } from "@/lib/truncate-ip";
import {
  supportTicketSchema,
  SUPPORT_CONDITIONAL_FIELDS_BY_CATEGORY,
  SUPPORT_CONSENT_TEXT,
  type SupportTicketInput,
} from "@/lib/validation";
import {
  submitToHubspotForm,
  type HubspotFormField,
} from "@/lib/hubspot/submit-form";
import { verifyKey } from "@/lib/verification-key/service";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";
import { getClientIp } from "@/lib/get-client-ip";

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
 * Conditional required-when validation lives in three coordinated
 * layers, all backed by the same SUPPORT_CONDITIONAL_FIELDS_BY_CATEGORY
 * map in src/lib/validation.ts:
 *
 *   1. React form: blocks submit when a required-for-Category field
 *      is empty, hides fields that don't apply to the Category.
 *   2. Zod schema (.superRefine): server-side re-check that surfaces
 *      one ZodIssue per missing required-for-Category field. A
 *      direct-curl POST that bypasses the UI fails at parseJson.
 *   3. buildFields below: filters conditional fields to the visible
 *      set for the Category before forwarding, so an out-of-category
 *      value supplied by a tampering client never reaches the
 *      HubSpot ticket.
 *
 * HubSpot itself enforces property-level Required at the form
 * definition level (it does not honor our conditional logic), so
 * every Required toggle on a conditional property must be disabled
 * in the HubSpot form editor for the validation here to be the
 * load-bearing layer.
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

/**
 * HubSpot object type IDs. Canonical values documented in the
 * hubspot-gotchas skill; "0-1" is Contact, "0-5" is Ticket. The
 * support form is a multi-object form (one Ticket per submission,
 * one Contact upserted alongside), so every field must carry its
 * owning object's id or HubSpot defaults the property to Contact
 * and the ticket pipeline rejects with "Required field
 * 'TICKET.<name>' is missing" for every property that should have
 * landed on the ticket.
 */
const HS_CONTACT = "0-1";
const HS_TICKET = "0-5";

function buildFields(data: SupportTicketInput): HubspotFormField[] {
  // Order matches the HubSpot form's field order so a future audit of
  // raw submission payloads reads naturally. Optional fields appear
  // only when the form sent a value; HubSpot rejects unknown empty
  // values cleanly but adding them adds nothing.
  const fields: HubspotFormField[] = [
    { objectTypeId: HS_CONTACT, name: "firstname", value: data.firstname },
    { objectTypeId: HS_CONTACT, name: "lastname", value: data.lastname },
    { objectTypeId: HS_CONTACT, name: "email", value: data.email },
    { objectTypeId: HS_TICKET, name: "subject", value: data.subject },
    {
      objectTypeId: HS_TICKET,
      // Ticket internal property name is `hs_ticket_category`, not
      // `category`. Verified via HubSpot get_properties MCP and the
      // hubspot-gotchas skill. Enum values stay verbatim from the form.
      name: "hs_ticket_category",
      value: data.category,
    },
    {
      objectTypeId: HS_TICKET,
      name: "what_happened",
      value: data.what_happened,
    },
    {
      objectTypeId: HS_TICKET,
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

  // Only forward conditional fields that are actually visible for the
  // chosen Category. The React form's buildSubmitPayload already
  // filters this way client-side; this is the server-side defense-in-
  // depth that catches a direct-curl POST supplying out-of-category
  // values (e.g. atelier_version on a Refund Request). Empty values
  // are still dropped, so HubSpot only sees the populated set the
  // form would have surfaced for that Category.
  const visibleSet = new Set<string>([
    ...SUPPORT_CONDITIONAL_FIELDS_BY_CATEGORY[data.category].required,
    ...SUPPORT_CONDITIONAL_FIELDS_BY_CATEGORY[data.category].optional,
  ]);
  for (const f of conditional) {
    if (!visibleSet.has(f.name)) continue;
    if (f.value !== undefined && f.value !== "") {
      fields.push({ objectTypeId: HS_TICKET, name: f.name, value: f.value });
    }
  }
  return fields;
}

export async function POST(req: Request) {
  const limited = await rateLimit(req, "support");
  if (!limited.ok) return limited.response;

  const parsed = await parseJson(req, supportTicketSchema);
  if (!parsed.ok) return parsed.response;

  // Turnstile gate. Runs BEFORE the verification key check so a
  // botted request never even pays for the HMAC verify. A failed
  // Turnstile siteverify returns 400 with a generic message; the
  // legitimate path silently consumes a token per submit.
  const turnstile = await verifyTurnstileToken(
    parsed.data.turnstileToken,
    getClientIp(req),
  );
  if (!turnstile.valid) {
    return apiError(
      400,
      "turnstile_failed",
      "Bot protection check failed. Please refresh and try again.",
    );
  }

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
