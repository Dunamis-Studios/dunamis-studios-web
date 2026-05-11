/**
 * Reduce a client IP to a coarser network range so the value we store
 * is good enough for abuse-response correlation but no longer a unique
 * identifier for the individual subscriber.
 *
 * IPv4 is truncated to a /24 by zeroing the last octet. IPv6 is
 * truncated to a /48 by keeping only the first three 16-bit groups
 * and zeroing the remainder.
 *
 * Truncation choice rationale: /24 is the consumer-ISP allocation
 * boundary in most US residential networks; /48 is the IANA-recommended
 * minimum site allocation for IPv6. Both ranges typically cover a
 * household or a small office. Coarse enough to deflect "we stored the
 * customer's IP" concerns under GDPR/CCPA; precise enough to surface
 * patterns when abuse correlation kicks in.
 *
 * Returns null for null/empty input. Returns the input unchanged if it
 * cannot be parsed as a recognizable IPv4 or IPv6 string, so we never
 * silently mint a fake-looking value from a malformed XFF header.
 */
export function truncateIp(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed === "") return null;

  if (looksLikeIpv4(trimmed)) {
    const parts = trimmed.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
    return trimmed;
  }

  if (trimmed.includes(":")) {
    return truncateIpv6(trimmed);
  }

  return trimmed;
}

function looksLikeIpv4(s: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(s);
}

/**
 * Truncate an IPv6 string to its /48 by reconstructing from at most
 * the first three 16-bit groups. Handles the `::` zero-compression
 * shorthand, IPv4-mapped tails, and zone-id suffixes (`%eth0`).
 */
function truncateIpv6(addr: string): string {
  const zoneIdx = addr.indexOf("%");
  const core = zoneIdx >= 0 ? addr.slice(0, zoneIdx) : addr;

  if (core.includes(".")) {
    return truncateIpv4MappedIpv6(core) ?? addr;
  }

  const [head, tail] = splitDoubleColon(core);
  if (head === null) return addr;
  const groups = expandGroups(head, tail);
  if (!groups) return addr;
  const top3 = groups.slice(0, 3);
  while (top3.length < 3) top3.push("0");
  return `${top3[0]}:${top3[1]}:${top3[2]}::`;
}

function splitDoubleColon(core: string): [string[], string[]] | [null, null] {
  if (core === "::") return [[], []];
  if (core.startsWith("::")) {
    return [[], core.slice(2).split(":")];
  }
  if (core.endsWith("::")) {
    return [core.slice(0, -2).split(":"), []];
  }
  const dbl = core.indexOf("::");
  if (dbl >= 0) {
    return [
      core.slice(0, dbl).split(":"),
      core.slice(dbl + 2).split(":"),
    ];
  }
  return [core.split(":"), []];
}

function expandGroups(head: string[], tail: string[]): string[] | null {
  const headClean = head.filter((g) => g !== "");
  const tailClean = tail.filter((g) => g !== "");
  for (const g of [...headClean, ...tailClean]) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null;
  }
  const fill = 8 - (headClean.length + tailClean.length);
  if (fill < 0) return null;
  const out = [...headClean];
  for (let i = 0; i < fill; i++) out.push("0");
  out.push(...tailClean);
  return out.slice(0, 8);
}

function truncateIpv4MappedIpv6(addr: string): string | null {
  const lastColon = addr.lastIndexOf(":");
  if (lastColon < 0) return null;
  const head = addr.slice(0, lastColon);
  const tail = addr.slice(lastColon + 1);
  if (!looksLikeIpv4(tail)) return null;
  const tailParts = tail.split(".");
  const truncatedTail = `${tailParts[0]}.${tailParts[1]}.${tailParts[2]}.0`;
  return `${head}:${truncatedTail}`;
}

/**
 * Pull a client IP off a Next.js Request, prefer the first hop in
 * x-forwarded-for, then x-real-ip, then the request's own remote
 * address. Truncates the result so call sites never accidentally
 * store the raw value.
 */
export function truncatedClientIp(request: Request): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return truncateIp(first);
  }
  const real = request.headers.get("x-real-ip");
  if (real) return truncateIp(real);
  return null;
}
