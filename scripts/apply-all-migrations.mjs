// Apply every .sql file in prisma-migrations/ in alphabetical order via
// the Supabase Management API. Files are dated (2026-05-25-…,
// 2026-05-25b-…, etc.) so alphabetical = chronological.
//
// Run: $env:SB_TOKEN="sbp_..."; node scripts/apply-all-migrations.mjs
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const token = process.env.SB_TOKEN;
const ref = process.env.SB_REF ?? "xwrbyfikhcyxlehffcjm";
if (!token) {
  console.error("Set SB_TOKEN (Supabase Management API token, starts with sbp_)");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = resolve(__dirname, "..", "prisma-migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

if (files.length === 0) {
  console.error("No .sql files in prisma-migrations/");
  process.exit(1);
}

for (const file of files) {
  process.stdout.write(`→ ${file} ... `);
  const sql = readFileSync(resolve(dir, file), "utf8");
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql })
  });
  const text = await res.text();
  if (!res.ok) {
    console.log("FAIL");
    console.error(`  ${res.status}: ${text}`);
    process.exit(1);
  }
  console.log("ok");
}
console.log("\nAll migrations applied.");
