"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Mobile-first shell for the signed-in app. Same brand chrome as the marketing
// homepage so the transition after login doesn't feel like jumping to a
// different product. Single sticky top bar; bottom tab strip only on mobile.

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <main className="flex-1 min-w-0 pb-24 md:pb-12">{children}</main>
      <BottomNav />
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="mx-auto max-w-3xl md:max-w-5xl px-5 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link
          href="/discover"
          className="font-extrabold text-2xl tracking-[-0.04em]"
        >
          Hooked.
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted">
          <DesktopLink href="/discover">Discover</DesktopLink>
          <DesktopLink href="/hooks">Hooks</DesktopLink>
          <DesktopLink href="/matches">Hooked</DesktopLink>
          <DesktopLink href="/confessions">Confessions</DesktopLink>
          <DesktopLink href="/me">Profile</DesktopLink>
        </nav>
      </div>
    </header>
  );
}

function DesktopLink({ href, children }: { href: string; children: React.ReactNode }) {
  const path = usePathname();
  const active = path === href || path.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={
        "transition-colors " +
        (active ? "text-ink" : "hover:text-ink")
      }
    >
      {children}
    </Link>
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
      className="md:hidden fixed bottom-0 inset-x-0 bg-white z-30"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="border-t border-hairline">
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
