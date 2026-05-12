import "server-only";

import { submitToHubspotForm } from "@/lib/hubspot/submit-form";

/**
 * HubSpot mirror for /api/courses/signup. Submits to the dedicated
 * "Email Courses - Signup" form (GUID in HUBSPOT_COURSES_FORM_GUID).
 * The HubSpot workflow attached to that form is what actually sends the
 * drip emails; this site just hands the contact off and lets HubSpot
 * branch on the hidden course_name field.
 *
 * Delegates the actual HTTP call to the shared submitToHubspotForm()
 * helper. This module owns the field mapping for the course_name
 * hidden field and the form GUID, nothing else.
 *
 * Failure policy: every error is logged and swallowed. The caller has
 * already written the signup to Redis as source of truth; a HubSpot
 * outage must never bubble back to the visitor as a failed submit.
 */

/**
 * Internal name of the hidden "Course Name" property on the form. Per
 * HubSpot's snake_case auto-conversion of property internal names from
 * labels, the label "Course Name" becomes `course_name` on creation.
 * If a future form rename desyncs the label and the internal name,
 * override here without touching every caller.
 */
const COURSE_NAME_FIELD = "course_name";

export interface SubmitCourseSignupArgs {
  /** Visitor email. Required by the HubSpot form. */
  email: string;
  /**
   * Display name of the course the visitor signed up for (e.g. "5-Day
   * HubSpot Audit"). Lands in the hidden course_name field on the
   * HubSpot form so the attached workflow can branch on which course
   * to drip.
   */
  courseName: string;
  firstName?: string;
  lastName?: string;
  /**
   * HubSpot tracking cookie (hubspotutk) when the visitor has tracking
   * enabled. Forwarded to HubSpot so the form submission links to the
   * visitor's existing tracking session for source attribution.
   */
  hubspotutk?: string;
  /**
   * Visitor IP from request headers. Forwarded to HubSpot for geo and
   * IP fields on the submission record. Omit when unavailable so we
   * don't write a sentinel like "unknown" to HubSpot.
   */
  ipAddress?: string;
  /**
   * Public URL of the page that captured the signup (e.g.
   * https://www.dunamisstudios.net/courses/hubspot-audit).
   * Forwarded to HubSpot in the form context.
   */
  pageUri: string;
  /**
   * Human-readable label for the page in HubSpot's submission record
   * (e.g. "5-Day HubSpot Audit signup").
   */
  pageName: string;
}

export async function submitCourseSignup(
  args: SubmitCourseSignupArgs,
): Promise<void> {
  const formGuid = process.env.HUBSPOT_COURSES_FORM_GUID;

  if (!formGuid) {
    console.warn("[hubspot-courses] env var missing; skipping mirror", { // claude-code:allow-console
      hasFormGuid: false,
      course: args.courseName,
    });
    return;
  }

  const fields: Array<{ name: string; value: string }> = [
    { name: "email", value: args.email },
    { name: COURSE_NAME_FIELD, value: args.courseName },
  ];
  if (args.firstName) fields.push({ name: "firstname", value: args.firstName });
  if (args.lastName) fields.push({ name: "lastname", value: args.lastName });

  const result = await submitToHubspotForm({
    formId: formGuid,
    fields,
    context: {
      ...(args.hubspotutk ? { hutk: args.hubspotutk } : {}),
      ...(args.ipAddress ? { ipAddress: args.ipAddress } : {}),
      pageUri: args.pageUri,
      pageName: args.pageName,
    },
  });
  if (!result.ok) {
    console.error("[hubspot-courses] form submission failed", {
      status: result.status,
      error: result.error,
      course: args.courseName,
    });
  }
}
