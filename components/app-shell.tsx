import Link from "next/link";

// Minimal app chrome: hairline top bar + bottom nav on mobile, side rail on
// desktop. No logos. No icons except the three approved actions.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="flex-1 flex">
        <aside className="hidden md:block w-56 border-r border-hairline">
          <SideNav />
        </aside>
        <main className="flex-1 min-w-0 pb-24 md:pb-0">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}

function TopBar() {
  return (
    <header className="border-b border-hairline bg-bone">
      <div className="mx-auto max-w-6xl px-6 lg:px-10 h-14 flex items-center justify-between">
        <Link href="/discover" className="serif italic text-xl tracking-tight">— dating</Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted">
          <Link href="/me" className="hover:text-ink">Profile</Link>
          <Link href="/upgrade" className="hover:text-ink">Upgrade</Link>
        </nav>
      </div>
    </header>
  );
}

const links = [
  { href: "/discover", label: "Discover" },
  { href: "/hooks", label: "Hooks" },
  { href: "/matches", label: "Hooked" },
  { href: "/confessions", label: "Confessions" },
  { href: "/me", label: "Profile" }
];

function SideNav() {
  return (
    <nav className="py-10 px-7 flex flex-col gap-1 text-sm">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="py-2 hover:text-ink text-muted">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

function MobileNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 md:hidden border-t border-hairline bg-bone/95 backdrop-blur z-30">
      <ul className="grid grid-cols-5 text-[0.65rem] uppercase tracking-[0.18em] text-muted">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex items-center justify-center py-3 hover:text-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
