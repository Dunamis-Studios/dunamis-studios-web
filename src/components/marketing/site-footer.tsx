import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-subtle)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2.5 text-[var(--fg)]">
            <LogoMark size={22} />
            <span className="font-[var(--font-display)] text-lg font-medium tracking-tight">
              Dunamis Studios
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-[var(--fg-muted)]">
            Focused, reliable apps for the HubSpot marketplace.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Products
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/products" className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                Products
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                Pricing
              </Link>
            </li>
            <li>
              <Link
                href="/custom-development"
                className="text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                Custom Development
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Resources
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/articles" className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                Articles
              </Link>
            </li>
            <li>
              <Link href="/guides" className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                Guides
              </Link>
            </li>
            <li>
              <Link href="/help" className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                Help center
              </Link>
            </li>
            <li>
              <a
                href="mailto:hello@dunamisstudios.net"
                className="text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                Contact
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Legal
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
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
