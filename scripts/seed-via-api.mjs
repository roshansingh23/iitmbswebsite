// Seeds the Config and Prompt tables in Supabase via the Management API.
// Idempotent: uses ON CONFLICT DO NOTHING / DO UPDATE.

import { DEFAULT_CONFIG } from "../lib/config-defaults.ts";

// Romantic / date-centric only. No casual or random prompts — we want
// answers to spark date-worthy conversation, not small talk.
const PROMPTS = [
  "A green flag I look for…",
  "We'll get along if…",
  "The way to my heart is…",
  "I'll know I like you when…",
  "Soft launch or hard launch person?",
  "My idea of a perfect first date is…",
  "I'll fall for you if…",
  "A date I daydream about…",
  "My love language is…",
  "I want someone who…",
  "The most romantic thing I've done…",
  "A first-date ick I just can't…",
  "I knew I had a crush when…",
  "An ideal Sunday with you would be…",
  "I'm looking for someone to…",
  "My favorite kind of romance is…",
  "I fall hardest for people who…",
  "How I show I care is…",
  "We should go on a date if you…",
  "My ideal first kiss is…",
  "I'm at my best in a relationship when…"
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
