import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { redis, KEY } from "@/lib/redis";
import { submitCourseSignup } from "@/lib/hubspot-courses-form";

/**
 * POST /api/courses/signup
 *
 * Lead capture for /courses/* signups. Two side effects:
 *
 *   1. Redis write to dunamis:courses:signup:{courseSlug}:{hash} as
 *      source of truth. Failure here returns 500.
 *   2. HubSpot Forms mirror via the Email Courses signup form, with
 *      course_name = the course's display name. Best-effort. The
 *      HubSpot workflow attached to that form is what actually sends
 *      the drip emails; this route does not call Resend.
 *
 * The site allow-lists course slugs server-side so a visitor can't
 * spray arbitrary signups at the form. Every supported course is added
 * here when its landing page ships.
 */

const PUBLIC_PAGE_BASE = "https://www.dunamisstudios.net";

interface CourseDef {
  slug: string;
  name: string;
  pageName: string;
  pageUri: string;
}

const COURSES: Record<string, CourseDef> = {
  "hubspot-audit": {
    slug: "hubspot-audit",
    name: "5-Day HubSpot Audit",
    pageName: "5-Day HubSpot Audit signup",
    pageUri: `${PUBLIC_PAGE_BASE}/courses/hubspot-audit`,
  },
};

const BodySchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email().max(254),
  courseSlug: z.string().min(1).max(80),
  hubspotutk: z.string().max(200).optional(),
});

interface CourseSignupRecord {
  email: string;
  firstName: string;
  lastName: string;
  courseSlug: string;
  courseName: string;
  signedUpAt: string;
  ip: string;
  userAgent: string;
}

function hashEmail(email: string): string {
  return createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex")
    .slice(0, 32);
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your inputs and try again." },
      { status: 400 },
    );
  }

  const { firstName, lastName, email, courseSlug, hubspotutk } = parsed.data;
  const course = COURSES[courseSlug];
  if (!course) {
    return NextResponse.json(
      { error: "Unknown course." },
      { status: 400 },
    );
  }

  const cleanEmail = email.trim();
  const cleanFirstName = firstName.trim();
  const cleanLastName = lastName.trim();
  const ipAddress = clientIp(req);

  if (!cleanFirstName || !cleanLastName) {
    return NextResponse.json(
      { error: "Please check your inputs and try again." },
      { status: 400 },
    );
  }

  const record: CourseSignupRecord = {
    email: cleanEmail,
    firstName: cleanFirstName,
    lastName: cleanLastName,
    courseSlug: course.slug,
    courseName: course.name,
    signedUpAt: new Date().toISOString(),
    ip: ipAddress,
    userAgent: req.headers.get("user-agent") ?? "unknown",
  };

  try {
    const r = redis();
    const key = KEY.courseSignup(course.slug, hashEmail(cleanEmail));
    await r.set(key, record);
  } catch (err) {
    console.error("[courses/signup] redis write failed", err);
    return NextResponse.json(
      { error: "Could not record signup. Please try again." },
      { status: 500 },
    );
  }

  await submitCourseSignup({
    email: cleanEmail,
    firstName: cleanFirstName,
    lastName: cleanLastName,
    courseName: course.name,
    hubspotutk,
    ipAddress: ipAddress !== "unknown" ? ipAddress : undefined,
    pageUri: course.pageUri,
    pageName: course.pageName,
  });

  return NextResponse.json({ ok: true });
}
