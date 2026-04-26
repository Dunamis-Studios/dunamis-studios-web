"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError, FieldHint } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  BUDGET_OPTIONS,
  TIMELINE_OPTIONS,
  contactSubmitSchema,
  type ContactSubmitInput,
} from "@/lib/validation";

type FieldName = keyof ContactSubmitInput;
type FieldErrors = Partial<Record<FieldName, string>>;

const INITIAL_VALUES: ContactSubmitInput = {
  firstname: "",
  lastname: "",
  email: "",
  company: "",
  what_are_you_trying_to_solve: "",
  // The empty-string state for selects is intentional: the schema requires
  // one of the enum values, so the empty placeholder option fails validation
  // until the user picks a real choice.
  custom_dev_budget_range: "" as ContactSubmitInput["custom_dev_budget_range"],
  custom_dev_timeline: "" as ContactSubmitInput["custom_dev_timeline"],
};

// Shared chrome for native <select> and <textarea> so they line up with the
// existing <Input> primitive without forking that component.
const FIELD_CHROME =
  "w-full rounded-md border bg-[var(--bg-elevated)] px-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] transition-colors outline-none " +
  "border-[var(--border)] hover:border-[var(--border-strong)] " +
  "focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "aria-[invalid=true]:border-[var(--color-danger)] aria-[invalid=true]:focus:ring-[var(--color-danger)]/20";

