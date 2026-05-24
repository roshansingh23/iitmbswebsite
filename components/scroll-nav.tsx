"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function ScrollNav() {
  const [past, setPast] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      const trigger = window.innerHeight * 0.85;
      setPast(window.scrollY > trigger);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Close drawer on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navBg = (past || menuOpen) ? "bg-white" : "bg-transparent";

  return (
    <>
      <header
        className={
          "fixed top-0 inset-x-0 z-50 transition-colors duration-300 ease-out " + navBg
        }
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-10 h-20 grid grid-cols-3 items-center">
          {/* Left slot: hamburger on mobile, "How it works" on desktop */}
          <div className="justify-self-start flex items-center">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="md:hidden -ml-2 p-2 text-ink"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>
            <Link
              href="#how"
              className="hidden md:inline text-sm font-medium hover:opacity-70 transition-opacity"
            >
              How it works
            </Link>
          </div>

          <Link
            href="/"
            className="justify-self-center font-extrabold text-2xl md:text-3xl tracking-[-0.04em]"
          >
            Mismatched.
          </Link>

          <div className="justify-self-end">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-ink text-white rounded-full font-semibold transition hover:opacity-90 whitespace-nowrap"
              style={{
                padding: "0.6rem 1.1rem",
                fontSize: "0.72rem",
                letterSpacing: "0.06em"
              }}
            >
              Join now
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile drawer — full-screen black panel sliding in from the right */}
      <div
        className={
          "md:hidden fixed inset-0 z-[60] transition-opacity duration-300 " +
          (menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")
        }
        aria-hidden={!menuOpen}
      >
        <div
          className="absolute inset-0"
          style={{ background: "#0a0a0a", color: "#fff" }}
          onClick={(e) => { if (e.target === e.currentTarget) setMenuOpen(false); }}
        >
          <div className="h-20 px-6 flex items-center justify-between">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="font-extrabold text-xl tracking-[-0.04em] text-white"
            >
              Mismatched.
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="-mr-2 p-2 text-white"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          </div>

          <nav className="px-6 pt-10 flex flex-col gap-7">
            <DrawerLink href="#how" onClick={() => setMenuOpen(false)}>
              How it works
            </DrawerLink>
            <DrawerLink href="#prompts" onClick={() => setMenuOpen(false)}>
              Prompts
            </DrawerLink>
            <DrawerLink href="#voices" onClick={() => setMenuOpen(false)}>
              Voices
            </DrawerLink>
            <DrawerLink href="/login" onClick={() => setMenuOpen(false)}>
              Sign in
            </DrawerLink>
          </nav>

          <div className="px-6 mt-12">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center justify-center w-full bg-white text-black py-4 rounded-full font-semibold text-sm tracking-[0.06em] hover:opacity-90 transition"
            >
              Join now
            </Link>
          </div>

          <div
            className="absolute bottom-8 left-6 right-6 text-xs"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            © {new Date().getFullYear()} Mismatched.
          </div>
        </div>
      </div>
    </>
  );
}

function DrawerLink({
  href, children, onClick
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-3xl font-extrabold tracking-[-0.03em] text-white hover:opacity-70 transition-opacity"
    >
      {children}
    </Link>
  );
}

function HamburgerIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
      <path d="M3 7h20M3 13h20M3 19h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
      <path d="M6 6l14 14M6 20L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
