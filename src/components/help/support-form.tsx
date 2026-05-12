"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError, FieldHint } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  SUPPORT_AFFECTED_COMPONENTS,
  SUPPORT_CATEGORIES,
  SUPPORT_CONSENT_TEXT,
  SUPPORT_DATA_REQUEST_TYPES,
  SUPPORT_LICENSE_OR_DEVICE_TRANSFER_ACTIONS,
  SUPPORT_OPERATING_SYSTEMS,
  SUPPORT_PUBLIC_DISCLOSURE_STATUSES,
  SUPPORT_REFUND_REASONS,
  SUPPORT_SEVERITIES,
  supportTicketSchema,
  type SupportCategory,
  type SupportTicketInput,
} from "@/lib/validation";

/**
 * Customer support ticket form. POSTs to /api/support-submit which
 * forwards to a HubSpot form wired into the Help Desk pipeline. The
 * React state machine owns:
 *
 *   1. Which conditional fields are visible for the currently
 *      selected category (driven by CATEGORY_CONFIG).
 *   2. Which of those fields are required when shown.
 *   3. Required-when validation on submit. The Zod schema treats
 *      every conditional field as optional so a misclick cannot 500;
 *      this UI enforces the actual required-when rules before the
 *      POST goes out.
 *
 * Switching category preserves typed values (an accidental dropdown
 * change does not lose state). The submit payload only carries
 * fields that the current category renders.
 *
 * File attachments are NOT in this first cut; the mechanism is
 * pending the HubSpot file-upload investigation (Part 4 of the
 * support-form slice).
 */

const FIELD_CHROME =
  "w-full rounded-md border bg-[var(--bg-elevated)] px-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] transition-colors outline-none " +
  "border-[var(--border)] hover:border-[var(--border-strong)] " +
  "focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "aria-[invalid=true]:border-[var(--color-danger)] aria-[invalid=true]:focus:ring-[var(--color-danger)]/20";

type ConditionalFieldName =
  | "order_email"
  | "license_key"
  | "order_or_transaction_id"
  | "refund_reason"
  | "atelier_version"
  | "operating_system"
  | "os_version_or_build"
  | "steps_to_reproduce"
  | "issue_first_occurred"
  | "license_or_device_transfer_action"
  | "data_request_type"
  | "affected_component"
  | "suggested_severity"
  | "public_disclosure_status";

interface CategoryConfig {
  requiredFields: readonly ConditionalFieldName[];
  optionalFields: readonly ConditionalFieldName[];
}

const CATEGORY_CONFIG: Record<SupportCategory, CategoryConfig> = {
  "Refund Request": {
    requiredFields: ["order_email", "refund_reason"],
    optionalFields: ["license_key", "order_or_transaction_id"],
  },
  "Bug Report": {
    requiredFields: ["atelier_version", "operating_system"],
    optionalFields: [
      "license_key",
      "os_version_or_build",
      "steps_to_reproduce",
      "issue_first_occurred",
    ],
  },
  "Atelier Won't Start or Won't Open": {
    requiredFields: ["atelier_version", "operating_system"],
    optionalFields: [
      "license_key",
      "os_version_or_build",
      "issue_first_occurred",
    ],
  },
  "Corrupted Data or Lost Data": {
    requiredFields: ["atelier_version", "operating_system"],
    optionalFields: [
      "license_key",
      "os_version_or_build",
      "issue_first_occurred",
    ],
  },
  "License or Device Transfer": {
    requiredFields: ["order_email", "license_or_device_transfer_action"],
    optionalFields: ["license_key", "order_or_transaction_id"],
  },
  "Privacy or Data Request": {
    requiredFields: ["order_email", "data_request_type"],
    optionalFields: [],
  },
  "Security Vulnerability Report": {
    requiredFields: [
      "affected_component",
      "suggested_severity",
      "public_disclosure_status",
    ],
    optionalFields: ["steps_to_reproduce"],
  },
  "General Question": {
    requiredFields: [],
    optionalFields: [],
  },
};

