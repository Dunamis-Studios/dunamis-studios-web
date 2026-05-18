/**
 * Server-side session layer for the customer account portal and the
 * Atelier desktop bearer-token client.
 *
 * Two ingress shapes share the same JWT + secret:
 *   - The browser presents the JWT via the HttpOnly `__Host-session`
 *     cookie (production) or `dunamis_session` (development).
 *   - The Atelier desktop client and any future native client present
 *     the same JWT in an `Authorization: Bearer <jwt>` header.
 *
 * Either ingress walks the same flow: verify JWT signature + issuer +
 * audience + expiry, look up the canonical session record at
 * `dunamis:session:{sid}`, refresh its TTL clamped to the wall-clock
 * remaining until expiresAt, return `{ account, session }`. Any failure
 * returns null so route handlers can map to their own 401.
 *
 * The admin gate at the bottom is an env-var ACL (ADMIN_EMAILS), not a
 * role field on Account. requireAdmin() throws a Response, which only
 * works inside Server Components / layouts that auto-catch; route
 * handlers must call getCurrentAdminSession() and return their own 403.
 */
import { cookies } from "next/headers";
import { redis, KEY } from "./redis";
import type { Account, Session } from "./types";
import { signSessionJwt, uuid, verifySessionJwt } from "./tokens";
import { getAccountById } from "./accounts";

/**
 * User-controlled session lifetimes. The account's
 * `sessionLifetimeDays` field picks one of these; an unset field falls
 * back to DEFAULT_SESSION_LIFETIME_DAYS.
 */
export const ALLOWED_SESSION_LIFETIME_DAYS = [1, 3, 7] as const;
export type SessionLifetimeDays =
  (typeof ALLOWED_SESSION_LIFETIME_DAYS)[number];
export const DEFAULT_SESSION_LIFETIME_DAYS: SessionLifetimeDays = 7;

const SECONDS_PER_DAY = 60 * 60 * 24;

function lifetimeSecFor(account: Account): number {
  const days =
    account.sessionLifetimeDays ?? DEFAULT_SESSION_LIFETIME_DAYS;
  return days * SECONDS_PER_DAY;
}

/**
 * Cookie name: `__Host-` prefix requires Secure + Path=/ + no Domain,
 * which gives us the strictest same-origin guarantee.
 */
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-session" : "dunamis_session";

export async function createSession(
  accountId: string,
  meta: { userAgent: string; ip: string },
): Promise<{ sessionId: string; jwt: string; lifetimeSec: number }> {
  const account = await getAccountById(accountId);
  if (!account) {
    // Every call path that reaches here has just read or written the
    // account in the same request (login/signup/password-reset).
    // Missing account at this point is a real invariant violation, not
    // an expected branch.
    throw new Error(
      `createSession: account ${accountId} not found`,
    );
  }
  const lifetimeSec = lifetimeSecFor(account);
  const sessionId = uuid();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + lifetimeSec * 1000);

  const session: Session = {
    sessionId,
    accountId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    userAgent: meta.userAgent.slice(0, 300),
    ip: meta.ip.slice(0, 45),
  };

  const r = redis();
  await r.set(KEY.session(sessionId), session, { ex: lifetimeSec });
  await r.sadd(KEY.accountSessions(accountId), sessionId);

  // Sign the JWT with the same lifetime we just wrote to the Redis
  // session record. Previously the JWT always carried exp=30d regardless
  // of the user's sessionLifetimeDays preference, so a shorter-TTL
  // account's stolen JWT remained verifiable long after the server-side
  // session had been destroyed.
  const jwt = await signSessionJwt(sessionId, lifetimeSec);
  return { sessionId, jwt, lifetimeSec };
}

export async function setSessionCookie(
  jwt: string,
  maxAgeSec: number,
): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Read session from the incoming cookie, refresh Redis TTL on hit (to
 * stay aligned with the session's hard expiresAt), and return the
 * account + session record. Returns null for any invalid/expired
 * state.
 *
 * Rolling Redis TTL is clamped to the remaining time until expiresAt,
 * so a preference change never extends or shortens an existing
 * session past its original lifetime. The user's new preference only
 * takes effect on the next createSession call (login / signup /
 * password-reset / password-change).
 */
export async function getCurrentSession(): Promise<{
  account: Account;
  session: Session;
} | null> {
  const jar = await cookies();
  const jwt = jar.get(SESSION_COOKIE)?.value;
  if (!jwt) return null;

  const decoded = await verifySessionJwt(jwt);
  if (!decoded) return null;

  const r = redis();
  const session = await r.get<Session>(KEY.session(decoded.sid));
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await destroySession(decoded.sid);
    return null;
  }

  const account = await getAccountById(session.accountId);
  if (!account) {
    await destroySession(decoded.sid);
    return null;
  }

  const remainingSec = Math.max(
    1,
    Math.floor(
      (new Date(session.expiresAt).getTime() - Date.now()) / 1000,
    ),
  );
  await r.expire(KEY.session(decoded.sid), remainingSec);

  return { account, session };
}

export async function destroySession(sessionId: string): Promise<void> {
  const r = redis();
  const s = await r.get<Session>(KEY.session(sessionId));
  await r.del(KEY.session(sessionId));
  if (s) await r.srem(KEY.accountSessions(s.accountId), sessionId);
}

export async function destroyAllSessionsForAccount(
  accountId: string,
  keepSessionId?: string,
): Promise<void> {
  const r = redis();
  const ids =
    (await r.smembers(KEY.accountSessions(accountId))) ?? [];
  for (const id of ids) {
    if (id === keepSessionId) continue;
    await r.del(KEY.session(id));
    await r.srem(KEY.accountSessions(accountId), id);
  }
}

