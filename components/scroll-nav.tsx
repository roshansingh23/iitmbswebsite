"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Always visible. Transparent over the hero, switches to a solid white bar
// with a hairline shadow once the user has scrolled past the hero.
export function ScrollNav() {
  const [past, setPast] = useState(false);

  useEffect(() => {
    function onScroll() {
      // The hero is 100vh; flip when ~85% of it has passed so the change
      // happens just before the next section's top edge arrives.
      const trigger = window.innerHeight * 0.85;
      setPast(window.scrollY > trigger);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "fixed top-0 inset-x-0 z-50 transition-colors duration-300 ease-out " +
        (past
          ? "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          : "bg-transparent")
      }
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-20 grid grid-cols-3 items-center">
        <Link
          href="#how"
          className="justify-self-start text-sm font-medium hover:opacity-70 transition-opacity"
        >
          How it works
        </Link>
        <Link
          href="/"
          className="justify-self-center font-extrabold text-2xl tracking-[-0.04em]"
        >
          Hooked.
        </Link>
        <div className="justify-self-end flex items-center gap-5">
          <Link
            href="/login"
            className="hidden sm:inline text-sm font-medium hover:opacity-70 transition-opacity"
          >
            Sign in
          </Link>
          <Link href="/login" className="btn-ink">Get the app</Link>
        </div>
      </div>
    </header>
  );
}
