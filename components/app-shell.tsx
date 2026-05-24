"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Bookmark, MessageSquareText, Quote, CircleUser } from "lucide-react";

// Mobile-only shell. No top bar. Black bottom nav with crisp icons from
// lucide-react (open-source, MIT) — refined strokes, optical sizing.

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 mx-auto w-full max-w-md pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}

const TABS = [
  { href: "/discover",    label: "Discover", Icon: Compass },
  { href: "/hooks",       label: "Matches",  Icon: Bookmark },
  { href: "/matches",     label: "Chats",    Icon: MessageSquareText },
  { href: "/confessions", label: "Spill",    Icon: Quote },
  { href: "/me",          label: "You",      Icon: CircleUser }
];

function BottomNav() {
  const path = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30"
      style={{
        background: "#0a0a0a",
        paddingBottom: "env(safe-area-inset-bottom)"
      }}
    >
      <div className="mx-auto max-w-md">
        <ul className="grid grid-cols-5">
          {TABS.map((t) => {
            const active = path === t.href || path.startsWith(`${t.href}/`);
            const Icon = t.Icon;
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-label={t.label}
                  className={
                    "flex items-center justify-center py-4 transition-opacity " +
                    (active ? "text-white" : "text-white/45 hover:text-white/75")
                  }
                >
                  <Icon size={24} strokeWidth={1.75} />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
