// Apply a SQL migration file via the Supabase Management API.
// Run: SB_TOKEN=sbp_... node scripts/apply-migration.mjs prisma-migrations/2026-05-25-impressions-and-photo-messages.sql
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const token = process.env.SB_TOKEN;
const ref = process.env.SB_REF ?? "xwrbyfikhcyxlehffcjm";
if (!token) {
  console.error("Set SB_TOKEN");
  process.exit(1);
}

const file = process.argv[2];
if (!file) {
  console.error("Pass migration file as first arg");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(resolve(__dirname, "..", file), "utf8");

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql })
});
const text = await res.text();
if (!res.ok) {
  console.error(`${res.status}: ${text}`);
  process.exit(1);
}
console.log("applied.");
console.log(text);
