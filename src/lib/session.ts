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

  const jwt = await signSessionJwt(sessionId);
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
