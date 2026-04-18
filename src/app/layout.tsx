import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

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
    default: "Dunamis Studios — Precision tools for HubSpot",
    template: "%s · Dunamis Studios",
  },
  description:
    "Dunamis Studios builds focused, reliable apps for the HubSpot marketplace. Home of Property Pulse and Debrief.",
  applicationName: "Dunamis Studios",
  authors: [{ name: "Dunamis Studios" }],
  metadataBase: new URL(
    process.env.APP_URL ?? "https://dunamisstudios.net",
  ),
  openGraph: {
    title: "Dunamis Studios — Precision tools for HubSpot",
    description:
      "Focused, reliable apps for the HubSpot marketplace. Home of Property Pulse and Debrief.",
    type: "website",
    url: "/",
    siteName: "Dunamis Studios",
  },
  twitter: { card: "summary_large_image" },
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
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