export async function listSessionsForAccount(
  accountId: string,
): Promise<Session[]> {
  const r = redis();
  const ids = (await r.smembers(KEY.accountSessions(accountId))) ?? [];
  const sessions: Session[] = [];
  for (const id of ids) {
    const s = await r.get<Session>(KEY.session(id));
    if (s) sessions.push(s);
  }
  return sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function requireSession() {
  const s = await getCurrentSession();
  if (!s) throw new Response("Unauthorized", { status: 401 });
  return s;
}

// ---------------------------------------------------------------------------
// Bearer-token ingress (Atelier desktop client + future native clients)
// ---------------------------------------------------------------------------
//
// The Atelier desktop client cannot consume the HttpOnly `__Host-session`
// cookie path the browser uses, so it presents the same JWT in an
// `Authorization: Bearer <jwt>` header instead. Crucially, the JWT and
// the secret are identical — Bearer ingress is purely an ingress shape;
// no new auth model, no new key material, no parallel session store.
//
// `getSessionFromBearer` mirrors `getCurrentSession`: verify JWT, look
// up the Redis session record at `dunamis:session:{sid}`, refresh its
// TTL clamped to remaining wall-clock until expiresAt, return
// `{ account, session }` or null.

export async function getSessionFromBearer(req: Request): Promise<{
  account: Account;
  session: Session;
} | null> {
  const auth = req.headers.get("authorization");
  if (!auth) {
    console.warn("[bearer-auth] no Authorization header");
    return null;
  }
  if (!auth.startsWith("Bearer ")) {
    console.warn("[bearer-auth] header not Bearer scheme");
    return null;
  }
  const jwt = auth.slice("Bearer ".length).trim();
  if (!jwt) {
    console.warn("[bearer-auth] empty bearer token");
    return null;
  }

  const decoded = await verifySessionJwt(jwt);
  if (!decoded) {
    console.warn("[bearer-auth] JWT verify failed (signature/issuer/audience/expiry)");
    return null;
  }

  const r = redis();
  const session = await r.get<Session>(KEY.session(decoded.sid));
  if (!session) {
    console.warn(`[bearer-auth] no session record at sid=${decoded.sid}`);
    return null;
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    console.warn(`[bearer-auth] session expired sid=${decoded.sid} expiresAt=${session.expiresAt}`);
    await destroySession(decoded.sid);
    return null;
  }

  const account = await getAccountById(session.accountId);
  if (!account) {
    console.warn(`[bearer-auth] account ${session.accountId} not found for sid=${decoded.sid}`);
    await destroySession(decoded.sid);
    return null;
  }

  const remainingSec = Math.max(
    1,
    Math.floor(
      (new Date(session.expiresAt).getTime() - Date.now()) / 1000,
    ),
  );
  await r.expire(KEY.session(decoded.sid), remainingSec);

  return { account, session };
}

/**
 * Try cookie ingress first, then Bearer header. Used by endpoints that
 * should accept either — the customer portal site reads cookies; the
 * Atelier desktop client and any future native client reads Bearer.
 *
 * Returns `null` on any auth failure. Callers MUST check and return
 * their own 401 response — never throw a Response in a route handler;
 * Next.js App Router does not auto-catch thrown Response objects and
 * the throw bubbles up as an unhandled error, returning 500 instead
 * of the intended 401.
 */
export async function getCurrentSessionAny(
  req: Request,
): Promise<{ account: Account; session: Session } | null> {
  const cookie = await getCurrentSession();
  if (cookie) return cookie;
  return getSessionFromBearer(req);
}

// ---------------------------------------------------------------------------
// Admin gate — env-var-as-ACL, no role field on Account
// ---------------------------------------------------------------------------

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Whether the ADMIN_EMAILS allowlist is configured at all. Distinct
 * from "the current user is not on the allowlist" — Production and
 * Preview always have ADMIN_EMAILS set in Vercel; Development
 * intentionally does not. Admin route handlers check this up front
 * and return a structured 503 in dev rather than the 403 a real
 * not-on-the-allowlist user would get in prod.
 */
export function isAdminAllowlistConfigured(): boolean {
  const raw = process.env.ADMIN_EMAILS;
  return Boolean(raw && raw.trim().length > 0);
}

/**
 * Canonical body for the unconfigured-allowlist case. Mirrors the
 * shape of LICENSE_SIGNING_UNAVAILABLE_BODY in
 * src/lib/atelier-license-signing.ts so admin clients can branch on
 * the `error` field uniformly.
 */
export const ADMIN_ALLOWLIST_UNCONFIGURED_BODY = {
  error: "admin_allowlist_unconfigured",
  message:
    "Admin routes require production/preview env vars (ADMIN_EMAILS).",
} as const;

/**
 * Returns the current session if the logged-in user is an admin, else null.
 * Use in server components / layouts where you want to redirect rather than 403.
 */
export async function getCurrentAdminSession() {
  const s = await getCurrentSession();
  if (!s) return null;
  const admins = getAdminEmails();
  if (!admins.includes(s.account.email.toLowerCase())) return null;
  return s;
}

/**
 * Requires a valid session whose email is in ADMIN_EMAILS.
 * Throws 401 if not logged in, 403 if logged in but not admin.
 */
export async function requireAdmin() {
  const s = await getCurrentSession();
  if (!s) throw new Response("Unauthorized", { status: 401 });
  const admins = getAdminEmails();
  if (!admins.includes(s.account.email.toLowerCase())) {
    throw new Response("Forbidden", { status: 403 });
  }
  return s;
}
