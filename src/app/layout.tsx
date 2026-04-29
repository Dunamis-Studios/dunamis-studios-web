import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { JsonLd } from "@/components/seo/json-ld";
import "./globals.css";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

/**
 * Organization schema — emitted into <head> on every page so search
 * engines and LLM crawlers can attach entity signals (founder, support
 * contact, logo) to the Dunamis Studios brand regardless of which URL
 * is crawled first.
 */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  // Stable @id so other schema blocks (e.g., the WebSite block on /
  // and the Article publisher field) can cross-reference this entity
  // by URI fragment instead of repeating its full definition.
  "@id": `${SITE_URL}/#organization`,
  name: "Dunamis Studios",
  url: SITE_URL,
  logo: `${SITE_URL}/icon`,
  description:
    "Dunamis Studios builds focused, reliable apps for the HubSpot marketplace.",
  sameAs: ["https://www.linkedin.com/company/dunamis-studios/"],
  foundingDate: "2026",
  founder: {
    "@type": "Person",
    name: "Joshua Bradford",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@dunamisstudios.net",
    contactType: "customer support",
  },
};

const sans = Geist({ subsets: ["latin"], variable: "--font-sans-src" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono-src" });
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-src",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "Dunamis Studios — Precision tools for the HubSpot marketplace",
    template: "%s · Dunamis Studios",
  },
  description:
    "Focused, reliable apps for the HubSpot marketplace. Built by a team that uses HubSpot every day. Home of Debrief and Property Pulse.",
  applicationName: "Dunamis Studios",
  authors: [{ name: "Dunamis Studios" }],
  metadataBase: new URL(
    process.env.APP_URL ?? "https://dunamisstudios.net",
  ),
  openGraph: {
    title: "Dunamis Studios — Precision tools for the HubSpot marketplace",
    description:
      "Focused, reliable apps for the HubSpot marketplace. Built by a team that uses HubSpot every day. Home of Debrief and Property Pulse.",
    type: "website",
    url: "/",
    siteName: "Dunamis Studios",
    // og:image meta tags are emitted by the file-convention route
    // src/app/opengraph-image.tsx. Declaring an explicit images array
    // here caused Next's metadata resolver to drop og:image entirely
    // while keeping twitter:image (the two merge paths conflicted).
    // Single source of truth: the file-convention route.
  },
  twitter: {
    card: "summary_large_image",
    title: "Dunamis Studios — Precision tools for the HubSpot marketplace",
    description:
      "Focused, reliable apps for the HubSpot marketplace. Built by a team that uses HubSpot every day. Home of Debrief and Property Pulse.",
    // twitter:image meta tags come from src/app/twitter-image.tsx's
    // file convention, same rationale as openGraph above.
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} ${display.variable}`}
    >
      <head>
        {/* Avoid flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('dunamis-theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches;var d=t? t==='dark' : true;if(d)document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
        <JsonLd id="jsonld-organization" schema={organizationSchema} />
        <meta
          name="p:domain_verify"
          content="530ebe035dc8f3e8ae2cfc6b43aa2f96"
        />
        {/* Start of HubSpot Embed Code */}
        <script
          type="text/javascript"
          id="hs-script-loader"
          async
          defer
          src="//js.hs-scripts.com/20867488.js"
        ></script>
        {/* End of HubSpot Embed Code */}
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
