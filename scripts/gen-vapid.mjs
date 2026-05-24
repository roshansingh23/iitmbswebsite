// Generate a fresh VAPID keypair for web push.
// Run once: `node scripts/gen-vapid.mjs`. Copy the lines printed into
// your Vercel env (and your local .env if running dev push).
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("");
console.log("# Add these to Vercel env (and locally if dev-pushing):");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:noreply@mismatched.app`);
console.log("");
