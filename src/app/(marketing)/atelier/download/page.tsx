import type { Metadata } from "next";
import Link from "next/link";
import { Download, Shield, ArrowRight } from "lucide-react";

import { Container, Section } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Download Atelier",
  description:
    "Download the Atelier installer for Windows. Verify with SHA-256 if you want belt-and-suspenders integrity before running the unsigned binary.",
  alternates: {
    canonical: "https://dunamisstudios.net/atelier/download",
  },
};

// Cache the GitHub Releases lookup for an hour. A new release happens
// far less often than that, and this page is a marketing surface — a
// stale-by-an-hour download link is fine, a stale-by-a-day one isn't.
export const revalidate = 3600;

interface GithubReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
  digest?: string | null;
}

interface GithubReleaseSummary {
  tag_name: string;
  name: string | null;
  published_at: string;
  html_url: string;
  body: string | null;
  assets: GithubReleaseAsset[];
}

const REPO = "Dunamis-Studios/atelier";

/**
 * Fetch the latest GitHub Release for Atelier. Returns null on any
 * failure (rate limit, repo private, network) so the page can render
 * a degraded "go straight to GitHub" fallback. We never throw — the
 * download page must always render something usable, even with the
 * release API momentarily unreachable.
 */
async function fetchLatestRelease(): Promise<GithubReleaseSummary | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "dunamisstudios-site",
        },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as GithubReleaseSummary;
    return data;
  } catch {
    return null;
  }
}

/**
 * Locate the .exe installer asset in the release's asset list.
 * Convention is Atelier-Setup-{version}.exe — see the release-pipeline
 * notes in atelier/README.md and the WORKFLOW at .github/workflows/
 * release.yml. We match by suffix to tolerate version-string drift.
 */
function findInstallerAsset(
  release: GithubReleaseSummary,
): GithubReleaseAsset | null {
  return (
    release.assets.find(
      (a) => a.name.startsWith("Atelier-Setup-") && a.name.endsWith(".exe"),
    ) ?? null
  );
}

/**
 * Locate a SHA-256 sidecar asset (Atelier-Setup-{version}.exe.sha256
 * or .sha256.txt) in the release. Today the release pipeline doesn't
 * emit one — this returns null and the checksum block degrades to a
 * "verify yourself" hint. The moment the pipeline starts publishing a
 * sidecar file, this lights up automatically.
 */
function findChecksumAsset(
  release: GithubReleaseSummary,
): GithubReleaseAsset | null {
  return (
    release.assets.find(
      (a) =>
        (a.name.startsWith("Atelier-Setup-") &&
          (a.name.endsWith(".exe.sha256") ||
            a.name.endsWith(".exe.sha256.txt"))) ||
        a.name.toLowerCase() === "sha256sums.txt",
    ) ?? null
  );
}

/**
 * GitHub's release-asset API exposes a `digest` field on each asset
 * for releases pushed via the modern uploader. When present it's a
 * `"sha256:<hex>"` string. Best-effort — older releases lack it and
 * we degrade to a published-sidecar lookup or a self-verify hint.
 */
function digestFromAsset(asset: GithubReleaseAsset | null): string | null {
  if (!asset?.digest) return null;
  if (asset.digest.startsWith("sha256:")) return asset.digest.slice(7);
  return null;
}

/**
 * If the release publishes a SHA-256 sidecar, fetch it and return the
 * raw hex string. Sidecar files are typically a single line of hex,
 * sometimes followed by ` *Atelier-Setup-{version}.exe`; we strip
 * everything after the first whitespace.
 */
