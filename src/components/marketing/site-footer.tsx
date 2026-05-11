import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-subtle)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2.5 text-[var(--fg)]">
            <LogoMark size={22} />
            <span className="font-[var(--font-display)] text-lg font-medium tracking-tight">
              Dunamis Studios
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-[var(--fg-muted)]">
            A software studio with two service lines — Build Services and
            HubSpot Custom Development — plus a small catalog of HubSpot
            marketplace apps and prebuilt desktop software.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Build Services
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link
                href="/build-services"
                className="text-[var(--fg-muted)] hover:text-[var(--color-build-600)] dark:hover:text-[var(--color-build-400)]"
              >
                Overview
              </Link>
            </li>
            <li>
              <Link
                href="/build-services/pricing"
                className="text-[var(--fg-muted)] hover:text-[var(--color-build-600)] dark:hover:text-[var(--color-build-400)]"
              >
                Pricing
              </Link>
            </li>
            <li>
              <Link
                href="/build-services/products"
                className="text-[var(--fg-muted)] hover:text-[var(--color-build-600)] dark:hover:text-[var(--color-build-400)]"
              >
                Products
              </Link>
            </li>
            <li>
              <Link
                href="/build-services/articles"
                className="text-[var(--fg-muted)] hover:text-[var(--color-build-600)] dark:hover:text-[var(--color-build-400)]"
              >
                Articles
              </Link>
            </li>
            <li>
              <Link
                href="/build-services/guides"
                className="text-[var(--fg-muted)] hover:text-[var(--color-build-600)] dark:hover:text-[var(--color-build-400)]"
              >
                Guides
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Software Projects
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link
                href="/build-services/products/atelier"
                className="text-[var(--fg-muted)] hover:text-[var(--color-atelier-600)] dark:hover:text-[var(--color-atelier-400)]"
              >
                Atelier
              </Link>
            </li>
            <li>
              <Link
                href="/build-services/products/atelier/docs"
                className="text-[var(--fg-muted)] hover:text-[var(--color-atelier-600)] dark:hover:text-[var(--color-atelier-400)]"
              >
                Atelier Docs
              </Link>
            </li>
            <li>
              <Link
                href="/build-services/products"
                className="text-[var(--fg-muted)] hover:text-[var(--color-atelier-600)] dark:hover:text-[var(--color-atelier-400)]"
              >
                All prebuilt apps
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            HubSpot Custom Development
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link
                href="/custom-development"
                className="text-[var(--fg-muted)] hover:text-[var(--color-hubspot-600)] dark:hover:text-[var(--color-hubspot-400)]"
              >
                Overview
              </Link>
            </li>
            <li>
              <Link
                href="/custom-development/products"
                className="text-[var(--fg-muted)] hover:text-[var(--color-hubspot-600)] dark:hover:text-[var(--color-hubspot-400)]"
              >
                Products
              </Link>
            </li>
            <li>
              <Link
                href="/custom-development/pricing"
                className="text-[var(--fg-muted)] hover:text-[var(--color-hubspot-600)] dark:hover:text-[var(--color-hubspot-400)]"
              >
                Pricing
              </Link>
            </li>
            <li>
              <Link
                href="/custom-development/articles"
                className="text-[var(--fg-muted)] hover:text-[var(--color-hubspot-600)] dark:hover:text-[var(--color-hubspot-400)]"
              >
                Articles
              </Link>
            </li>
            <li>
              <Link
                href="/custom-development/guides"
                className="text-[var(--fg-muted)] hover:text-[var(--color-hubspot-600)] dark:hover:text-[var(--color-hubspot-400)]"
              >
                Guides
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Company
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/about" className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/help" className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                Help center
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                Privacy
              </Link>
            </li>
            <li>
              <Link
                href="/privacy/do-not-sell"
                className="text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                Do Not Sell or Share My Personal Information
              </Link>
            </li>
            <li>
              <Link href="/security" className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                Security
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-[var(--fg-subtle)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>© {new Date().getFullYear()} Dunamis Studios. All rights reserved.</div>
          <div className="font-mono tracking-tight">
            δύναμις · <span className="text-[var(--fg-muted)]">power, capability, potential</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
