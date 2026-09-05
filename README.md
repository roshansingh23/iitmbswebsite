# dating-app

Random chat with someone from your college, plus a quieter dating app
underneath it. Anonymous 1:1 pairing is the main loop; Hinge-style answered
prompts and a no-swipe discover feed are the second half, and a mutual
reveal in a random chat is the bridge between them.

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

## Auth and domains

Sign-in is Google OAuth on our own domain (Auth.js/NextAuth, JWT sessions —
no database adapter). Who gets in, in precedence order:

| Setting | Effect |
| --- | --- |
| `ALLOWED_EMAIL_DOMAINS=a.ac.in,b.edu` | only those domains and their subdomains — a closed pilot |
| `ACADEMIC_ONLY=true` | only academic domains (`.edu`, `.ac.in`, `.ac.uk`, …) |
| neither | **any email address** — the default |

Rejections all read *"That email can't be used to sign in."* — the message
never names which domains qualify, so a closed pilot is not enumerable.

### The Domain table

Members are grouped by the **base domain** of the address they sign in with —
one row per institution, not per subdomain:

```
ds.study.x.ac.in  -smail.x.ac.in      >--  x.ac.in          one row, one pool
x.ac.in           -/
```

The base domain is the single label in front of the public suffix
(`baseDomain()` in `lib/domains.ts`, mirrored as `base_domain()` in SQL so the
migration backfills the same way). That is the only inference made. It still
never invents a display **name**.

| Column | Meaning |
| --- | --- |
| `domain` | the base domain, lowercase — the identity |
| `name` | display name, set by hand. Null = show the base domain |
| `poolId` | the random-pairing shard. Defaults to the row's own id |
| `verified` | flag for rows a human has looked at |

Naming one is a single statement:

```sql
UPDATE "Domain" SET name = 'Whatever you call it', verified = true
 WHERE domain = 'x.ac.in';
```

`poolId` is the escape hatch for the cases the base-domain rule cannot see —
one institution that genuinely owns two unrelated domains:

```sql
UPDATE "Domain"
   SET "poolId" = (SELECT "poolId" FROM "Domain" WHERE domain = 'x.ac.in')
 WHERE domain = 'x-alumni.edu';
```

Random pairing **never crosses a `poolId` boundary.**

## Random chat

The primary feature. Text only.

- `POST /api/random/queue` both enqueues and polls. The client hits it every
  2s; the first response carrying a `sessionId` is the match.
- Pairing is scoped to the caller's `poolId` and happens inside the Postgres
  function `pair_random()` using
  `SELECT … FOR UPDATE SKIP LOCKED`, so two people connecting in the same
  millisecond can never claim the same partner.
- Ranking, heaviest first: **waiting time** (0.1/sec — nobody starves),
  same intentions (+3), age proximity (+2/+1), jitter (0–2).
- Blocks are honoured in both directions, and two people who just talked are
  not re-paired for 45 minutes.
- Queue rows stop beating after 25s and get swept, so you are never paired
  against a closed tab.
- Identities are never sent to the client. Each side gets a per-session alias
  ("Amber Lantern") derived from the session id.
- **Keep** is per-side and one-way — your copy, their consent not required,
  they are not told. A kept session is exempt from the retention sweep.
- **Reveal** needs both sides. When they agree, a real `Match` +
  `Conversation` is minted and the pair moves into the normal chat.
- **Block** ends the session and stops the matchmaker pairing them again,
  anywhere in the app. An optional reason files a moderation report.
- **Typing indicator** is broadcast-only — nothing is written down, and it
  expires on a 3.5s timer so a partner who closes the tab mid-sentence does
  not leave "typing…" on screen forever.

### Anonymity model

| Column | Who sees it |
| --- | --- |
| `User.name` | the real name from Google. **Never** sent to the other side of a random chat |
| `User.displayName` | the handle the member picks. This is what a stranger sees |
| neither set | a generated per-session alias ("Winter Comet"), so nobody is blocked from chatting |

`displayName` is deliberately **not unique** — forcing uniqueness would turn
the handle into a stable identifier that can be probed for, which is the
opposite of what it is for. It is validated by `sanitizeDisplayName()`
(`lib/anon-name.ts`): 2–24 chars, letters/digits/spaces/`- _ . '` only, no
emoji, no emails or links, no phone numbers, reserved staff words blocked
after folding punctuation away (so `A_d-m.i'n` is caught), and invisible
characters stripped before every check.

The only place the anonymous path touches the `User` table it projects
`id,displayName` — the real name is never read. The client payload carries
no partner user id either. Identity is published only by the reveal flow,
which needs both sides and moves the pair into a real `Conversation`.

### Pairing signals

`pair_random()` orders the queue by, heaviest first:

| Signal | Weight |
| --- | --- |
| waiting time | 0.1/sec — nobody starves |
| **shared interests** | 2 each, **capped at 6** |
| same intentions | 3 |
| age within 3 / within 6 | 2 / 1 |
| jitter | 0–2 |

Interests are a **soft** signal: they appear only in `ORDER BY`, never in
`WHERE`, so nobody is excluded for having the wrong tags or none at all. The
cap is what keeps it soft — waiting time passes 6 after a minute, so a long
waiter with no tags outranks a fresh perfect match. Blocks and the re-pair
cooldown remain hard filters.

Verified live: with equal waiting time a tag match wins 14/14; with zero
overlap the pair still happens; a two-minute waiter beats a fresh tag match;
a blocked user is never returned.

### Message screening

`screenMessage()` (`lib/text-filter.ts`) returns `block`, `flag` or `clean`.
Blocked messages never reach the recipient. Flagged ones are delivered but
raise one moderation report per session per reason — contact details are
usually innocent and occasionally the opening move of a scam, so a human
decides rather than the regex.

It builds three views of each message: `raw` (digits and `@` intact, for
contact details), `spaced` (leet-decoded, word boundaries kept) and
`compact` (all separators stripped, defeating `s e n d   m e ...`). Using one
normalisation for everything is what makes naive filters miss phone numbers —
leet-decoding turns `9876543210` into letters.

Extend the severe list per community with `MODERATION_BLOCKLIST`
(comma-separated) rather than editing the file.

### Thin pools

Below roughly twenty people online the queue is a dead end, so after 25
seconds the waiting screen offers **"Notify me instead"**. That drops you
from the queue and stores a `RandomPing` row; the next person to enter the
queue in your pool triggers a push and consumes the row. Rows are deleted
before the push is sent — better to drop a notification than to send the same
one every time somebody opens Random.

Retention: `purge_random_sessions(7)` deletes ended sessions neither side
kept, skipping any with an open report. Wire it to a daily cron.

## Authoring

[@roshanyadav-2109](https://github.com/roshanyadav-2109)
