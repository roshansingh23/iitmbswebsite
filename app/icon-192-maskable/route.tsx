import { ImageResponse } from "next/og";

export const runtime = "edge";

// Maskable variant — the "M." sits inside the safe zone (inner 80%) so
// Android can crop it to a circle / squircle without clipping the glyph.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1C1B19",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 84,
          fontWeight: 800,
          letterSpacing: "-0.06em",
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}
      >
        M.
      </div>
    ),
    { width: 192, height: 192 }
  );
}
