"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { thumb } from "@/lib/cloudinary-thumb";

type Conv = {
  id: string;
  otherId: string | null;
  otherName: string;
  otherPhoto: string | null;
  updatedAt: string;
};

// Desktop-only chat list. Renders to the right of the floating sidebar
// and stays visible across routes — picking a chat opens it in the main
// area where /discover normally sits.
export function ChatListPanel() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);
  const path = usePathname();
  const activeId =
    path.startsWith("/chat/") ? path.split("/")[2] : null;

  useEffect(() => {
    // The panel is display:none below the desktop breakpoint, but the fetch
    // ran anyway — every phone paid for a request it could never see, on
    // every page. Match the CSS before asking for the data.
    if (!window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch("/api/conversations")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        if (d?.conversations) setConvs(d.conversations);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <aside
      className="hidden desktop:flex fixed top-5 bottom-5 left-24 w-72 z-20 flex-col bg-white border border-hairline rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
      aria-label="Chats"
    >
      <header className="px-5 py-4 border-b border-hairline">
        <h2 className="font-extrabold text-lg tracking-[-0.03em]">Chats</h2>
      </header>

      <ul className="flex-1 overflow-y-auto no-scrollbar">
        {loading && (
          <li className="px-5 py-6 text-sm text-muted">Loading…</li>
        )}
        {!loading && convs.length === 0 && (
          <li className="px-5 py-6 text-sm text-muted">
            No chats yet. Hooks turn into chats once they're mutual.
          </li>
        )}
        {convs.map((c) => (
          <li key={c.id} className="border-b border-hairline last:border-b-0">
            <Link
              href={`/chat/${c.id}`}
              className={
                "flex items-center gap-3 px-4 py-3 transition-colors " +
                (activeId === c.id ? "bg-tint" : "hover:bg-tint/60")
              }
            >
              <div className="relative w-11 h-11 rounded-full overflow-hidden bg-tint shrink-0">
                {c.otherPhoto && (
                  <Image
                    src={thumb(c.otherPhoto, 100)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{c.otherName}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
