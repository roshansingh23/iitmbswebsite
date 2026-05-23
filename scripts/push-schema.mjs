import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../prisma-schema.sql", import.meta.url), "utf8");
const token = process.env.SB_TOKEN;
const ref = process.env.SB_REF ?? "xwrbyfikhcyxlehffcjm";

async function q(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: sql })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  return text;
}

console.log("pushing schema…");
await q(sql);
console.log("schema pushed.\n");

console.log("listing tables…");
const result = await q("select tablename from pg_tables where schemaname='public' order by tablename;");
console.log(result);
