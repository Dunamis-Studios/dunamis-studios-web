import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // No border-radius — iOS applies its own squircle mask.
          background:
            "radial-gradient(circle at 30% 30%, #3b2f7a 0%, #0a0a0a 70%)",
        }}
      >
        <svg width="130" height="130" viewBox="0 0 32 32" fill="none">
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="#eaeaea"
            strokeWidth="1.75"
            opacity="0.35"
          />
          <path
            d="M16 3 A13 13 0 0 0 16 29"
            stroke="#eaeaea"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="22" cy="10" r="2.4" fill="#a89bff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
