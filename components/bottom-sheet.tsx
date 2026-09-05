"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

// Sheet that slides up over whatever is on screen. Used by the search
// window and by the chat room, so options are reached the same way whether
// you are waiting for someone or already talking to them.
//
// `dismissible` is off while a choice is required — the search screen holds
// the sheet open until at least one interest is picked, and a backdrop tap
// that closed it would leave the user staring at a screen doing nothing.
export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  dismissible = true,
  children
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  dismissible?: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open || !dismissible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissible, onClose]);

  return (
    <div
      className={
        "fixed inset-0 z-50 transition-opacity duration-200 " +
        (open ? "opacity-100" : "opacity-0 pointer-events-none")
      }
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={dismissible ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={
          "absolute inset-x-0 bottom-0 mx-auto w-full max-w-md bg-white rounded-t-3xl " +
          "transition-transform duration-300 ease-out " +
          (open ? "translate-y-0" : "translate-y-full")
        }
        style={{ maxHeight: "86vh" }}
      >
        <span className="absolute left-1/2 -translate-x-1/2 top-2.5 w-9 h-1 rounded-full bg-hairline" />
        <div className="flex items-start justify-between px-6 pt-5 pb-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{title}</p>
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 -mr-1.5 -mt-0.5 text-muted shrink-0"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div
          className="px-6 pb-8 space-y-6 overflow-y-auto overscroll-contain"
          style={{ maxHeight: "calc(86vh - 4.5rem)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
