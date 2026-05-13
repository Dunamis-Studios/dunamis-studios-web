import { NextResponse } from "next/server";
import { apiError, parseJson } from "@/lib/api";
import {
  contactSubmitSchema,
  type ContactSource,
  type ContactSubmitInput,
} from "@/lib/validation";
import { submitToHubspotForm } from "@/lib/hubspot/submit-form";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";
import { getClientIp } from "@/lib/get-client-ip";

const SITE_ORIGIN = "https://www.dunamisstudios.net";

const SOURCE_PAGE_META: Record<
  ContactSource,
  { pageUri: string; pageName: string }
> = {
  "hubspot-custom-development": {
    pageUri: `${SITE_ORIGIN}/custom-development`,
    pageName: "HubSpot Custom Development",
  },
  "build-services": {
    pageUri: `${SITE_ORIGIN}/build-services`,
    pageName: "Build Services",
  },
  general: {
    pageUri: `${SITE_ORIGIN}/contact`,
    pageName: "Contact",
  },
};

const DEFAULT_PAGE_META = SOURCE_PAGE_META["hubspot-custom-development"];

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

function buildFields(data: ContactSubmitInput) {
  return [
    { name: "firstname", value: data.firstname },
    { name: "lastname", value: data.lastname },
    { name: "email", value: data.email },
    { name: "company", value: data.company },
    {
      name: "what_are_you_trying_to_solve",
      value: data.what_are_you_trying_to_solve,
    },
    { name: "custom_dev_budget_range", value: data.custom_dev_budget_range },
    { name: "custom_dev_timeline", value: data.custom_dev_timeline },
  ];
}

export async function POST(req: Request) {
  const parsed = await parseJson(req, contactSubmitSchema);
  if (!parsed.ok) return parsed.response;

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

  const formId = process.env.HUBSPOT_CONTACT_FORM_GUID;
  if (!formId) {
    console.error("[contact-submit] HUBSPOT_CONTACT_FORM_GUID is not set");
    return apiError(
      500,
      "config_missing",
      "Our form is temporarily unavailable. Please email josh@dunamisstudios.net.",
    );
  }

  const pageMeta =
    (parsed.data.source && SOURCE_PAGE_META[parsed.data.source]) ??
    DEFAULT_PAGE_META;
  const hutk = getHubspotUtk(req);

  const result = await submitToHubspotForm({
    formId,
    fields: buildFields(parsed.data),
    context: {
      ...(hutk ? { hutk } : {}),
      pageUri: pageMeta.pageUri,
      pageName: pageMeta.pageName,
    },
  });

  if (result.ok) {
    return NextResponse.json({ ok: true });
  }

  // status 0 means the call never reached HubSpot (network error,
  // timeout, abort). Surface as 502 with a try-again hint. Status
  // 4xx / 5xx from HubSpot passes through with HubSpot's own error
  // message when one was extractable, matching the prior behavior of
  // this route.
  if (result.status === 0) {
    return apiError(
      502,
      "hubspot_unreachable",
      "We could not reach our form provider. Please try again in a moment.",
    );
  }

  const fallback =
    "Submission failed. Please try again or email josh@dunamisstudios.net.";
  return apiError(
    result.status,
    "hubspot_error",
    result.error || fallback,
  );
}
