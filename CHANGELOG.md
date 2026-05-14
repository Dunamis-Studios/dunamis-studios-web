# Changelog

All notable changes to dunamisstudios-site are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This file was retconned from git history on 2026-05-14 (every prior commit
landed on `main` without a version bump). The version timeline below is the
reconstructed shipping cadence; the codebase itself moved from `0.1.0` straight
to the retconned current version (`0.30.0`) in a single bump commit alongside
this file. Tagging is intentionally deferred to Josh.

## [Unreleased]

## [0.31.0] - 2026-05-14

### Added
- `FEATURE_FLAGS.hubspotSurfacesVisible` feature flag at `src/lib/feature-flags.ts` controls every customer-facing HubSpot product surface from a single boolean.
- `/marketplace` landing page scaffolded as a "Coming soon" placeholder, surfaced from site nav, footer, and sitemap.
- Site nav and footer Marketplace surfaces (always visible regardless of the HubSpot flag).

### Changed
- Site nav: HubSpot Custom Development lane hidden behind the new flag; Marketplace lane always visible.
- Site footer: HubSpot Custom Development column hidden behind the new flag; Marketplace column always visible; studio description rewritten to drop HubSpot-only phrasing when the flag is off.
- Home page: HubSpot service tile, HubSpot Products section, HubSpot-flavored FAQ, principles, and final CTA copy all conditionally hidden or rewritten when the flag is off; metadata, OpenGraph, FAQPage / WebSite schemas updated to match.
- About page: HubSpot Custom Development card, hero copy, "two service lines" heading, and metadata all conditionally hidden or rewritten when the flag is off.
- Help center: HubSpot-tagged KB articles (`product: debrief`, `product: property-pulse`) filtered out at the loader level when the flag is off; help index hero/description and `PRODUCT_ORDER` rewritten to drop HubSpot mentions.
- `llms.txt`: HubSpot Products, Articles, Guides, HubSpot Custom Development service line, and HubSpot pricing entry all conditionally suppressed when the flag is off; studio overview rewritten.
- Sitemap: all `/custom-development/*` URLs (lane landing, products, tools, courses, articles, guides, pricing) gated behind the flag; Redis-backed guides/articles surface gated behind the flag.

### Hidden
- `/custom-development` lane and its entire subtree (5 product pages, 9 tool pages, courses landing + hubspot-audit, articles, guides, pricing, products index, debrief roadmap) return `notFound()` from the lane layout when the flag is off.

### Notes
- HubSpot CRM mirror used by support, contact, notify, courses, and tools forms is internal plumbing and stays fully functional regardless of the flag. Only customer-facing HubSpot product surfaces are hidden.

## [0.30.0] - 2026-05-14

