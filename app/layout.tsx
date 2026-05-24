import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"]
});

// Transitional serif used only where editorial weight is needed — namely the
// big statement section on the landing page. Rest of the site stays in Inter.
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-display-serif",
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"]
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Mismatched. — a quieter dating app", template: "%s · Mismatched." },
  description: "Prompts over poses, match requests over swipes, conversations that don't time out on you.",
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <head>
        {/* Suppress Chrome's "Add to Home screen" / install banner.
            Some users were getting an install prompt after tapping Join
            Now and reading it as a download. We don't ship a manifest,
            but Chrome can still show the mini-infobar from engagement
            heuristics — preventDefault'ing the event hides it. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();},{passive:false});"
          }}
        />
      </head>
      <body className="min-h-screen bg-bone text-ink antialiased">{children}</body>
    </html>
  );
}
