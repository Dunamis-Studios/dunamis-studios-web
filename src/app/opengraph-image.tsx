import { ImageResponse } from "next/og";

// Dynamic render — @vercel/og's font resolution hits a
// fileURLToPath(...) bug on Windows prerender. Dynamic rendering
// dodges the static-export path and behaves identically on Linux
// production builds.
export const dynamic = "force-dynamic";

export const alt =
  "Dunamis Studios — Precision tools for the HubSpot marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background:
            "radial-gradient(ellipse 80% 60% at 30% 25%, #3b2f7a 0%, #0a0a0a 70%)",
          color: "#eaeaea",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Logo mark */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
            <circle
              cx="16"
              cy="16"
              r="13"
              stroke="#eaeaea"
              strokeWidth="1.75"
              opacity="0.3"
            />
            <path
              d="M16 3 A13 13 0 0 0 16 29"
              stroke="#eaeaea"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="22" cy="10" r="2" fill="#eaeaea" />
          </svg>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            Dunamis Studios
          </span>
        </div>

        <div
          style={{
            marginTop: "72px",
            fontSize: "92px",
            lineHeight: 1.05,
            fontWeight: 500,
            letterSpacing: "-0.035em",
            maxWidth: "900px",
          }}
        >
          Precision tools for{" "}
          <span style={{ color: "#a89bff", fontStyle: "italic" }}>HubSpot</span>
          .
        </div>

        <div
          style={{
            marginTop: "40px",
            fontSize: "30px",
            color: "#a1a1a1",
            maxWidth: "860px",
            lineHeight: 1.4,
          }}
        >
          Focused, reliable apps for the HubSpot marketplace. Built by a team
          that uses HubSpot every day.
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "60px",
            left: "80px",
            fontSize: "22px",
            color: "#888",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          dunamisstudios.net
        </div>
      </div>
    ),
    { ...size },
  );
}