export function CustomDevelopmentContactForm() {
  const [values, setValues] = React.useState<ContactSubmitInput>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  function setValue<K extends FieldName>(name: K, value: ContactSubmitInput[K]) {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear a field's error as soon as the user edits it; re-validation
    // happens on blur or submit.
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function validateField(name: FieldName) {
    const single = contactSubmitSchema.shape[name].safeParse(values[name]);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (single.success) {
        delete next[name];
      } else {
        next[name] = single.error.issues[0]?.message ?? "Invalid";
      }
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const parsed = contactSubmitSchema.safeParse(values);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName | undefined;
        if (key && !next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact-submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.error?.fields) {
          setFieldErrors(data.error.fields as FieldErrors);
        }
        setFormError(
          data?.error?.message ??
            "Submission failed. Please try again or email josh@dunamisstudios.net.",
        );
        return;
      }
      setSuccess(true);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <>
        <h2 className="font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
          Thanks, message received.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[var(--fg-muted)]">
          We&apos;ll respond within two business days with whether it&apos;s
          something we can help with and a rough sense of scope.
        </p>
      </>
    );
  }

  return (
    <>
      <h2 className="font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
        Let&apos;s Talk
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-[var(--fg-muted)]">
        Tell us what you&apos;re working on. We&apos;ll respond within two
        business days with whether it&apos;s something we can help with and a
        rough sense of scope.
      </p>

      <form
        onSubmit={onSubmit}
        noValidate
        className="mx-auto mt-10 max-w-xl space-y-5 text-left"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="cd-firstname">
              First Name
              <span aria-hidden className="ml-0.5 text-[var(--color-danger)]">*</span>
            </Label>
            <Input
              id="cd-firstname"
              name="firstname"
              autoComplete="given-name"
              required
              disabled={submitting}
              className="mt-1.5"
              value={values.firstname}
              onChange={(e) => setValue("firstname", e.target.value)}
              onBlur={() => validateField("firstname")}
              error={fieldErrors.firstname}
            />
            <FieldError>{fieldErrors.firstname}</FieldError>
          </div>
          <div>
            <Label htmlFor="cd-lastname">
              Last Name
              <span aria-hidden className="ml-0.5 text-[var(--color-danger)]">*</span>
            </Label>
            <Input
              id="cd-lastname"
              name="lastname"
              autoComplete="family-name"
              required
              disabled={submitting}
              className="mt-1.5"
              value={values.lastname}
              onChange={(e) => setValue("lastname", e.target.value)}
              onBlur={() => validateField("lastname")}
              error={fieldErrors.lastname}
            />
            <FieldError>{fieldErrors.lastname}</FieldError>
          </div>
        </div>

        <div>
          <Label htmlFor="cd-email">
            Email
            <span aria-hidden className="ml-0.5 text-[var(--color-danger)]">*</span>
          </Label>
          <Input
            id="cd-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={submitting}
            className="mt-1.5"
            value={values.email}
            onChange={(e) => setValue("email", e.target.value)}
            onBlur={() => validateField("email")}
            error={fieldErrors.email}
          />
          <FieldError>{fieldErrors.email}</FieldError>
        </div>

        <div>
          <Label htmlFor="cd-company">
            Company name
            <span aria-hidden className="ml-0.5 text-[var(--color-danger)]">*</span>
          </Label>
          <Input
            id="cd-company"
            name="company"
            autoComplete="organization"
            required
            disabled={submitting}
            className="mt-1.5"
            value={values.company}
            onChange={(e) => setValue("company", e.target.value)}
            onBlur={() => validateField("company")}
            error={fieldErrors.company}
          />
          <FieldError>{fieldErrors.company}</FieldError>
        </div>

        <div>
          <Label htmlFor="cd-solve">
            What are you trying to solve?
            <span aria-hidden className="ml-0.5 text-[var(--color-danger)]">*</span>
          </Label>
          <FieldHint>
            A few sentences is enough, we&apos;ll follow up with questions.
          </FieldHint>
          <textarea
            id="cd-solve"
            name="what_are_you_trying_to_solve"
            required
            disabled={submitting}
            rows={5}
            value={values.what_are_you_trying_to_solve}
            onChange={(e) => setValue("what_are_you_trying_to_solve", e.target.value)}
            onBlur={() => validateField("what_are_you_trying_to_solve")}
            aria-invalid={fieldErrors.what_are_you_trying_to_solve ? true : undefined}
            className={cn(FIELD_CHROME, "mt-1.5 min-h-28 py-2.5 leading-relaxed resize-y")}
          />
          <FieldError>{fieldErrors.what_are_you_trying_to_solve}</FieldError>
        </div>

        <div>
          <Label htmlFor="cd-budget">
            What&apos;s your budget range?
            <span aria-hidden className="ml-0.5 text-[var(--color-danger)]">*</span>
          </Label>
          <FieldHint>
            A rough range is fine. We&apos;ll quote a real number after scoping
            the work together.
          </FieldHint>
          <SelectField
            id="cd-budget"
            name="custom_dev_budget_range"
            disabled={submitting}
            value={values.custom_dev_budget_range}
            onChange={(v) =>
              setValue(
                "custom_dev_budget_range",
                v as ContactSubmitInput["custom_dev_budget_range"],
              )
            }
            onBlur={() => validateField("custom_dev_budget_range")}
            invalid={!!fieldErrors.custom_dev_budget_range}
            options={BUDGET_OPTIONS}
            placeholder="Select a range"
          />
          <FieldError>{fieldErrors.custom_dev_budget_range}</FieldError>
        </div>

        <div>
          <Label htmlFor="cd-timeline">
            When do you need this?
            <span aria-hidden className="ml-0.5 text-[var(--color-danger)]">*</span>
          </Label>
          <SelectField
            id="cd-timeline"
            name="custom_dev_timeline"
            disabled={submitting}
            value={values.custom_dev_timeline}
            onChange={(v) =>
              setValue(
                "custom_dev_timeline",
                v as ContactSubmitInput["custom_dev_timeline"],
              )
            }
            onBlur={() => validateField("custom_dev_timeline")}
            invalid={!!fieldErrors.custom_dev_timeline}
            options={TIMELINE_OPTIONS}
            placeholder="Select a timeline"
          />
          <FieldError>{fieldErrors.custom_dev_timeline}</FieldError>
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
            Send inquiry
          </Button>
        </div>
      </form>
    </>
  );
}

function SelectField({
  id,
  name,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  disabled,
  invalid,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
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
        required
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
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
