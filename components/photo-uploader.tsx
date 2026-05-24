"use client";

import { useState } from "react";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Photo = { url: string; publicId: string };

export function PhotoUploader({
  value,
  onChange
}: {
  value: Photo[];
  onChange: (v: Photo[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setErr(null);
    try {
      // Get a signed Cloudinary upload payload from the Supabase Edge Function.
      // Credentials never touch Vercel env or the browser — they live in the
      // function's own secrets store.
      const supabase = supabaseBrowser();
      const { data: sig, error: sigErr } = await supabase.functions.invoke<{
        timestamp: number;
        folder: string;
        signature: string;
        apiKey: string;
        cloudName: string;
        error?: string;
      }>("cloudinary-signature");

      if (sigErr) throw sigErr;
      if (!sig) throw new Error("No signature returned");
      if (sig.error) throw new Error(sig.error);

      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", sig.apiKey);
      fd.append("timestamp", String(sig.timestamp));
      fd.append("signature", sig.signature);
      fd.append("folder", sig.folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: "POST",
        body: fd
      });
      const data = await res.json();
      if (!data.secure_url) throw new Error(data.error?.message ?? "Upload failed");
      onChange([...value, { url: data.secure_url, publicId: data.public_id }]);
    } catch (e: any) {
      setErr(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function removeAt(i: number) {
    onChange(value.filter((_, j) => j !== i));
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {value.map((p, i) => (
          <div key={p.publicId} className="relative aspect-[4/5] card-line overflow-hidden">
            <Image src={p.url} alt="" fill className="object-cover" sizes="200px" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-2 right-2 text-[0.65rem] tracking-[0.18em] uppercase bg-bone/95 text-ink px-2 py-1 border border-hairline rounded-[2px]"
            >
              Remove
            </button>
          </div>
        ))}

        <label className="aspect-[4/5] card-line border-dashed flex items-center justify-center text-sm text-muted cursor-pointer hover:bg-tint transition">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.currentTarget.value = "";
            }}
            disabled={busy}
          />
          {busy ? "Uploading…" : "+ Add"}
        </label>
      </div>
      {err && <p className="mt-3 text-xs text-ink border-l border-ink pl-2">{err}</p>}
    </div>
  );
}