### Added
- TLD sweep across customer-facing email references from `@dunamisstudios.com` to `@dunamisstudios.net`; KB content cleanup pass (#28).
- Site-wide Cloudflare Turnstile bot protection on every public form-submit route (support, contact, notify, courses, 9 tool reports) (#29).
- Support form submit-feedback QOL: auto-scroll + focus on first invalid field, inline error summary panel above Submit, smooth-scroll the success card into view (#34).
- Per-article KB thumbs aggregation admin view at `/admin/kb-feedback` (#35).
- UptimeRobot status page link in the site footer Company column (#35).

### Changed
- HubSpot multi-object form submission for support tickets: every field now carries its owning `objectTypeId` so a multi-object form (one Ticket per submission, one Contact upserted alongside) does not silently misroute every property to the default Contact object (#31).
- HubSpot field-name audit + untruncated error logs for property-name mismatches (#32).
- 15 conditional support-form fields enforced app-side via `superRefine` + the React form's required-when-shown rules (#33).
- Admin `/api/admin/lookup-account` consolidated into the rate-limited `/api/admin/customers/search` endpoint; issuance UI migrated to the array-shape response with nullable-name coalescing (#35).

### Fixed
- Cloudflare Turnstile widget allowed in Content Security Policy: `script-src` + `frame-src` + `connect-src` now list `challenges.cloudflare.com` so the widget can mount, solve, and verify without CSP rejections (#30).

## [0.29.0] - 2026-05-12

### Added
- Support form with shared HubSpot submit helper, conditional field logic across 8 categories, and Help Desk pipeline integration (#24).
- Thumbs-down on help articles reveals an inline support form prefilled with article context (#25).
- Verification key tool: HMAC-SHA256 30-minute keys, Mode A (signed-in customer generation) + Mode B (email delivery), admin Verification Keys section on customer detail (#27).

### Changed
- Help-center support-response copy softened with small-studio framing (#26).

## [0.28.0] - 2026-05-12

### Added
- Admin section restructure: dedicated routes, persistent admin header, dashboard with quick stats, audit log feed (#19).
- Customers search + customer detail page with licenses + sessions + EULA acceptances + audit history (#20).
- Copyable-id component for admin tables (#21).
- Read-write actions for customer detail: deactivate device, refund/revoke license, resend license email, trigger data export, refresh from Stripe, profile edit, account delete (#22).
- Admin account timezone honored in LocalTime renderings (#23).

## [0.27.1] - 2026-05-12

### Changed
- Stripe API client migrated to `2026-04-22.dahlia`; `@stripe/stripe-js` bumped to `^9.4.0`.
- Dependabot config refined: eslint pinned to v9, ignore rule added for the eslint-config-next peer constraint, auto-merge resumed with the Vercel gate enforced (#16, #11, #12, #14, #15).
- Routine dependency bumps merged via Dependabot: stripe-ecosystem group, next-ecosystem group, tiptap group, lucide-react, dev-tooling group, jose, resend, bcryptjs, zod, tailwind-merge, dependabot/fetch-metadata.

### Fixed
- Sync checkout route brought to parity with the Atelier checkout route (#17).
- bcryptjs stub types dropped; atelier-docs index untracked (#18).

## [0.27.0] - 2026-05-11

### Added
- `/security` page with disclosure policy, GPG fingerprint placeholder, and Acknowledgments section sourced from `content/security-acknowledgments.md`; `public/.well-known/security.txt`; footer link.
- `/privacy/do-not-sell` page surfacing the CCPA right-to-opt-out interface.
- `/api/account/data-export` + customer portal "Download my data" button.
- Atelier activation endpoint rate limit at 20/10m + truncated IP storage to /24 (IPv4) and /48 (IPv6) on every persisted activation record.
- Master Terms of Sale restructured as a product-agnostic framework with per-product Service Addenda at `/terms/atelier`, `/terms/debrief`, `/terms/property-pulse`.
- Master Refund Policy restructured with per-product addenda at the same shape.
- Dependabot config landed for npm + actions across the repo.

### Changed
- Atelier EULA bumped to v1.1 with five-section hardening: FDUTPA notice, export-controls clause, UCITA inapplicability opt-out, expanded warranty disclaimer, and Section 24 acceptance-record clarification.
- Privacy policy rewritten for launch with multi-app coverage, sub-processor disclosures, and clear consent-stamping language.

## [0.26.0] - 2026-05-10

### Changed
- Atelier-docs reconciled with shipped reality across the v1 surface: install, first-run, what's-included, user-guide, troubleshooting, api-reference, integration-examples, privacy, EULA, refund-policy.
- Dual-bind day-of phone view documented in `whats-included.md` and `api-reference.md`; online-activation REST endpoints documented.

## [0.25.0] - 2026-05-09

### Added
- Server-side EULA renderer with substitution validation: rendered text + SHA-256 + substitution values stored on every acceptance.
- `POST /api/atelier/record-eula-acceptance` stores the rendered text; admin EULA history modal on `/admin/licenses` includes a "View accepted document" affordance.
- Customer portal "Download my accepted EULA" button on `/account/atelier-licenses`.
- Account picker on Atelier license issuance + customer portal queries by `account_id`.

### Changed
- Native browser `confirm()` calls on `/account/atelier-licenses` replaced with the Dialog primitive for consistent UX.
- Atelier privacy + EULA docs updated to describe `rendered_eula_text` storage.

## [0.24.0] - 2026-05-08

### Added
- Dunamis Sync Phase 1 server scaffold: API routes for `/api/sync/status`, `/api/sync/manifest`, `/api/sync/blob`, `/api/sync/list-changes`, `/api/sync/batch-upload`, `/api/sync/rotate-key`, `/api/sync/portal`, `/api/sync/export`, `/api/sync/account-delete`.
- Cron jobs for trial expiry, grace cleanup, tombstone sweep.
- Bearer-token ingress middleware + body-extension for native client requests.
- Atelier direct-to-Stripe perpetual checkout + webhook fulfillment.
- Atelier licenses surfaced on `/account` dashboard.
- Account schema gains `companyName` + `timeZone` + `logoUrl`, plus settings UI for editing them and a logo upload flow.

### Fixed
- Sync server matches private Vercel Blob store with overwrite allowed (`ad83e1c`).
- Bearer auth replaces throw-Response with explicit null returns + structured rejection logging.

## [0.23.0] - 2026-05-07

### Added
- Atelier online activation: `/api/atelier/activate` with 2-of-3 matching (license + machine fingerprint + account email), `/api/atelier/heartbeat`, `/api/atelier/deactivate`, `/api/atelier/my-licenses`.
- Customer portal wired to live activation data; revocation modal with mode + reason capture for admin.
- License-delivery email reflects the online-activation model and attaches a `.atlr-license` artifact.

## [0.22.0] - 2026-05-07

### Added
- Atelier licensing infrastructure: Redis schema for license records, Ed25519 signing service, email-hash helper, admin routes for issuance/lookup/status, license-delivery email via Resend.
- `/admin/licenses` page with issuance form, table, filters, actions.
- Public lost-license self-service flow.
- `scripts/issue-license-cli.ts` + `npm run issue-license`.
- Atelier-docs updated for the new licensing model (online activation, 3-device limit, heartbeat, grace periods).

### Fixed
- Lazy-init signing key + admin allowlist with structured 503 short-circuit when unconfigured.

## [0.21.0] - 2026-05-07

### Added
- Atelier marketing page at `/build-services/products/atelier` with full content module, buy-request form, `/api/atelier-buy-request` API route, email handoff to admin.
- Atelier docs scaffolding under `/build-services/products/atelier/docs`: install, first-run, what's-included, user-guide, bug-fix-policy, troubleshooting, integration-examples, EULA, privacy, refund-policy, api-reference. Client-side fuzzy search via Fuse.js.
- Atelier marketing FAQ + comparison row + privacy callout. Single $149 tier with indefinite bug fixes.

## [0.20.0] - 2026-05-05

### Added
- Build Services + Custom Development two-lane information architecture. Every global marketing route migrated under `/custom-development/<area>` (308 redirects preserve old URLs).
- Atelier oxblood + Build Services purple + Custom Development amber lane wayfinding palettes.
- Lane-scoped sticky subnav chrome; HeroGradient atmospheric glow inherits lane hue.

### Changed
- Studio repositioning: HubSpot work reframed as a specialty practice alongside the broader Build Services line; copy pass across pages, schemas, footer, and KB.

## [0.19.0] - 2026-05-03

### Added
- Free tools sprint shipping 9 SEO-bait assessments: Handoff Time Calculator, Property Audit Checklist, HubSpot Bloat Score, Lead Scoring Builder, Sales Cycle Stagnation Calculator, Tech Stack Cost Audit, Workflow Audit Checklist, Custom Object Decision Tree, Team Member Onboarding Checklist. All paired with `/api/tools/*-report` routes mirroring submissions to a HubSpot Free Tools form and dispatching a Resend report email.
- `/courses` index + `/courses/hubspot-audit` 5-Day HubSpot Audit landing with `/api/courses/signup` writing to Redis source-of-truth and mirroring to a HubSpot Email Courses - Signup form.
- FAQ accordion + FAQPage JSON-LD across homepage, pricing, custom-development, courses, tools index, every tool page, and three published articles.
- First-name + last-name required on every HubSpot-mirrored form (Notify Interests, Free Tools Lead Capture, Email Courses Signup, Custom Development Inquiry).
- Claude-SearchBot + Claude-User user agents added to robots AI allowlist.

### Changed
- Meta titles/descriptions on 4 articles tightened to land within 50-60 character + 120-160 character ranges respectively.
- Organization schema gains St. Augustine, FL address; WebSite schema gains LinkedIn `sameAs`; FAQPage emitter requires name + description + url; freshness `SITE_PUBLISHED` + `SITE_LAST_MODIFIED` spread across every static schema.

## [0.18.0] - 2026-05-01

### Added
- ISR for articles, guides, and help-center routes.
- Static `/login` and `/signup` with client-side session redirect.
- Preconnect to HubSpot tracking origins; HubSpot embed deferred to `requestIdleCallback`.
- Manifest webmanifest preload.
- Cover-image `priority` + blur placeholder; `font-display: swap`.

### Fixed
- Footer column headings converted to `<h3>` (a11y).
- Dark-mode `--fg-subtle` bumped to `#8a8a8a` for WCAG AA contrast.
- Accent cross-links underlined on auth and help surfaces; support mailto underlined on `/help`.
- GFM task-list checkboxes labeled via rehype plugin.
- `force-dynamic` dropped from marketing routes; nav auth state hydrated client-side instead.

## [0.17.0] - 2026-04-30

### Added
- 5-product catalog: `PRODUCT_META` extended with `stage` + `pricingModel` for Atelier, Debrief, Property Pulse, Traverse and Update, Carbon Copy, Association Visualizer.
- `/products` index with stage-aware catalog cards; coming-soon product pages for unshipped apps.
- Notify capture API at `/api/notify` with HubSpot Notify Interests form mirror, `hubspotutk` cookie forwarding, and visitor IP context.

### Changed
- Per-product nav links replaced with a single Products link; footer regrouped accordingly.
- Property Pulse hero CTA wired to the real HubSpot OAuth install URL.

## [0.16.0] - 2026-04-29

### Added
- `/llms.txt` route for AI crawler discovery; `/humans.txt`.
- Explicit AI crawler rules in `robots.txt`.
- Article schema enriched with `keywords` + `wordCount` + `isPartOf` + `inLanguage`.
- WebSite schema with `SearchAction` on homepage; Blog schema with recent BlogPosting items on articles and guides indexes.
- BreadcrumbList schema + visible breadcrumbs on articles, guides, and product pages.
- Organization `sameAs` populated with LinkedIn profile.

### Changed
- Sitemap `lastmod` derived from git at deploy time; legal pages added to sitemap.
- Em-dashes replaced with native punctuation site-wide.

### Fixed
- Guide route uses safe `JsonLd` helper to escape script payload (`141d96a`).
- Placeholder Google + Bing verification keys dropped.

## [0.15.0] - 2026-04-29

### Added
- Listicle content model: Post schema extended with optional listicle structured fields.
- Article render route wired for FAQPage + listicle sections.
- Admin editor UI + API support for listicle Post fields.
- Smoke test + seed scripts for listicle round-trip.

## [0.14.0] - 2026-04-29

### Added
- AEO restructure across product pages: `answerBlock` + `comparison` props on ProductPageShell.
- Property Pulse + Debrief page copy rewritten for AEO extraction.
- FAQPage JSON-LD on Property Pulse + Debrief pages.
- Per-product install CTA label override.

### Changed
- AEO citation baseline document relocated under `docs/internal/`.
- SoftwareApplication descriptions synced with answerBlock for both products.
- Debrief trigger description corrected across the page.

### Fixed
- Em-dashes stripped from Property Pulse page copy.
- Overridden install CTA made non-interactive.

## [0.13.0] - 2026-04-26

### Added
- Guides & Articles content surfaces with admin CMS.
- Post editor SEO sidebar with target-search-keyed checks.
- State-aware Publish/Unpublish button with toast feedback.
- Pinterest domain verification meta tag.

### Fixed
- Auth pages removed from sitemap.
- Vercel build lint errors resolved.

## [0.12.0] - 2026-04-25

### Added
- Property Pulse one-time checkout via Stripe.
- Custom Development services page at `/custom-development`.
- Custom Development contact form with HubSpot submit; required-field markers; field hints above inputs.

### Changed
- Company name dual-written to contact only, not company object (fixed mid-slice).

### Fixed
- "Start a conversation" scroll-to-form anchor.

## [0.11.0] - 2026-04-23

### Added
- Legal v2: master Terms of Sale restructured + per-product Service Addenda (Atelier, Debrief, Property Pulse).
- Privacy policy refreshed for multi-app reality.

### Fixed
- Debrief D5 clarified that add-on credits do not expire.
- Property Pulse legal copy: workflow-name source attribution claims dropped.

## [0.10.0] - 2026-04-23

### Added
- HubSpot tracking script in root layout; typed HubSpot client library for event tracking.
- Signup fires `account_created` + `terms_accepted` events.
- 4 Stripe events wired to `trackEvents`.
- Claim-link fires `app_installed` for both new and existing users.
- Versioned consent persisted + re-stamped on every sync.
- `app_uninstalled` event type with `uninstalled_at`.

### Fixed
- Signup events batched into one upsert to kill a race condition.
- HubSpot CSP allowlist for tracking script + cookie banner POSTs + pixel fetches.

## [0.9.0] - 2026-04-21

### Added
- HSTS header (S-H2).
- Content Security Policy + X-Permitted-Cross-Domain-Policies headers (S-I1, S-I2).
- Reserved portal-id tokens blocked (S-L2).
- `.env.example` documents every required secret (S-L5).

### Changed
- Session JWT expiration aligned with account lifetime (S-M2).
- KB rating rate-limit bucket raised from 10/15m to 100/1h (S-M3).
- IP read from `x-real-ip` first, falling back to last `x-forwarded-for` entry.
- PaymentIntent amount verified against credit pack before granting credits.

### Fixed
- Login timing equalized to prevent email enumeration (S-H4).
- Recipient email redacted in dev send fallback log (S-H3).
- Signature-error detail stripped from Stripe webhook response (S-M1).
- Name fields NFC-normalized in Zod schema (S-L1).

## [0.8.0] - 2026-04-21

### Added
- Property Pulse repositioned as change-history card; $49 one-time install fee.
- Product-specific hero visualizations (`6cc2d9d`).
- Property Pulse install article (KB) at `/help/getting-started/install-property-pulse`.
- Property Pulse screenshots section between problem and features; click-to-lightbox affordance filling 98vw / 98vh.
- Install handoff generalized to accept any product slug (`51e06a9`).

### Fixed
- Claim-state log records specific verification failure reason before returning null.
- `APP_URL` fails fast on missing env instead of localhost fallback.
- Property Pulse permissions copy rewritten to match actually-requested scopes.
- Property Pulse product-page pricing teaser + schema synced with the one-time install fee.

## [0.7.0] - 2026-04-20

### Added
- Legal v1: Privacy Policy, Terms of Service, Data Processing Agreement, Subprocessors list.

### Fixed
- Inaccurate solicitation claim removed from privacy.
- Anthropic retention line clarified.
- EU/UK Representative placeholder section removed.

## [0.6.0] - 2026-04-20

### Added
- Help center + KB content surface with article + category + product taxonomy.
- Session lifetime toggle.
- Initial KB article set across about / billing / debrief-admin / getting-started / security / troubleshooting.

### Changed
- "Brief me" renamed to "Draft Brief" site-wide.
- All KB articles flipped from `draft: true` to `draft: false`.

### Fixed
- YAML Date frontmatter coerced to YYYY-MM-DD string.
- Debrief install guide: admin must manually add CRM card to layouts.
- Unverified tier claim + unimplemented promo copy removed.

## [0.5.0] - 2026-04-19

### Added
- Debrief roadmap page.
- "Changelog soon" placeholder removed from footer.

## [0.4.0] - 2026-04-18

### Added
- Install handoff flow: HMAC claim-state verifier, claim route + confirmation page, signup auto-link to install claim.
- `CLAIM_STATE_SECRET` documented in `.env.example`.

### Fixed
- Vercel lint failures resolved before merge.

## [0.3.0] - 2026-04-18

### Added
- Sitemap, robots, manifest.
- Dynamic OG, Twitter, icon, apple-icon via ImageResponse.
- Per-page SEO metadata + search-console verification placeholders.
- Organization + SoftwareApplication JSON-LD schemas.
- `brand/` canonical SVG brand kit + PNG rasterization at canonical sizes + brand README.
- Vercel Analytics.

### Fixed
- Invalid `priceSpecification` dropped from Debrief Offer schema.
- Absolute OG + Twitter image URLs with explicit dimensions.
- Title + description lengths tuned into Google's optimal ranges.
- Single source of truth for OG/Twitter images via file convention.
- OG + Twitter images emitted on every marketing page; stale Debrief Twitter title fixed.

## [0.2.0] - 2026-04-18

### Added
- Stripe client + pricing config.
- Credit bucket data model + migration.
- Subscription checkout via Stripe Elements.
- Credit pack purchases.
- Cancel + reactivate + customer-portal flows.
- Billing history + webhook handler.
- Pricing page credit add-ons section.
- `POST /api/stripe/create-setup-intent` + SetupIntent-first subscription flow.
- Poll-until-updated on subscribe + credit pack flows; two-column modal layout.
- `entitlement.subscriptionHistory` tracking.
- Upcoming-charge preview on the entitlement detail page.

### Changed
- Change-plan flow polls until the new tier lands; resets monthly credits on any mid-period tier change; prorates immediately via `always_invoice`.
- `Account.stripeCustomerId` removed; entitlements now own the Customer.
- Seed `--unlink` cascades to the stripe-customer-to-account reverse index.

### Fixed
- Webhook status mapper covers `incomplete`.
- Misleading "of 50 remaining" pre-subscribe copy removed.
- Current-plan features sourced from `DEBRIEF_TIERS`.
- Entitlement breadcrumb collapsed to two levels.
- Billing history unifies invoices + succeeded credit-pack PIs and filters by customer + entire subscription history.
- Subscription event handlers guard against stale events.
- Previous abandoned setup intent canceled on recreate.
- Upcoming-charge card shows full line-item breakdown on multi-line invoices.

## [0.1.0] - 2026-04-18

### Added
- Next.js 15 project scaffold.
- Design system foundation: tokens, typography, color, primitives.
- Marketing pages skeleton.
- Authentication: signup, login, JWT sessions, password reset, email verification.
- Account portal scaffold.
- Documentation + seed script.
- React Server Components CVE patch (PR #1).

### Fixed
- Variable font loader `weight` prop removed.
- `force-dynamic` rendering set on authenticated account routes.
