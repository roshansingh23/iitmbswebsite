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
      <body className="min-h-screen bg-bone text-ink antialiased">{children}</body>
    </html>
  );
}
