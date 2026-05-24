"use client";

import Image from "next/image";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export type Photo = {
  id: string;
  url: string;
  publicId?: string;
  position: number;
};

// View / add / remove the signed-in user's own photos.
// Add goes through the Supabase Edge Function for signing, then Cloudinary,
// then our /api/me/photos to persist. Remove just deletes the Photo row.
export function PhotoManager({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const supabase = supabaseBrowser();
      const { data: sig, error: sigErr } = await supabase.functions.invoke<{
        timestamp: number; folder: string; signature: string; apiKey: string; cloudName: string; error?: string;
      }>("cloudinary-signature");
      if (sigErr) throw sigErr;
      if (!sig || sig.error) throw new Error(sig?.error ?? "No signature returned");

      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", sig.apiKey);
      fd.append("timestamp", String(sig.timestamp));
      fd.append("signature", sig.signature);
      fd.append("folder", sig.folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: "POST", body: fd
      });
      const data = await res.json();
      if (!data.secure_url) throw new Error(data.error?.message ?? "Upload failed");

      const saveRes = await fetch("/api/me/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: data.secure_url, publicId: data.public_id })
      });
      const saved = await saveRes.json();
      if (!saveRes.ok) throw new Error(saved.error ?? "Save failed");
      setPhotos((cur) => [...cur, saved.photo]);
    } catch (e: any) {
      setErr(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const before = photos;
    setPhotos((cur) => cur.filter((p) => p.id !== id));
    const res = await fetch(`/api/me/photos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setPhotos(before);
      setErr("Couldn't remove. Try again.");
    } else {
      setErr(null);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {photos.map((p) => (
          <figure
            key={p.id}
            className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-hairline bg-tint"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <Image src={p.url} alt="" fill className="object-cover" sizes="(min-width:768px) 300px, 50vw" />
            <button
              type="button"
              onClick={() => remove(p.id)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white border border-hairline flex items-center justify-center transition hover:bg-tint"
              aria-label="Remove photo"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              <Cross />
            </button>
          </figure>
        ))}

        <label
          className="aspect-[4/5] rounded-2xl border border-dashed border-hairline flex items-center justify-center text-sm font-medium text-muted cursor-pointer hover:bg-tint transition"
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) add(f);
              e.currentTarget.value = "";
            }}
            disabled={busy}
          />
          {busy ? "Uploading…" : "+ Add photo"}
        </label>
      </div>
      {err && <p className="mt-3 text-xs text-ink border-l border-ink pl-2">{err}</p>}
    </div>
  );
}

function Cross() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}
