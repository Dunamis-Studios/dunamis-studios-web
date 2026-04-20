# Dunamis Studios — Web

Marketing site + customer portal for [Dunamis Studios](https://dunamisstudios.net).

> One account. Every app. Every portal.

## Stack

- **Next.js 15** (App Router) + **TypeScript** (strict)
- **Tailwind CSS v4** (CSS-based `@theme` config) + **shadcn-style** primitives on top of Radix
- **Upstash Redis** for all persistence (keys prefixed `dunamis:*`)
- **bcryptjs** password hashing + **jose** JWT-signed session cookies
- **Resend** transactional email (swappable — see `src/lib/email.ts`)
- **zod** for every request/form schema

## Local development

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env.local
# Then fill in:
#   KV_REST_API_URL, KV_REST_API_TOKEN  (Upstash REST URL + token)
#   JWT_SECRET                          Session-cookie signing secret
#   KB_RATING_SALT                      Salts the IP hashes stored
#                                         against help-center ratings.
#                                         Required in production; dev
#                                         falls back to an insecure
#                                         placeholder.
#   RESEND_API_KEY, RESEND_FROM_EMAIL   (optional in dev — see below)

# 3. Run
npm run dev
# → http://localhost:3000
```

**Without Resend**: if `RESEND_API_KEY` is unset the email layer logs the
payload instead of sending — useful for local signup/reset flows without a
real inbox.

## Stripe testing

This project wires Stripe in **test mode only**. Product and price IDs are
documented in the debrief repo's `docs/stripe-integration-test.md` and
resolved here via env vars (`STRIPE_PRICE_DEBRIEF_*`).

**Local webhook forwarding** (required for subscription/credit-pack
state to sync back to Redis while developing):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_…` that `stripe listen` prints as `STRIPE_WEBHOOK_SECRET`
in `.env.local`. Stripe's published webhook signing secret for the
production endpoint is separate — don't reuse it locally.

**Test cards** (future expiry, any CVC, any ZIP):

| Card                  | Behavior                          |
| --------------------- | --------------------------------- |
| `4242 4242 4242 4242` | Success                           |
| `4000 0025 0000 3155` | 3D Secure challenge, then success |
| `4000 0000 0000 0002` | Decline — generic                 |
| `4000 0000 0000 9995` | Decline — insufficient funds      |

## Seed a test entitlement

To see the populated dashboard and entitlement-detail pages without wiring
up the HubSpot install flow, use the seed script. It requires an account
that already exists (create one at `/signup` first).

```bash
npm run seed:entitlement -- \
  --email you@example.com \
  --product property-pulse \
  --portal-id 12345678 \
  --domain acme.com \
  --status active \
  --tier pro \
  --credits 1200
```

Run `npm run seed:entitlement -- --help` for all flags, including `--unlink`
to remove an entitlement.

## Routes

### Marketing
| Route | What it does |
|-|-|
| `/` | Hero, product tiles, social proof, principles, CTA |
| `/products/property-pulse` | Full product page — hero, problem, features, FAQ |
| `/products/debrief` | Same structure, Debrief-specific content |
| `/pricing` | Side-by-side tier tables for both products |
| `/terms` | ToS placeholder with draft banner |
| `/privacy` | Privacy placeholder with draft banner |

### Auth
| Route | What it does |
|-|-|
| `/signup` | Create an account, auto-login, send verification email |
| `/login` | Sign in, supports `?redirect=` |
| `/forgot-password` | Request reset link (account-existence-opaque response) |
| `/reset-password/[token]` | Set a new password, revokes all sessions |
| `/verify-email/[token]` | Confirms the email and redirects to dashboard |

### Account (auth required — redirect to `/login` if signed out)
| Route | What it does |
|-|-|
| `/account` | Personalized dashboard + entitlement table with empty state |
| `/account/settings` | Profile, password, sessions, danger zone |
| `/account/[product]/[portalId]` | Per-entitlement management screen |

### API
| Method + path | Purpose |
|-|-|
| `POST /api/auth/signup` | Create account, set session cookie |
| `POST /api/auth/login` | Verify credentials, set session cookie |
| `POST /api/auth/logout` | Destroy session, clear cookie |
| `POST /api/auth/forgot-password` | Send reset email (opaque response) |
| `POST /api/auth/reset-password` | Validate token, set new password |
| `POST /api/auth/verify-email` | Validate token, mark email verified |
| `GET  /api/auth/me` | Current account + session |
| `PATCH /api/account/profile` | Update name + email (re-verification on email change) |
| `PATCH /api/account/password` | Change password, revoke all sessions, issue new |
| `GET  /api/account/sessions` | List active sessions |
| `DELETE /api/account/sessions` | Sign out of all other sessions |
| `DELETE /api/account/sessions/[sessionId]` | Revoke a specific session |
| `DELETE /api/account` | Soft-delete account (30-day recovery window) |
| `POST /api/account/resend-verification` | Re-issue the email-verification token |
| `GET  /api/entitlements` | List entitlements for the signed-in account |
| `GET  /api/entitlements/[product]/[portalId]` | Fetch a specific entitlement |

All endpoints validate input with zod and return typed JSON errors of the
shape `{ error: { code, message, fields? } }`.

## Redis key schema

All keys prefixed `dunamis:` so we don't collide with Property Pulse or
Debrief data that share the same KV instance.

```
dunamis:account:{accountId}                → Account record
dunamis:email-to-account:{emailLower}       → accountId  (unique index)
dunamis:session:{sessionId}                 → Session record, 30d rolling TTL
dunamis:account-sessions:{accountId}        → Set of sessionIds
dunamis:verify-email:{token}                → VerifyRecord, 24h TTL
dunamis:reset-password:{token}              → ResetRecord, 1h TTL
dunamis:entitlement:{product}:{portalId}    → Entitlement record
dunamis:account-entitlements:{accountId}    → Set of "product::portalId" compound keys
dunamis:rate:{bucket}:{key}                 → Rate-limit counter (15-min windows)
dunamis:kb:rating:{category}:{slug}         → Help-center up/down counters (HSET)
dunamis:kb:rated:{category}:{slug}          → Hashed IPs that have rated, 180d TTL
dunamis:kb:feedback:{category}:{slug}       → Free-text feedback entries (LIST, max 100)
```

## Security posture

- **Session cookies**: `__Host-session` (Secure, SameSite=Lax, Path=/) in
  production; dev uses a plain-name cookie so localhost works over http.
- **JWT**: HS256, contains only `{ sid }` — the actual session lives in
  Redis and is checked/extended on every request (rolling 30-day TTL).
- **Passwords**: bcryptjs cost 12, min 8 chars, number-or-symbol required,
  72-byte guard.
- **Rate limits**: IP-based fixed-window counters on login, signup,
  forgot-password, reset-password (10 attempts / 15 min).
- **Enumeration**: forgot-password always returns the same response
  whether or not the email exists.
- **CSRF**: mitigated by `SameSite=Lax` + same-origin-only POSTs from our
  own forms. No CSRF tokens.
- **Headers**: `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, restrictive `Permissions-Policy` in `next.config.ts`.

## Design

- Dark-first with a proper toggle (default dark, persisted to
  `localStorage`, no flash on load).
- Fonts: **Fraunces** display serif for headings, **Geist** sans for body,
  **Geist Mono** for IDs + technical detail.
- Design tokens live in `src/app/globals.css` under `@theme` — colors use
  OKLCH so the palette stays perceptually even across light/dark.
- Per-product accent colors thread through marketing, dashboard badges,
  and detail pages: **pulse** green for Property Pulse, **brief** amber
  for Debrief.

## Deploying to Vercel

The site was scaffolded against a Vercel project called `dunamis-studios-web`.
Steps you'll run yourself:

1. `vercel link` (or import the repo in the Vercel dashboard)
2. Link the existing **dunamis-studios-kv** Upstash integration to this
   project for all environments (prefix `REDIS`). The integration
   auto-populates `KV_REST_API_URL` + `KV_REST_API_TOKEN`.
3. Add env vars: `JWT_SECRET`, `KB_RATING_SALT`, `RESEND_API_KEY`,
   `RESEND_FROM_EMAIL`, `APP_URL=https://dunamisstudios.net`.
   `KB_RATING_SALT` salts the IP hashes stored against help-center
   ratings — provision it as a secret following the same convention
   used for the other secrets in this project.
4. Add domains `dunamisstudios.net` and `www.dunamisstudios.net` in the
   Vercel project settings (set `www` to redirect to apex). Vercel will
   show the exact A / CNAME records to set at your registrar.
5. In Resend, add and verify the `dunamisstudios.net` sending domain
   (SPF, DKIM records). Set `RESEND_FROM_EMAIL=hello@dunamisstudios.net`.

## Known gaps / future work

- **Stripe integration**: every billing CTA is intentionally disabled with
  a tooltip. Wire up subscription checkout, webhooks, and the customer
  portal next.
- **HubSpot install flow**: stub-entitlement creation on HubSpot install
  lives in the Property Pulse and Debrief app repos; this site only
  *claims* the stub once the user signs up or is already signed in.
  Debrief's side is wired as of 2026-04 — on OAuth callback it writes
  a stub entitlement to `dunamis:entitlement:debrief:{portalId}` and
  302-redirects the installer to `/api/entitlements/claim?portalId=
  &email=&state=` here. The route handler verifies the HMAC-signed
  state token (15 min TTL, `CLAIM_STATE_SECRET` env), then routes the
  browser to `/signup?claim=debrief:{portalId}&state=...` (no session)
  or `/account/debrief/{portalId}/claim?state=...` (has session). The
  signup flow and the claim page both call `linkEntitlementToAccount`
  after an email-match check. Property Pulse still needs the
  equivalent wiring on its side.
- **Docs / blog / changelog**: footer links go nowhere yet.
- **i18n**: English only.
- **Test suite**: none scaffolded. The data-access layer and the zod
  schemas are the right places to add unit tests first.

## Backlog

Larger architectural commitments that are too meaty for a single
"known gap" bullet. Each entry is written at the detail an engineer
would need to scope the work before picking it up.

### Account role system

Currently every account in Redis has no `role` field. The admin-gated
`GET /api/kb/[slug]/rate` fails closed (403) until a role system
exists. When building:

- Widen the `Account` type in `src/lib/types.ts` to include
  `role?: "admin" | "member"` (or similar).
- Decide how roles get assigned (first account on a workspace becomes
  admin? Manual stamping via a super-admin CLI? Role promotion UI?).
- Audit every API route and server component for role-gated vs
  role-open paths. Currently only the KB rating GET uses role checks,
  but an admin dashboard, email-notification triage surfaces, and
  cross-portal analytics will all want the same primitive.
- Decide whether `Account`/`Session` already carries enough context to
  cache the role decision vs refetching per request.

### Help-center admin dashboard

`/admin/kb/ratings` page showing per-article up/down counts, the
LPUSH'd feedback stream, and simple aggregates (ratio, total per
article, articles below a helpful threshold). Gated to `role=admin`
accounts once the role system above lands. The Redis keys, POST
endpoints, and admin-gated rating GET are already in place — this is
front-end + list/filter views only, no new data model.

## License

Proprietary. © Dunamis Studios.
