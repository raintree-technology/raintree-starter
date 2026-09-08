import "server-only";
import { ImageResponse } from "next/og";
import { site } from "@/lib/discovery";

export const ogImageSize = {
  width: 1200,
  height: 630,
} as const;

export const ogImageContentType = "image/png";

type OgImageOptions = {
  title: string;
  description: string;
  eyebrow?: string;
  footer?: string[];
};

export function createOgImage({
  title,
  description,
  eyebrow = site.name,
  footer = [],
}: OgImageOptions): ImageResponse {
  const titleSize = title.length > 46 ? 60 : 72;

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        background: "#fafafa",
        padding: "72px",
        color: "#18181b",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          fontSize: 36,
          fontWeight: 700,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "#18181b",
            color: "#fafafa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg aria-hidden="true" width="44" height="44" viewBox="0 0 64 64">
            <path
              d="M32 6 51 29h-8l14 17H38v12H26V46H7l14-17h-8L32 6Zm0 18-7 9 7 9 7-9-7-9Z"
              fill="#fafafa"
              fillRule="evenodd"
              transform="rotate(180 32 32)"
            />
          </svg>
        </div>
        {eyebrow}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 700,
            maxWidth: 930,
            lineHeight: 1.04,
            letterSpacing: 0,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 30,
            color: "#52525b",
            maxWidth: 920,
            lineHeight: 1.35,
          }}
        >
          {description}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 16,
          color: "#52525b",
          fontSize: 24,
          fontWeight: 600,
        }}
      >
        {footer.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>,
    ogImageSize,
  );
}
