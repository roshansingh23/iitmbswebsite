"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Mobile-first chrome — and mobile-ONLY. The whole signed-in app is locked
// to a mobile-width container at every viewport so that "Request desktop
// site" mode in mobile browsers doesn't flip the layout (which previously
// caused both a visual desktop-view jump after login AND, on some browsers,
// a cookie-isolation-driven apparent logout when toggling back to mobile).
//
// No md:/lg: breakpoints anywhere — same layout on a phone, a tablet, or
// when a desktop browser opens the URL.

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <main className="flex-1 mx-auto w-full max-w-md pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="mx-auto max-w-md px-5 h-16 flex items-center justify-between">
        <Link href="/discover" className="font-extrabold text-2xl tracking-[-0.04em]">
          Hooked.
        </Link>
        <Link
          href="/me"
          className="text-sm font-semibold underline-offset-4"
          aria-label="Profile"
        >
          {/* compact menu indicator on the right */}
          <span aria-hidden className="block text-2xl leading-none">·</span>
        </Link>
      </div>
    </header>
  );
}

const TABS = [
  { href: "/discover",    label: "Discover" },
  { href: "/hooks",       label: "Hooks" },
  { href: "/matches",     label: "Chats" },
  { href: "/confessions", label: "Spill" },
  { href: "/me",          label: "You" }
];

function BottomNav() {
  const path = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-white z-30"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto max-w-md border-t border-hairline">
        <ul className="grid grid-cols-5">
          {TABS.map((t) => {
            const active = path === t.href || path.startsWith(`${t.href}/`);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className={
                    "flex flex-col items-center justify-center gap-1 py-3 text-[0.65rem] uppercase tracking-[0.18em] font-semibold transition-colors " +
                    (active ? "text-ink" : "text-muted")
                  }
                >
                  <Dot active={active} />
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

function Dot({ active }: { active: boolean }) {
  return (
    <span
      className={
        "block w-1.5 h-1.5 rounded-full transition-colors " +
        (active ? "bg-ink" : "bg-hairline")
      }
    />
  );
}
