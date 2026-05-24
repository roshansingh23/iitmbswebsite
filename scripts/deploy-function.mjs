// Deploy a Supabase Edge Function via the Management API.
// Run: SB_TOKEN=sbp_... node scripts/deploy-function.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const token = process.env.SB_TOKEN;
const ref = process.env.SB_REF ?? "xwrbyfikhcyxlehffcjm";
const slug = "cloudinary-signature";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(
  resolve(__dirname, "../supabase/functions/cloudinary-signature/index.ts"),
  "utf8"
);

const base = `https://api.supabase.com/v1/projects/${ref}/functions`;
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json"
};

// List existing functions first
const listRes = await fetch(base, { headers });
const list = listRes.ok ? await listRes.json() : [];
const exists = Array.isArray(list) && list.some((f) => f.slug === slug);
console.log(`existing: ${exists ? "yes" : "no"}`);

const body = JSON.stringify({
  slug,
  name: slug,
  body: src,
  verify_jwt: true
});

let res;
if (exists) {
  res = await fetch(`${base}/${slug}`, { method: "PATCH", headers, body });
} else {
  res = await fetch(base, { method: "POST", headers, body });
}

const text = await res.text();
console.log(`${exists ? "PATCH" : "POST"} ${res.status}: ${text.slice(0, 400)}`);
