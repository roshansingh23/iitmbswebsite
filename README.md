# dating-app

A quieter dating app. Hinge-style answered prompts, no swipe stack, near-monochrome editorial UI.

> Not affiliated with any institution. Pairing, prompts, and content are original.

## Stack

- **Next.js 14** (App Router), TypeScript, Tailwind CSS
- **Prisma** + Postgres (use Supabase Postgres for one-shop setup)
- **NextAuth.js** (Email magic links, PrismaAdapter)
- **Cloudinary** for photo uploads (client-side signed direct upload)
- **Supabase Realtime** for chat broadcast (falls back to polling)
- `qrcode` for personal QR generation
- Razorpay scaffold is in place (lib/razorpay.ts, Payment model) but not wired
  to any routes — turn on later when ready

## Setup

```bash
# 1. install deps
npm install

# 2. fill in env
cp .env.example .env.local
# DATABASE_URL + DIRECT_URL  →  Supabase connection strings
# NEXTAUTH_SECRET           →  openssl rand -base64 32
# ALLOWED_EMAIL_DOMAINS     →  comma-separated (e.g. "yourdomain.com")
# EMAIL_SERVER_*            →  SMTP for magic links
# Cloudinary / Supabase keys

# 3. push schema + seed
npx prisma db push
npx prisma db seed     # config defaults + prompt bank

# 4. dev
npm run dev
```

## Design tokens

| Token         | Value     | Role                                  |
| ------------- | --------- | ------------------------------------- |
| `--bone`      | `#F3F0E9` | Page background                       |
| `--card`      | `#FBFAF7` | Surfaces                              |
| `--hairline`  | `#E4DFD4` | 1px borders                           |
| `--ink`       | `#1C1B19` | Text and the only button colour       |
| `--muted`     | `#6A6358` | Secondary text                        |
| `--tint`      | `#E8E2D4` | Hover only (single warm accent)       |

Fonts: **Fraunces** (display) + **Libre Franklin** (body). No Inter.

## What's wired vs scaffolded

**Wired**
- Email magic-link auth with silent domain gate
- Cloudinary signed direct upload, photo gallery
- QR code per user (`/api/qr/[id]` → PNG, `/u/[qr]` → resolves)
- Orientation-aware discovery feed
- Hook → mutual hook → conversation creation
- Chat (Supabase Realtime, polling fallback)
- Anonymous confessions + reactions + replies
- Reports + block, admin moderation queue
- Pause mode

**Stubbed (UI present, no payment wired)**
- Upgrade page reads pricing from `Config` but the CTA is "Coming soon"
- Razorpay client lib (`lib/razorpay.ts`) ready to enable when you want

**Off**
- The interaction-time chat lock is disabled in `lib/chat-timekeeper.ts`
  (counter still ticks for analytics; UI shows no timer)

## Editing limits and prices at runtime

All limits, prices, and durations live in the `Config` table — change in Prisma Studio or via SQL, no redeploy:

```
freeDailyProfileLimit   12
freeDailyHookLimit      5
freeChatCapSeconds      900
paidChatCapSeconds      14400
chatExtensionSeconds    3600
plusPriceMen            19900     # ₹199 (paise)
insightsPriceWomen      49900     # ₹499
chatExtensionPrice      9900      # ₹99
plusDurationDays        7
foundingMemberLimit     500
activeWindowSeconds     120
```

Reads are cached for 30s.

## Deploy

Vercel. Set every env in the project settings. The build script runs
`prisma generate` before `next build`, so missing `DATABASE_URL` at build time
only matters if you also `db push` at build (you usually don't).

## Auth: the silent domain gate

`ALLOWED_EMAIL_DOMAINS=acme.com,acme.co.in` will only let those domains
complete sign-in. Everyone else sees: *"This email can't be used to sign up."* — no further explanation. The gate is enforced both in `sendVerificationRequest` (no email sent) and in the `signIn` callback (link click blocked).

## Authoring

[@roshanyadav-2109](https://github.com/roshanyadav-2109)
