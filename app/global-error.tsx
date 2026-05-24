"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          minHeight: "100vh",
          background: "#fff",
          color: "#1C1B19",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "4rem 1.5rem",
          margin: 0
        }}
      >
        <div style={{ maxWidth: "32rem", margin: "0 auto" }}>
          <p
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#6A6358",
              fontWeight: 600
            }}
          >
            Something broke
          </p>
          <h1
            style={{
              fontSize: "3rem",
              fontWeight: 800,
              letterSpacing: "-0.045em",
              lineHeight: 1.02,
              marginTop: "1rem"
            }}
          >
            We hit a snag.
          </h1>
          <p style={{ marginTop: "1.5rem", color: "#6A6358", lineHeight: 1.6 }}>
            Try the page again. If it keeps failing, the server logs will say
            why — common cause is a missing env var on the deployment.
          </p>
          {error?.digest && (
            <p style={{ marginTop: "1rem", fontFamily: "ui-monospace, monospace", fontSize: "0.85rem", color: "#6A6358" }}>
              digest: {error.digest}
            </p>
          )}
          <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem" }}>
            <button
              onClick={reset}
              style={{
                background: "#1C1B19",
                color: "#fff",
                padding: "0.85rem 1.5rem",
                borderRadius: "999px",
                border: 0,
                fontSize: "0.78rem",
                letterSpacing: "0.06em",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: "0.85rem 1.5rem",
                borderRadius: "999px",
                border: "1px solid #1C1B19",
                color: "#1C1B19",
                fontSize: "0.78rem",
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
