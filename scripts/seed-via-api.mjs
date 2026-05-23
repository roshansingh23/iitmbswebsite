// Seeds the Config and Prompt tables in Supabase via the Management API.
// Idempotent: uses ON CONFLICT DO NOTHING / DO UPDATE.

import { DEFAULT_CONFIG } from "../lib/config-defaults.ts";

const PROMPTS = [
  "A green flag I look for…",
  "My toxic trait is…",
  "Soft launch or hard launch person?",
  "Two truths and a lie",
  "We'll get along if…",
  "I'm weirdly good at…",
  "The way to my heart is…",
  "I go quiet when…",
  "The last thing I texted that made me laugh out loud",
  "An unpopular opinion I'll die on",
  "A small thing that means a lot to me",
  "I'll know I like you when…",
  "My most controversial Spotify Wrapped",
  "I'm convinced that…",
  "The fastest way to my Saturday morning is…"
];

const token = process.env.SB_TOKEN;
const ref = process.env.SB_REF ?? "xwrbyfikhcyxlehffcjm";

async function q(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  return text;
}

// Config
const configRows = Object.entries(DEFAULT_CONFIG)
  .map(([k, v]) => `('${k}', '${String(v)}', now())`)
  .join(",\n");
const configSql = `
INSERT INTO "Config" (key, value, "updatedAt") VALUES
${configRows}
ON CONFLICT (key) DO NOTHING;
`;

// Prompts — use ON CONFLICT on unique(text). Use a tiny helper for cuid-like ids.
function cuid() {
  return "c" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}
const promptRows = PROMPTS.map((p) => {
  const id = cuid();
  const escaped = p.replace(/'/g, "''");
  return `('${id}', '${escaped}', true)`;
}).join(",\n");
const promptSql = `
INSERT INTO "Prompt" (id, text, active) VALUES
${promptRows}
ON CONFLICT (text) DO NOTHING;
`;

console.log("seeding Config…");
await q(configSql);
console.log("seeding Prompt bank…");
await q(promptSql);

console.log("\nrow counts:");
console.log(await q("select 'Config' as t, count(*) from \"Config\" union all select 'Prompt', count(*) from \"Prompt\";"));
