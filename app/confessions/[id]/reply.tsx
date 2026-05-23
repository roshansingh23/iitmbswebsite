"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function ReplyComposer({ confessionId }: { confessionId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!body.trim()) return;
    setSending(true);
    const res = await fetch(`/api/confessions/${confessionId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim() })
    });
    setSending(false);
    if (res.ok) { setBody(""); router.refresh(); }
  }

  return (
    <div className="mt-8 card-line p-5">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Reply anonymously"
        maxLength={300}
      />
      <div className="mt-3 flex justify-end">
        <Button onClick={submit} disabled={sending || !body.trim()}>Reply</Button>
      </div>
    </div>
  );
}
