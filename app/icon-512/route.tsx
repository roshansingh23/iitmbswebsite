import { ImageResponse } from "next/og";

export const runtime = "edge";

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
          fontSize: 300,
          fontWeight: 800,
          letterSpacing: "-0.06em",
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}
      >
        M.
      </div>
    ),
    { width: 512, height: 512 }
  );
}
