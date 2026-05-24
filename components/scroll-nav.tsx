"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Always visible. Transparent over the hero, switches to solid white once
// the user has scrolled past the hero. No bottom border, no shadow.
export function ScrollNav() {
  const [past, setPast] = useState(false);

  useEffect(() => {
    function onScroll() {
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
        (past ? "bg-white" : "bg-transparent")
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
          <Link href="/login" className="btn-ink">Get the app</Link>
        </div>
      </div>
    </header>
  );
}
