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
        {/* PWA icons + apple touch icon. The /icon-NNN routes are dynamic
            handlers returning PNG; we wire them up explicitly because
            the app/icon.tsx convention hits a known Windows build bug
            in @vercel/og. */}
        <link rel="icon" href="/icon-192" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-192" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Mismatched" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1C1B19" />
        {/* Capture Chrome's install prompt as early as possible. Chrome
            fires beforeinstallprompt once, sometimes before React has
            hydrated; without this we'd miss it. The Join Now buttons
            read window.__mismatchedInstallPrompt and trigger it on
            user tap so install happens before sign-in. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.__mismatchedInstallPrompt=null;" +
              "window.addEventListener('beforeinstallprompt',function(e){" +
              "  e.preventDefault();" +
              "  window.__mismatchedInstallPrompt=e;" +
              "});" +
              "window.addEventListener('appinstalled',function(){" +
              "  window.__mismatchedInstallPrompt=null;" +
              "});"
          }}
        />
      </head>
      <body className="min-h-screen bg-bone text-ink antialiased">{children}</body>
    </html>
  );
}
