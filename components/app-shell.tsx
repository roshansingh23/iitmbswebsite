"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Bookmark, MessageSquareText, Quote, CircleUser } from "lucide-react";
import { ChatListPanel } from "@/components/chat-list-panel";

// Mobile: black bottom bar with five icon tabs (Discover, Matches, Chats,
// Spill, You).
// md+: floating vertical pill on the left with four tabs (Chats is dropped
// because lg+ shows a permanent chat list panel right next to the sidebar).
// lg+: chat list panel renders alongside the sidebar — picking a chat opens
// it in the main area.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 mx-auto w-full max-w-md pb-24 md:pb-6 lg:mx-0 lg:ml-[440px] xl:mx-auto">
        {children}
      </main>
      <SideNav />
      <ChatListPanel />
    </div>
  );
}

const MOBILE_TABS = [
  { href: "/discover",    label: "Discover", Icon: Compass },
  { href: "/hooks",       label: "Matches",  Icon: Bookmark },
  { href: "/matches",     label: "Chats",    Icon: MessageSquareText },
  { href: "/confessions", label: "Spill",    Icon: Quote },
  { href: "/me",          label: "You",      Icon: CircleUser }
];

// Desktop sidebar has no Chats tab — the chat list panel is permanent.
const DESKTOP_TABS = [
  { href: "/discover",    label: "Discover", Icon: Compass },
  { href: "/hooks",       label: "Matches",  Icon: Bookmark },
  { href: "/confessions", label: "Spill",    Icon: Quote },
  { href: "/me",          label: "You",      Icon: CircleUser }
];

function SideNav() {
  const path = usePathname();
  return (
    <>
      {/* Mobile bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30"
        style={{
          background: "#0a0a0a",
          paddingBottom: "env(safe-area-inset-bottom)"
        }}
      >
        <div className="mx-auto max-w-md">
          <ul className="grid grid-cols-5">
            {MOBILE_TABS.map((t) => {
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

      {/* Desktop floating vertical sidebar */}
      <nav
        className="hidden md:flex fixed top-1/2 -translate-y-1/2 left-5 z-30 flex-col gap-1 p-2 rounded-2xl"
        style={{
          background: "#0a0a0a",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)"
        }}
        aria-label="Primary"
      >
        {DESKTOP_TABS.map((t) => {
          const active = path === t.href || path.startsWith(`${t.href}/`);
          const Icon = t.Icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-label={t.label}
              className="group relative w-12 h-12 flex items-center justify-center rounded-xl transition-colors hover:bg-white/5"
            >
              <Icon
                size={22}
                strokeWidth={1.85}
                className={
                  active
                    ? "text-white"
                    : "text-white/55 group-hover:text-white transition-colors"
                }
              />
              <span
                className="
                  absolute left-full top-1/2 -translate-y-1/2 ml-3
                  px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap text-white
                  opacity-0 -translate-x-2
                  group-hover:opacity-100 group-hover:translate-x-0
                  transition-all duration-200 ease-out
                  pointer-events-none
                "
                style={{
                  background: "#0a0a0a",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.18)"
                }}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
