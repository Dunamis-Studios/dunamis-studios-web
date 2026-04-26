import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getPost } from "@/lib/content";
import type { ContentType } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> },
) {
  const { type, slug } = await params;
  const contentType = type as ContentType;

  if (contentType !== "guide" && contentType !== "article") {
    return new Response("Not found", { status: 404 });
  }

  const post = await getPost(contentType, slug);
  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  const typeLabel = contentType === "guide" ? "Guide" : "Article";

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
        {/* Top: Dunamis Studios branding */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "80px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "16px",
            opacity: 0.7,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
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
          <span>Dunamis Studios</span>
        </div>

        {/* Type label */}
        <div
          style={{
            fontSize: "18px",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            opacity: 0.6,
            marginBottom: "16px",
          }}
        >
          {typeLabel}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: post.title.length > 60 ? "42px" : "52px",
            fontWeight: 600,
            lineHeight: 1.15,
            maxWidth: "900px",
            letterSpacing: "-0.02em",
          }}
        >
          {post.title}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