interface FormState {
  firstname: string;
  lastname: string;
  email: string;
  subject: string;
  category: SupportCategory | "";
  what_happened: string;
  consent: boolean;
  order_email: string;
  license_key: string;
  order_or_transaction_id: string;
  refund_reason: string;
  atelier_version: string;
  operating_system: string;
  os_version_or_build: string;
  steps_to_reproduce: string;
  issue_first_occurred: string;
  license_or_device_transfer_action: string;
  data_request_type: string;
  affected_component: string;
  suggested_severity: string;
  public_disclosure_status: string;
}

const INITIAL_STATE: FormState = {
  firstname: "",
  lastname: "",
  email: "",
  subject: "",
  category: "",
  what_happened: "",
  consent: false,
  order_email: "",
  license_key: "",
  order_or_transaction_id: "",
  refund_reason: "",
  atelier_version: "",
  operating_system: "",
  os_version_or_build: "",
  steps_to_reproduce: "",
  issue_first_occurred: "",
  license_or_device_transfer_action: "",
  data_request_type: "",
  affected_component: "",
  suggested_severity: "",
  public_disclosure_status: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function isFieldVisible(
  category: SupportCategory | "",
  field: ConditionalFieldName,
): boolean {
  if (category === "") return false;
  const config = CATEGORY_CONFIG[category];
  return (
    config.requiredFields.includes(field) ||
    config.optionalFields.includes(field)
  );
}

function isFieldRequired(
  category: SupportCategory | "",
  field: ConditionalFieldName,
): boolean {
  if (category === "") return false;
  return CATEGORY_CONFIG[category].requiredFields.includes(field);
}

function buildSubmitPayload(
  state: FormState,
): SupportTicketInput | { _missingCategory: true } {
  if (state.category === "") return { _missingCategory: true };
  const base = {
    firstname: state.firstname,
    lastname: state.lastname,
    email: state.email,
    subject: state.subject,
    category: state.category,
    what_happened: state.what_happened,
    consent: state.consent,
  } as const;
  const config = CATEGORY_CONFIG[state.category];
  const visible: ConditionalFieldName[] = [
    ...config.requiredFields,
    ...config.optionalFields,
  ];
  const conditional: Record<string, string> = {};
  for (const field of visible) {
    const value = state[field];
    if (typeof value === "string" && value.trim().length > 0) {
      conditional[field] = value;
    }
  }
  return { ...base, ...conditional } as SupportTicketInput;
}

export function SupportForm() {
  const [state, setState] = React.useState<FormState>(INITIAL_STATE);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  function setField<K extends keyof FormState>(name: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function validateAll(): { ok: boolean; errors: FieldErrors } {
    const errors: FieldErrors = {};

    if (!state.firstname.trim()) errors.firstname = "First name is required";
    if (!state.lastname.trim()) errors.lastname = "Last name is required";
    if (!state.email.trim()) errors.email = "Email is required";
    if (!state.subject.trim()) errors.subject = "Subject is required";
    if (state.category === "") errors.category = "Choose a category";
    if (!state.what_happened.trim())
      errors.what_happened = "Tell us what happened";
    if (!state.consent)
      errors.consent =
        "We need your consent before we can submit your message";

    if (state.category !== "") {
      const config = CATEGORY_CONFIG[state.category];
      for (const field of config.requiredFields) {
        const value = state[field];
        if (typeof value === "string" && value.trim().length === 0) {
          errors[field] = "Required for this category";
        }
      }
    }

    return { ok: Object.keys(errors).length === 0, errors };
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const local = validateAll();
    if (!local.ok) {
      setFieldErrors(local.errors);
      return;
    }

    const payload = buildSubmitPayload(state);
    if ("_missingCategory" in payload) {
      setFieldErrors({ category: "Choose a category" });
      return;
    }

    const schemaCheck = supportTicketSchema.safeParse(payload);
    if (!schemaCheck.success) {
      const next: FieldErrors = {};
      for (const issue of schemaCheck.error.issues) {
        const key = issue.path[0] as keyof FormState | undefined;
        if (key && !next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/support-submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(schemaCheck.data),
      });
      // Deliberate fallback to null when the response body isn't JSON
      // (e.g. an Edge / proxy returned HTML for a 502). The branches
      // below handle the null case explicitly.
      const data = (await res.json().catch(() => null)) as { // claude-code:allow-swallowed-error
        error?: { fields?: FieldErrors; message?: string };
      } | null;
      if (!res.ok) {
        if (data?.error?.fields) setFieldErrors(data.error.fields);
        setFormError(
          data?.error?.message ??
            "Submission failed. Please try again, or email support@dunamisstudios.net directly.",
        );
        return;
      }
      setSuccess(true);
    } catch {
      setFormError(
        "Network error. Please try again, or email support@dunamisstudios.net directly.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-[var(--font-display)] text-2xl font-medium tracking-tight">
          Thanks, we got it.
        </h2>
        <p className="mt-3 text-[var(--fg-muted)]">
          A ticket has been opened for your request. We typically respond
          within 1 business day. Watch for an email from{" "}
          <span className="font-mono">support@dunamisstudios.net</span>; if
          it does not arrive, check your spam folder.
        </p>
      </div>
    );
  }

  const category = state.category;
  const showOrderEmail = isFieldVisible(category, "order_email");
  const showLicenseKey = isFieldVisible(category, "license_key");
  const showOrderId = isFieldVisible(category, "order_or_transaction_id");
  const showRefundReason = isFieldVisible(category, "refund_reason");
  const showAtelierVersion = isFieldVisible(category, "atelier_version");
  const showOperatingSystem = isFieldVisible(category, "operating_system");
  const showOsVersionOrBuild = isFieldVisible(category, "os_version_or_build");
  const showStepsToReproduce = isFieldVisible(category, "steps_to_reproduce");
  const showIssueFirstOccurred = isFieldVisible(
    category,
    "issue_first_occurred",
  );
  const showTransferAction = isFieldVisible(
    category,
    "license_or_device_transfer_action",
  );
  const showDataRequestType = isFieldVisible(category, "data_request_type");
  const showAffectedComponent = isFieldVisible(category, "affected_component");
  const showSeverity = isFieldVisible(category, "suggested_severity");
  const showDisclosure = isFieldVisible(category, "public_disclosure_status");

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 text-left">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="sf-firstname">
            First Name <Required />
          </Label>
          <Input
            id="sf-firstname"
            name="firstname"
            autoComplete="given-name"
            disabled={submitting}
            className="mt-1.5"
            value={state.firstname}
            onChange={(e) => setField("firstname", e.target.value)}
            error={fieldErrors.firstname}
          />
          <FieldError>{fieldErrors.firstname}</FieldError>
        </div>
        <div>
          <Label htmlFor="sf-lastname">
            Last Name <Required />
          </Label>
          <Input
            id="sf-lastname"
            name="lastname"
            autoComplete="family-name"
            disabled={submitting}
            className="mt-1.5"
            value={state.lastname}
            onChange={(e) => setField("lastname", e.target.value)}
            error={fieldErrors.lastname}
          />
          <FieldError>{fieldErrors.lastname}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="sf-email">
          Email <Required />
        </Label>
        <Input
          id="sf-email"
          name="email"
          type="email"
          autoComplete="email"
          disabled={submitting}
          className="mt-1.5"
          value={state.email}
          onChange={(e) => setField("email", e.target.value)}
          error={fieldErrors.email}
        />
        <FieldError>{fieldErrors.email}</FieldError>
      </div>

      <div>
        <Label htmlFor="sf-subject">
          Subject <Required />
        </Label>
        <FieldHint>One short line summarizing what you need help with.</FieldHint>
        <Input
          id="sf-subject"
          name="subject"
          maxLength={255}
          disabled={submitting}
          className="mt-1.5"
          value={state.subject}
          onChange={(e) => setField("subject", e.target.value)}
          error={fieldErrors.subject}
        />
        <FieldError>{fieldErrors.subject}</FieldError>
      </div>

      <div>
        <Label htmlFor="sf-category">
          Category <Required />
        </Label>
        <FieldHint>
          Pick the closest match. The form will show the right follow-up
          questions for your category.
        </FieldHint>
        <SelectField
          id="sf-category"
          name="category"
          disabled={submitting}
          value={state.category}
          onChange={(v) => setField("category", v as SupportCategory)}
          invalid={!!fieldErrors.category}
          options={SUPPORT_CATEGORIES}
          placeholder="Select a category"
        />
        <FieldError>{fieldErrors.category}</FieldError>
      </div>

      <div>
        <Label htmlFor="sf-what-happened">
          What happened? <Required />
        </Label>
        <FieldHint>
          What you tried, what you expected, what you got. The more
          context the better. If you have screenshots or other files
          that would help, mention that here and reply to the ticket
          email after you receive our response, with the attachments.
        </FieldHint>
        <textarea
          id="sf-what-happened"
          name="what_happened"
          disabled={submitting}
          rows={5}
          value={state.what_happened}
          onChange={(e) => setField("what_happened", e.target.value)}
          aria-invalid={fieldErrors.what_happened ? true : undefined}
          className={cn(
            FIELD_CHROME,
            "mt-1.5 min-h-28 py-2.5 leading-relaxed resize-y",
          )}
        />
        <FieldError>{fieldErrors.what_happened}</FieldError>
      </div>

      {showOrderEmail ? (
        <div>
          <Label htmlFor="sf-order-email">
            Order Email{" "}
            {isFieldRequired(category, "order_email") ? <Required /> : null}
          </Label>
          <FieldHint>
            The email address you used at checkout, if different from
            the one above.
          </FieldHint>
          <Input
            id="sf-order-email"
            name="order_email"
            type="email"
            disabled={submitting}
            className="mt-1.5"
            value={state.order_email}
            onChange={(e) => setField("order_email", e.target.value)}
            error={fieldErrors.order_email}
          />
          <FieldError>{fieldErrors.order_email}</FieldError>
        </div>
      ) : null}

      {showLicenseKey ? (
        <div>
          <Label htmlFor="sf-license-key">
            License Key{" "}
            {isFieldRequired(category, "license_key") ? <Required /> : null}
          </Label>
          <FieldHint>
            Paste your full Atelier license key if you have it handy.
            Looks like a long string starting with atl_lic_.
          </FieldHint>
          <Input
            id="sf-license-key"
            name="license_key"
            disabled={submitting}
            className="mt-1.5"
            value={state.license_key}
            onChange={(e) => setField("license_key", e.target.value)}
            error={fieldErrors.license_key}
          />
          <FieldError>{fieldErrors.license_key}</FieldError>
        </div>
      ) : null}

      {showOrderId ? (
        <div>
          <Label htmlFor="sf-order-id">
            Order or Transaction ID{" "}
            {isFieldRequired(category, "order_or_transaction_id") ? (
              <Required />
            ) : null}
          </Label>
          <FieldHint>
            From your purchase receipt. Speeds up the lookup if you
            have it.
          </FieldHint>
          <Input
            id="sf-order-id"
            name="order_or_transaction_id"
            disabled={submitting}
            className="mt-1.5"
            value={state.order_or_transaction_id}
            onChange={(e) =>
              setField("order_or_transaction_id", e.target.value)
            }
            error={fieldErrors.order_or_transaction_id}
          />
          <FieldError>{fieldErrors.order_or_transaction_id}</FieldError>
        </div>
      ) : null}

      {showRefundReason ? (
        <div>
          <Label htmlFor="sf-refund-reason">
            Refund Reason{" "}
            {isFieldRequired(category, "refund_reason") ? <Required /> : null}
          </Label>
          <SelectField
            id="sf-refund-reason"
            name="refund_reason"
            disabled={submitting}
            value={state.refund_reason}
            onChange={(v) => setField("refund_reason", v)}
            invalid={!!fieldErrors.refund_reason}
            options={SUPPORT_REFUND_REASONS}
            placeholder="Select a reason"
          />
          <FieldError>{fieldErrors.refund_reason}</FieldError>
        </div>
      ) : null}

      {showAtelierVersion ? (
        <div>
          <Label htmlFor="sf-atelier-version">
            Atelier Version{" "}
            {isFieldRequired(category, "atelier_version") ? (
              <Required />
            ) : null}
          </Label>
          <FieldHint>
            Find this in Atelier under Help &gt; About. Looks like 1.2.3.
          </FieldHint>
          <Input
            id="sf-atelier-version"
            name="atelier_version"
            disabled={submitting}
            className="mt-1.5"
            value={state.atelier_version}
            onChange={(e) => setField("atelier_version", e.target.value)}
            error={fieldErrors.atelier_version}
          />
          <FieldError>{fieldErrors.atelier_version}</FieldError>
        </div>
      ) : null}

      {showOperatingSystem ? (
        <div>
          <Label htmlFor="sf-operating-system">
            Operating System{" "}
            {isFieldRequired(category, "operating_system") ? (
              <Required />
            ) : null}
          </Label>
          <SelectField
            id="sf-operating-system"
            name="operating_system"
            disabled={submitting}
            value={state.operating_system}
            onChange={(v) => setField("operating_system", v)}
            invalid={!!fieldErrors.operating_system}
            options={SUPPORT_OPERATING_SYSTEMS}
            placeholder="Select your OS"
          />
          <FieldError>{fieldErrors.operating_system}</FieldError>
        </div>
      ) : null}

      {showOsVersionOrBuild ? (
        <div>
          <Label htmlFor="sf-os-version">
            OS Version or Build{" "}
            {isFieldRequired(category, "os_version_or_build") ? (
              <Required />
            ) : null}
          </Label>
          <FieldHint>
            Example: Windows 11 Pro 23H2 (build 22631.3155), macOS
            Sonoma 14.4, Ubuntu 22.04 LTS.
          </FieldHint>
          <Input
            id="sf-os-version"
            name="os_version_or_build"
            disabled={submitting}
            className="mt-1.5"
            value={state.os_version_or_build}
            onChange={(e) => setField("os_version_or_build", e.target.value)}
            error={fieldErrors.os_version_or_build}
          />
          <FieldError>{fieldErrors.os_version_or_build}</FieldError>
        </div>
      ) : null}

      {showStepsToReproduce ? (
        <div>
          <Label htmlFor="sf-steps">
            Steps to Reproduce{" "}
            {isFieldRequired(category, "steps_to_reproduce") ? (
              <Required />
            ) : null}
          </Label>
          <FieldHint>
            Numbered list works great. 1) Open... 2) Click... 3) Expected
            X, got Y.
          </FieldHint>
          <textarea
            id="sf-steps"
            name="steps_to_reproduce"
            disabled={submitting}
            rows={4}
            value={state.steps_to_reproduce}
            onChange={(e) => setField("steps_to_reproduce", e.target.value)}
            aria-invalid={fieldErrors.steps_to_reproduce ? true : undefined}
            className={cn(
              FIELD_CHROME,
              "mt-1.5 min-h-24 py-2.5 leading-relaxed resize-y",
            )}
          />
          <FieldError>{fieldErrors.steps_to_reproduce}</FieldError>
        </div>
      ) : null}

      {showIssueFirstOccurred ? (
        <div>
          <Label htmlFor="sf-issue-date">
            Issue First Occurred{" "}
            {isFieldRequired(category, "issue_first_occurred") ? (
              <Required />
            ) : null}
          </Label>
          <FieldHint>
            Approximate date is fine. Helps us correlate against a
            recent release.
          </FieldHint>
          <input
            id="sf-issue-date"
            name="issue_first_occurred"
            type="date"
            disabled={submitting}
            value={state.issue_first_occurred}
            onChange={(e) =>
              setField("issue_first_occurred", e.target.value)
            }
            aria-invalid={
              fieldErrors.issue_first_occurred ? true : undefined
            }
            className={cn(FIELD_CHROME, "mt-1.5 h-10")}
          />
          <FieldError>{fieldErrors.issue_first_occurred}</FieldError>
        </div>
      ) : null}

      {showTransferAction ? (
        <div>
          <Label htmlFor="sf-transfer-action">
            What do you need to do?{" "}
            {isFieldRequired(category, "license_or_device_transfer_action") ? (
              <Required />
            ) : null}
          </Label>
          <SelectField
            id="sf-transfer-action"
            name="license_or_device_transfer_action"
            disabled={submitting}
            value={state.license_or_device_transfer_action}
            onChange={(v) =>
              setField("license_or_device_transfer_action", v)
            }
            invalid={!!fieldErrors.license_or_device_transfer_action}
            options={SUPPORT_LICENSE_OR_DEVICE_TRANSFER_ACTIONS}
            placeholder="Select an action"
          />
          <FieldError>
            {fieldErrors.license_or_device_transfer_action}
          </FieldError>
        </div>
      ) : null}

      {showDataRequestType ? (
        <div>
          <Label htmlFor="sf-data-request">
            What kind of data request?{" "}
            {isFieldRequired(category, "data_request_type") ? (
              <Required />
            ) : null}
          </Label>
          <SelectField
            id="sf-data-request"
            name="data_request_type"
            disabled={submitting}
            value={state.data_request_type}
            onChange={(v) => setField("data_request_type", v)}
            invalid={!!fieldErrors.data_request_type}
            options={SUPPORT_DATA_REQUEST_TYPES}
            placeholder="Select a request type"
          />
          <FieldError>{fieldErrors.data_request_type}</FieldError>
        </div>
      ) : null}

      {showAffectedComponent ? (
        <div>
          <Label htmlFor="sf-affected-component">
            Affected Component{" "}
            {isFieldRequired(category, "affected_component") ? (
              <Required />
            ) : null}
          </Label>
          <SelectField
            id="sf-affected-component"
            name="affected_component"
            disabled={submitting}
            value={state.affected_component}
            onChange={(v) => setField("affected_component", v)}
            invalid={!!fieldErrors.affected_component}
            options={SUPPORT_AFFECTED_COMPONENTS}
            placeholder="Select the affected component"
          />
          <FieldError>{fieldErrors.affected_component}</FieldError>
        </div>
      ) : null}

      {showSeverity ? (
        <div>
          <Label htmlFor="sf-severity">
            Suggested Severity{" "}
            {isFieldRequired(category, "suggested_severity") ? (
              <Required />
            ) : null}
          </Label>
          <FieldHint>
            Your honest assessment. We will reclassify on our side if
            we disagree; this just gives us a starting point.
          </FieldHint>
          <SelectField
            id="sf-severity"
            name="suggested_severity"
            disabled={submitting}
            value={state.suggested_severity}
            onChange={(v) => setField("suggested_severity", v)}
            invalid={!!fieldErrors.suggested_severity}
            options={SUPPORT_SEVERITIES}
            placeholder="Select a severity"
          />
          <FieldError>{fieldErrors.suggested_severity}</FieldError>
        </div>
      ) : null}

      {showDisclosure ? (
        <div>
          <Label htmlFor="sf-disclosure">
            Public Disclosure Status{" "}
            {isFieldRequired(category, "public_disclosure_status") ? (
              <Required />
            ) : null}
          </Label>
          <FieldHint>
            Where does this finding stand publicly? Affects our
            timeline for coordinating a fix and any acknowledgment.
          </FieldHint>
          <SelectField
            id="sf-disclosure"
            name="public_disclosure_status"
            disabled={submitting}
            value={state.public_disclosure_status}
            onChange={(v) => setField("public_disclosure_status", v)}
            invalid={!!fieldErrors.public_disclosure_status}
            options={SUPPORT_PUBLIC_DISCLOSURE_STATUSES}
            placeholder="Select a status"
          />
          <FieldError>{fieldErrors.public_disclosure_status}</FieldError>
        </div>
      ) : null}

      <div>
        <label className="flex items-start gap-3 text-sm text-[var(--fg)]">
          <input
            type="checkbox"
            name="consent"
            checked={state.consent}
            disabled={submitting}
            onChange={(e) => setField("consent", e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--ring)]"
            aria-invalid={fieldErrors.consent ? true : undefined}
          />
          <span>
            I agree to Dunamis Studios processing the information in
            this message to respond to my request. I have read the{" "}
            <Link
              href="/privacy"
              className="text-[var(--accent)] underline-offset-2 hover:underline"
            >
              Privacy Policy
            </Link>{" "}
            and understand how my data will be used.
          </span>
        </label>
        <FieldError>{fieldErrors.consent}</FieldError>
      </div>

      {formError ? (
        <div
          role="alert"
          className="rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]"
        >
          {formError}
        </div>
      ) : null}

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" loading={submitting}>
          Submit ticket
        </Button>
      </div>
    </form>
  );
}

function Required() {
  return (
    <span aria-hidden className="ml-0.5 text-[var(--color-danger)]">
      *
    </span>
  );
}

function SelectField({
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  invalid,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <div className="relative mt-1.5">
      <select
        id={id}
        name={name}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid ? true : undefined}
        className={cn(
          FIELD_CHROME,
          "h-10 appearance-none pr-10",
          value === "" && "text-[var(--fg-subtle)]",
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt} className="text-[var(--fg)]">
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-subtle)]"
      />
    </div>
  );
}
