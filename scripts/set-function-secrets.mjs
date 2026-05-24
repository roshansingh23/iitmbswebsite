// Set Edge Function secrets in bulk via the Supabase Management API.
// Usage: SB_TOKEN=sbp_... node scripts/set-function-secrets.mjs
const token = process.env.SB_TOKEN;
const ref = process.env.SB_REF ?? "xwrbyfikhcyxlehffcjm";

const secrets = [
  { name: "CLOUDINARY_CLOUD_NAME", value: process.env.CLOUDINARY_CLOUD_NAME ?? "" },
  { name: "CLOUDINARY_API_KEY", value: process.env.CLOUDINARY_API_KEY ?? "" },
  { name: "CLOUDINARY_API_SECRET", value: process.env.CLOUDINARY_API_SECRET ?? "" },
  { name: "CLOUDINARY_UPLOAD_FOLDER", value: process.env.CLOUDINARY_UPLOAD_FOLDER ?? "hooked" }
].filter((s) => s.value);

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/secrets`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(secrets)
});
const text = await res.text();
console.log(`${res.status}: ${text.slice(0, 300)}`);
