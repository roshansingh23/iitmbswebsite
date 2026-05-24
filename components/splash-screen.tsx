"use client";

import { useEffect, useState } from "react";

// Full-screen black splash shown once per session on app open. The
// OS-native PWA splash (icon + app name on the manifest background_color)
// flashes briefly first; this overlay then renders the brand + tagline
// in the same color so they blend into one cohesive opening.
export function SplashScreen() {
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("mm_splash_shown")) return;
    sessionStorage.setItem("mm_splash_shown", "1");
    setShow(true);

    const fade = setTimeout(() => setFading(true), 1300);
    const hide = setTimeout(() => setShow(false), 1800);
    return () => {
      clearTimeout(fade);
      clearTimeout(hide);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none transition-opacity duration-500 ease-out"
      style={{
        background: "#0a0a0a",
        opacity: fading ? 0 : 1
      }}
      aria-hidden
    >
      <h1
        className="text-white font-extrabold text-5xl md:text-6xl tracking-[-0.055em]"
        style={{
          fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif"
        }}
      >
        Mismatched.
      </h1>
      <p
        className="mt-3 text-white/70 text-base md:text-lg italic"
        style={{
          fontFamily: "var(--font-display-serif), ui-serif, Georgia, serif"
        }}
      >
        where you meet your date <span aria-hidden>❤️</span>
      </p>
    </div>
  );
}
