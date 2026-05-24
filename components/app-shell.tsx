"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Mobile-only shell. NO top bar. Only a black bottom nav with icons.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 mx-auto w-full max-w-md pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}

const TABS = [
  { href: "/discover", label: "Discover", icon: DiscoverIcon },
  { href: "/hooks", label: "Hooks", icon: StarIcon },
  { href: "/matches", label: "Chats", icon: HeartIcon },
  { href: "/confessions", label: "Spill", icon: ChatIcon },
  { href: "/me", label: "You", icon: PersonIcon }
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
            const Icon = t.icon;
            const active = path === t.href || path.startsWith(`${t.href}/`);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-label={t.label}
                  className={
                    "flex items-center justify-center py-4 transition-opacity " +
                    (active ? "text-white" : "text-white/40 hover:text-white/70")
                  }
                >
                  <Icon />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

function DiscoverIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2 L13.5 8 L20 9 L13.5 10 L12 16 L10.5 10 L4 9 L10.5 8 Z" />
      <path d="M19 17 L19.5 19 L21.5 19.5 L19.5 20 L19 22 L18.5 20 L16.5 19.5 L18.5 19 Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2 L14.4 8.6 L21.5 9.2 L16.2 13.8 L17.8 21 L12 17.3 L6.2 21 L7.8 13.8 L2.5 9.2 L9.6 8.6 Z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}
