import { NextResponse } from "next/server";
import { apiError, parseJson } from "@/lib/api";
import { contactSubmitSchema, type ContactSubmitInput } from "@/lib/validation";

const HUBSPOT_PORTAL_ID = "20867488";
const HUBSPOT_FORM_GUID = "cfda52bd-4573-4e7e-9057-68d2aea2a10a";
const HUBSPOT_SUBMIT_URL = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`;

const PAGE_URI = "https://www.dunamisstudios.net/custom-development";
const PAGE_NAME = "Custom Development";

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

function buildHubspotPayload(data: ContactSubmitInput, hutk: string | undefined) {
  return {
    fields: [
      { objectTypeId: "0-1", name: "firstname", value: data.firstname },
      { objectTypeId: "0-1", name: "lastname", value: data.lastname },
      { objectTypeId: "0-1", name: "email", value: data.email },
      // The HubSpot form configures the company field as the Company
      // object's `name` property (objectTypeId 0-2), not the Contact's
      // `company` property (0-1). Sending it under 0-1/company yields a
      // 400 "Required field '0-2/name' is missing" from the Submissions
      // API. The client-side payload still carries `company`; the route
      // is the only place that maps to HubSpot's expected shape.
      { objectTypeId: "0-2", name: "name", value: data.company },
      {
        objectTypeId: "0-1",
        name: "what_are_you_trying_to_solve",
        value: data.what_are_you_trying_to_solve,
      },
      {
        objectTypeId: "0-1",
        name: "custom_dev_budget_range",
        value: data.custom_dev_budget_range,
      },
      {
        objectTypeId: "0-1",
        name: "custom_dev_timeline",
        value: data.custom_dev_timeline,
      },
    ],
    context: {
      ...(hutk ? { hutk } : {}),
      pageUri: PAGE_URI,
      pageName: PAGE_NAME,
    },
  };
}

export async function POST(req: Request) {
  const parsed = await parseJson(req, contactSubmitSchema);
  if (!parsed.ok) return parsed.response;

  const hutk = getHubspotUtk(req);
  const payload = buildHubspotPayload(parsed.data, hutk);

  let hubspotRes: Response;
  try {
    hubspotRes = await fetch(HUBSPOT_SUBMIT_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[contact-submit] network error reaching HubSpot:", err);
    return apiError(
      502,
      "hubspot_unreachable",
      "We could not reach our form provider. Please try again in a moment.",
    );
  }

  if (hubspotRes.ok) {
    return NextResponse.json({ ok: true });
  }

  const rawBody = await hubspotRes.text();
  console.error(
    `[contact-submit] HubSpot returned ${hubspotRes.status} ${hubspotRes.statusText}:`,
    rawBody,
  );

  let message = "Submission failed. Please try again or email josh@dunamisstudios.net.";
  try {
    const parsedBody = JSON.parse(rawBody) as { message?: string };
    if (parsedBody && typeof parsedBody.message === "string" && parsedBody.message) {
      message = parsedBody.message;
    }
  } catch {
    // Body was not JSON; keep the generic message.
  }

  return apiError(hubspotRes.status, "hubspot_error", message);
}
