import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters.");
  }
  return encoder.encode(s);
}

export async function signSessionJwt(
  sessionId: string,
  lifetimeSec: number,
): Promise<string> {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer("dunamis-studios")
    .setAudience("dunamis-session")
    .setExpirationTime(Math.floor(Date.now() / 1000) + lifetimeSec)
    .sign(secret());
}

export async function verifySessionJwt(
  token: string,
): Promise<{ sid: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "dunamis-studios",
      audience: "dunamis-session",
    });
    if (typeof payload.sid !== "string") return null;
    return { sid: payload.sid };
  } catch {
    return null;
  }
}

/** Generate a cryptographically random URL-safe token. */
export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function uuid(): string {
  return crypto.randomUUID();
}
