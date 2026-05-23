"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Hidden at top of page, slides in once the viewer has scrolled past ~60%
// of the first viewport (i.e. they're past the hero).
export function ScrollNav() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    function onScroll() {
      const trigger = window.innerHeight * 0.6;
      setShown(window.scrollY > trigger);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "fixed top-0 inset-x-0 z-50 bg-white transition-transform duration-300 ease-out " +
        (shown ? "translate-y-0" : "-translate-y-full")
      }
      aria-hidden={!shown}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-20 grid grid-cols-3 items-center">
        <Link
          href="#how"
          className="justify-self-start text-sm font-medium hover:text-muted transition-colors"
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
            className="hidden sm:inline text-sm font-medium hover:text-muted transition-colors"
          >
            Sign in
          </Link>
          <Link href="/login" className="btn-ink">Get the app</Link>
        </div>
      </div>
    </header>
  );
}
