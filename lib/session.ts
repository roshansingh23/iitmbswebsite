import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { db } from "./db";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const id = (session.user as any).id as string | undefined;
  if (!id) return null;
  return db.user.findUnique({
    where: { id },
    include: { photos: { orderBy: { position: "asc" } }, userPrompts: { include: { prompt: true } } }
  });
}

export async function requireUser() {
  const u = await getSessionUser();
  if (!u) {
    const e = new Error("UNAUTHENTICATED");
    (e as any).status = 401;
    throw e;
  }
  return u;
}