async function fetchChecksumFromSidecar(
  asset: GithubReleaseAsset | null,
): Promise<string | null> {
  if (!asset) return null;
  try {
    const res = await fetch(asset.browser_download_url, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    const first = text.split(/\s+/)[0];
    if (!first || !/^[0-9a-f]{64}$/i.test(first)) return null;
    return first.toLowerCase();
  } catch {
    return null;
  }
}

function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

export default async function AtelierDownloadPage() {
  const release = await fetchLatestRelease();
  const installer = release ? findInstallerAsset(release) : null;
  const sidecar = release ? findChecksumAsset(release) : null;
  const checksumFromDigest = digestFromAsset(installer);
  const checksumFromSidecar = await fetchChecksumFromSidecar(sidecar);
  const checksum = checksumFromDigest ?? checksumFromSidecar;

  return (
    <div className="lane-atelier">
      <Section className="pt-12">
        <Container size="md">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Download
          </p>
          <h1 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Atelier for Windows
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--fg-muted)]">
            The installer is a single `.exe` produced by Inno Setup. After
            install, paste the license key from your purchase email to
            activate. Detailed setup instructions live in the{" "}
            <Link
              href="/build-services/products/atelier/docs/install"
              className="underline decoration-dotted underline-offset-2 hover:text-[var(--fg)]"
            >
              install guide
            </Link>
            .
          </p>

          {release && installer ? (
            <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                    Latest release
                  </div>
                  <div className="mt-2 font-[var(--font-display)] text-2xl font-medium tracking-tight">
                    Atelier {release.tag_name.replace(/^v/, "")}
                  </div>
                  <div className="mt-1 text-xs text-[var(--fg-muted)]">
                    Published {formatDate(release.published_at)} ·{" "}
                    {formatBytes(installer.size)} ·{" "}
                    <Link
                      href={release.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-dotted underline-offset-2 hover:text-[var(--fg)]"
                    >
                      Release notes on GitHub
                    </Link>
                  </div>
                </div>
                <Button asChild size="lg">
                  <a href={installer.browser_download_url}>
                    <Download className="h-4 w-4" aria-hidden />
                    Download {installer.name}
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <Download
                  className="mt-1 h-5 w-5 text-[var(--fg-muted)]"
                  aria-hidden
                />
                <div>
                  <div className="font-medium">
                    Direct download is unavailable right now.
                  </div>
                  <p className="mt-1 text-sm text-[var(--fg-muted)]">
                    The latest installer is published as a release on GitHub.
                    Open the releases page directly:
                  </p>
                  <Button asChild variant="secondary" className="mt-3">
                    <Link
                      href={`https://github.com/${REPO}/releases/latest`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Atelier releases on GitHub
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Container>
      </Section>

      <Section
        id="checksum"
        className="border-t border-[var(--border)] scroll-mt-24"
      >
        <Container size="md">
          <div className="flex items-start gap-3">
            <Shield
              className="mt-1 h-5 w-5 text-[var(--fg-muted)]"
              aria-hidden
            />
            <div>
              <h2 className="font-[var(--font-display)] text-2xl font-medium tracking-tight">
                Verify the binary (optional)
              </h2>
              <p className="mt-2 max-w-2xl text-[var(--fg-muted)]">
                Atelier is not code-signed in v1 — see{" "}
                <Link
                  href="/build-services/products/atelier/docs/install#smartscreen-warning"
                  className="underline decoration-dotted underline-offset-2 hover:text-[var(--fg)]"
                >
                  install § SmartScreen
                </Link>{" "}
                for why. If you&apos;d rather not run an unsigned binary on
                trust alone, verify the SHA-256 digest of your downloaded
                file against the value below.
              </p>

              {checksum && installer ? (
                <div className="mt-5 space-y-3">
                  <div className="rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-sm">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--fg-subtle)]">
                      SHA-256
                    </div>
                    <code className="mt-1 block break-all font-mono text-xs text-[var(--fg)]">
                      {checksum}
                    </code>
                    <div className="mt-1 text-xs text-[var(--fg-subtle)]">
                      For {installer.name}
                    </div>
                  </div>
                  <div className="rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-sm">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--fg-subtle)]">
                      Verify (PowerShell)
                    </div>
                    <pre className="mt-1 overflow-x-auto rounded bg-[var(--bg-muted)] p-2 font-mono text-xs">
                      <code>{`Get-FileHash -Algorithm SHA256 .\\${installer.name}`}</code>
                    </pre>
                    <p className="mt-1 text-xs text-[var(--fg-muted)]">
                      The hash output should match the value above byte-for-
                      byte. If it doesn&apos;t, do not run the binary — re-
                      download from this page or open a support ticket at{" "}
                      <a
                        href="mailto:legal@dunamisstudios.net"
                        className="underline decoration-dotted underline-offset-2 hover:text-[var(--fg)]"
                      >
                        legal@dunamisstudios.net
                      </a>
                      .
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-md border border-[var(--color-warning)]/40 bg-[color-mix(in_oklch,var(--color-warning)_8%,var(--bg-elevated))] p-3 text-sm">
                  <div className="font-medium">
                    SHA-256 not yet published for this release.
                  </div>
                  <p className="mt-1 text-xs text-[var(--fg-muted)]">
                    A future release will publish a sidecar checksum file
                    alongside the installer; this section will surface it
                    automatically once that ships. In the meantime, you can
                    compute the hash yourself with{" "}
                    <code className="rounded bg-[var(--bg-muted)] px-1 text-[11px]">
                      Get-FileHash -Algorithm SHA256 .\Atelier-Setup-*.exe
                    </code>{" "}
                    and email the result to{" "}
                    <a
                      href="mailto:legal@dunamisstudios.net"
                      className="underline decoration-dotted underline-offset-2 hover:text-[var(--fg)]"
                    >
                      legal@dunamisstudios.net
                    </a>{" "}
                    for cross-check.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
