import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { supabaseAdmin, supabaseBroadcast } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { loadSessionFor, newId, partnerIdOf } from "@/lib/random";
import { sendPushToUser } from "@/lib/web-push";
import { screenMessage } from "@/lib/text-filter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ body: z.string().trim().min(1).max(1000) });

// GET — the transcript, oldest first. `after` takes a message id and returns
// only what followed it, which is how the polling fallback tails the room.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const found = await loadSessionFor(params.id, me.id);
  if (!found) return NextResponse.json({ error: "not found" }, { status: 404 });

  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const after = new URL(req.url).searchParams.get("after");
  let q = admin
    .from("RandomMessage")
    .select("id,body,fromUserId,createdAt")
    .eq("sessionId", params.id)
    .order("createdAt", { ascending: true })
    .limit(200);

  if (after) {
    const { data: anchor } = await admin
      .from("RandomMessage").select("createdAt").eq("id", after).maybeSingle();
    if (anchor) q = q.gt("createdAt", (anchor as any).createdAt);
  }

  const { data } = await q;

  // `mine` instead of the sender id — the partner's user id never leaves the
  // server while the session is anonymous.
  return NextResponse.json({
    messages: (data ?? []).map((m: any) => ({
      id: m.id,
      body: m.body,
      mine: m.fromUserId === me.id,
      createdAt: m.createdAt
    }))
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const found = await loadSessionFor(params.id, me.id);
  if (!found) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (found.session.endedAt) {
    return NextResponse.json({ error: "This chat has ended." }, { status: 409 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid message" }, { status: 400 });

  const rl = await checkRateLimit("random_message", me.id);
  if (!rl.ok) return NextResponse.json({ error: rl.reason }, { status: 429 });

  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  // Screening. A "block" verdict never reaches the other person; a "flag"
  // is delivered but raises a report, because contact details are usually
  // innocent and occasionally the opening move of a scam.
  const verdict = screenMessage(parsed.data.body);
  if (verdict.action === "block") {
    return NextResponse.json({ error: verdict.message }, { status: 422 });
  }

  const msg = {
    id: newId("rm"),
    sessionId: params.id,
    fromUserId: me.id,
    body: parsed.data.body,
    createdAt: new Date().toISOString()
  };

  const { error } = await admin.from("RandomMessage").insert(msg);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin
    .from("RandomSession")
    .update({ messageCount: found.session.messageCount + 1 })
    .eq("id", params.id);

  // One report per session per reason — a chat that trades phone numbers
  // back and forth should not generate twenty rows for a moderator.
  if (verdict.action === "flag") {
    const marker = `[random chat ${params.id}] auto-flag: ${verdict.reason}`;
    const { count } = await admin
      .from("Report")
      .select("id", { count: "exact", head: true })
      .eq("reporterId", me.id)
      .eq("reason", marker);
    if ((count ?? 0) === 0) {
      await admin.from("Report").insert({
        id: newId("rp"),
        reporterId: me.id,
        targetType: "random_message",
        targetRandomMessageId: msg.id,
        reason: marker,
        status: "open",
        createdAt: new Date().toISOString()
      }).then(undefined, () => undefined);
    }
  }

  // Broadcast carries no sender id — the receiving client marks anything it
  // did not send itself as the stranger's.
  await supabaseBroadcast("random:" + params.id, "message", {
    id: msg.id,
    body: msg.body,
    from: found.side,
    createdAt: msg.createdAt
  }).catch(() => {});

  // Nudge the partner only on the opening line, so an active back-and-forth
  // does not fire a notification per message.
  const partnerId = partnerIdOf(found.session, me.id);
  if (partnerId && found.session.messageCount === 0) {
    sendPushToUser(partnerId, {
      title: "Someone is talking to you",
      body: "Your random chat is waiting.",
      url: "/random/" + params.id,
      tag: "random:" + params.id
    }).catch(() => {});
  }

  return NextResponse.json({
    message: { id: msg.id, body: msg.body, mine: true, createdAt: msg.createdAt }
  });
}
