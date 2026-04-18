import { cookies } from "next/headers";
import { redis, KEY } from "./redis";
import type { Account, Session } from "./types";
import { signSessionJwt, uuid, verifySessionJwt } from "./tokens";
import { getAccountById } from "./accounts";

const THIRTY_DAYS_SEC = 60 * 60 * 24 * 30;

/**
 * Cookie name: `__Host-` prefix requires Secure + Path=/ + no Domain,
 * which gives us the strictest same-origin guarantee.
 */
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-session" : "dunamis_session";

export async function createSession(
  accountId: string,
  meta: { userAgent: string; ip: string },
): Promise<{ sessionId: string; jwt: string }> {
  const sessionId = uuid();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_SEC * 1000);

  const session: Session = {
    sessionId,
    accountId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    userAgent: meta.userAgent.slice(0, 300),
    ip: meta.ip.slice(0, 45),
  };

  const r = redis();
  await r.set(KEY.session(sessionId), session, { ex: THIRTY_DAYS_SEC });
  await r.sadd(KEY.accountSessions(accountId), sessionId);

  const jwt = await signSessionJwt(sessionId);
  return { sessionId, jwt };
}

export async function setSessionCookie(jwt: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS_SEC,
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
 * Read session from the incoming cookie, refresh TTL on hit (rolling
 * sessions), and return the account + session record. Returns null for
 * any invalid/expired state.
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

  // Rolling TTL — extend whenever the session is actively used.
  await r.expire(KEY.session(decoded.sid), THIRTY_DAYS_SEC);

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
