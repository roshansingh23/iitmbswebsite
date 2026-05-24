// Seed ~150 sample profiles into Supabase with photos, prompt answers,
// hooks between random pairs, and matches + conversations for the mutual
// ones. Skips Messages (chat content is left empty per request).
//
// Usage: SB_TOKEN=sbp_... node scripts/seed-sample.mjs

const TOKEN = process.env.SB_TOKEN;
const REF = process.env.SB_REF ?? "xwrbyfikhcyxlehffcjm";

async function q(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  return JSON.parse(text);
}

function cuid() {
  return "c" + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
}
function rqr() {
  return Math.random().toString(36).slice(2, 10).padEnd(12, "x").slice(0, 12);
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function sqlStr(s) {
  if (s === null || s === undefined) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}
function sqlBool(b) { return b ? "TRUE" : "FALSE"; }
function sqlNum(n) { return n === null || n === undefined ? "NULL" : String(n); }
function sqlArr(arr) {
  if (!arr || arr.length === 0) return "'{}'";
  return "'{" + arr.map((s) => `"${s}"`).join(",") + "}'";
}
function pastIso(maxDaysAgo) {
  const ms = Math.floor(Math.random() * maxDaysAgo * 24 * 60 * 60 * 1000);
  return new Date(Date.now() - ms).toISOString();
}

// ────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────

const NAMES = [
  "Aanya", "Aarav", "Aditi", "Aditya", "Aisha", "Akhil", "Ananya", "Anika",
  "Aniket", "Arjun", "Diya", "Esha", "Ishaan", "Kabir", "Karan", "Kavya",
  "Khushi", "Krishna", "Maya", "Meera", "Mihir", "Nandini", "Neha", "Nikita",
  "Nikhil", "Pooja", "Priya", "Rahul", "Raj", "Riya", "Rohan", "Saanvi",
  "Sahil", "Sameer", "Sanjana", "Shaurya", "Shreya", "Siddharth", "Simran",
  "Tanvi", "Tara", "Tejas", "Vansh", "Veer", "Vihaan", "Vivek", "Yash", "Zara",
  "Aryan", "Devika", "Hritik", "Isha", "Jay", "Kiara", "Mansi", "Naina",
  "Om", "Parth", "Rhea", "Sneha", "Varun", "Yashika", "Aaradhya", "Reyansh",
  "Vivaan", "Anaya", "Avni", "Pari", "Myra", "Aarohi", "Kiyaan", "Devansh"
];

const CITIES = [
  "Chennai", "Bangalore", "Bombay", "Delhi", "Hyderabad", "Pune", "Kolkata",
  "Jaipur", "Ahmedabad", "Lucknow", "Indore", "Bhopal", "Coimbatore",
  "Madurai", "Mysore", "Trivandrum", "Cochin", "Vizag", "Bhubaneswar",
  "Guwahati", "Chandigarh", "Patna", "Surat", "Vadodara", "Nagpur"
];

const HEIGHTS = [
  "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"", "5'7\"",
  "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\""
];

const INTENTIONS = [
  "Short-term", "Long-term", "Marriage", "Casual", "Friends first", "Figuring it out"
];

const RELATIONSHIP_TYPES = ["Monogamy", "Ethical non-monogamy", "Open to all"];

// Canned answers per prompt text (matches what's in the prompt bank).
const ANSWERS = {
  "A green flag I look for…": [
    "Texts back at a normal speed — no three-minute essays, no three-day silences.",
    "Has a friend they've kept for ten years.",
    "Listens more than they speak.",
    "Can sit in silence without filling it.",
    "Knows what they like and doesn't apologise for it."
  ],
  "My toxic trait is…": [
    "Refusing to ask for directions even when I'm clearly lost.",
    "Buying books faster than I can read them.",
    "Watching every show on 2x speed.",
    "Saying 'I'll be there in 5' from another city.",
    "Replying with one-word texts and then writing essays in my Notes app."
  ],
  "Soft launch or hard launch person?": [
    "Soft launch. Then a blurry photo. Then nothing for a month. Then a wedding card.",
    "Hard launch. If it's worth doing it's worth posting.",
    "Soft launch only — the right people will know.",
    "I don't launch at all. You'll just see us at a wedding eventually."
  ],
  "Two truths and a lie": [
    "I can ride a unicycle. I once met Sachin Tendulkar. I hate biriyani.",
    "I'm scared of pigeons. I've cried at every Pixar film. I play the violin.",
    "I make great omelettes. I've never been to Goa. I can recite all 50 US states."
  ],
  "We'll get along if…": [
    "You have a strong opinion about chai and you're willing to defend it.",
    "You don't mind eating dinner at 10 pm.",
    "You text me about songs that made you cry.",
    "You can take a long auto ride and not be on your phone.",
    "You laugh at your own jokes."
  ],
  "I'm weirdly good at…": [
    "Parallel parking on the first try.",
    "Auto rickshaw negotiations in cities I've never been to.",
    "Crying at songs in languages I don't speak.",
    "Picking the slowest checkout queue every single time."
  ],
  "The way to my heart is…": [
    "Show up with mangoes in May. Don't make a thing of it.",
    "Send me a meme that's specifically for me.",
    "Be on time when it matters and only then.",
    "Order food without asking what I want."
  ],
  "I go quiet when…": [
    "I'm reading something I love. Ask me what it is — I want to tell you.",
    "I haven't eaten in five hours.",
    "I'm about to make a really good point.",
    "Someone says 'we should all go for a hike together'."
  ],
  "The last thing I texted that made me laugh out loud": [
    "'why is the dosa judging me'",
    "'send help I'm at a wedding I wasn't invited to'",
    "'just told my boss I'm sick by accident'",
    "'the chai here tastes like apology'"
  ],
  "An unpopular opinion I'll die on": [
    "Bombay is just one really long beach with a city draped over it.",
    "Filter coffee is better than every espresso ever made.",
    "Idli is the most underrated breakfast on earth.",
    "Indian summers are misunderstood and lovely if you stop complaining."
  ],
  "A small thing that means a lot to me": [
    "Someone remembering how I take my tea.",
    "A handwritten note with a misspelling.",
    "Someone driving slow when I'm in the passenger seat.",
    "A friend forwarding a meme they thought of me for."
  ],
  "I'll know I like you when…": [
    "I start saving you screenshots before I read them.",
    "I want you to meet my best friend before my parents.",
    "I stop trying to be funny and just am.",
    "I tell you something embarrassing within the first three dates."
  ],
  "My most controversial Spotify Wrapped": [
    "Top 1% Arijit Singh and I refuse to be embarrassed.",
    "I had a Coldplay phase that lasted four years.",
    "The same Tamil love song 300 times. No I won't say which.",
    "Bollywood from 2007 only. The year was just better."
  ],
  "I'm convinced that…": [
    "The best food in any city is in someone's home.",
    "We all need to read more and post less.",
    "Pune has better filter coffee than Chennai. Fight me.",
    "Long-distance always fails for boring reasons."
  ],
  "The fastest way to my Saturday morning is…": [
    "Filter coffee, paper, and absolutely no plans.",
    "A long run, then a longer breakfast.",
    "Going back to bed at 9 am with no guilt.",
    "A drive to nowhere with the right playlist."
  ]
};

const fallbackAnswers = [
  "Ask me when we meet.",
  "Still figuring this one out.",
  "Honestly, depends on the day.",
  "I'll tell you over coffee."
];

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────

console.log("fetching prompts…");
const promptRows = await q("SELECT id, text FROM \"Prompt\" WHERE active = true;");
const prompts = Array.isArray(promptRows) ? promptRows : (promptRows?.value ?? []);
console.log(`  -> ${prompts.length} prompts in bank`);

const N = 150;
const users = [];
for (let i = 0; i < N; i++) {
  const idx = i;
  // Gender mix: roughly 50/50 with some non-binary.
  const gender =
    idx % 11 === 0 ? "nonbinary" : idx % 2 === 0 ? "woman" : "man";
  const orientation =
    idx % 13 === 0 ? "bisexual" :
    idx % 17 === 0 ? "gay" :
    idx % 19 === 0 ? "lesbian" :
    "straight";
  let showMe = ["man", "woman"];
  if (orientation === "straight") showMe = gender === "woman" ? ["man"] : gender === "man" ? ["woman"] : ["man", "woman"];
  if (orientation === "gay") showMe = ["man"];
  if (orientation === "lesbian") showMe = ["woman"];

  users.push({
    id: cuid(),
    authId: null,
    email: `seed-${idx}@example.test`,
    name: NAMES[idx % NAMES.length],
    age: 18 + (idx % 13),
    bio: idx % 3 === 0 ? `${pick(CITIES)}-raised. Currently ${pick(["studying", "working", "exploring"])}.` : null,
    gender,
    orientation,
    showMe,
    height: pick(HEIGHTS),
    location: pick(CITIES),
    intentions: pick(INTENTIONS),
    relationshipType: pick(RELATIONSHIP_TYPES),
    qrCode: rqr() + cuid().slice(0, 4),
    accessTier: "free",
    verified: idx % 7 === 0,
    foundingMember: idx < 30,
    paused: false,
    filterAgeMin: 18,
    filterAgeMax: 99,
    createdAt: pastIso(30),
    updatedAt: new Date().toISOString(),
    lastSeenAt: pastIso(idx % 5 === 0 ? 1 : 7)
  });
}

// Photos: 2–4 per user using Pravatar (deterministic by index).
const photos = [];
users.forEach((u, i) => {
  const count = 2 + (i % 3);
  for (let j = 0; j < count; j++) {
    const img = ((i * 4 + j) % 70) + 1;
    photos.push({
      id: cuid(),
      userId: u.id,
      url: `https://i.pravatar.cc/600?img=${img}`,
      publicId: `seed/${u.id}/${j}`,
      position: j,
      createdAt: u.createdAt
    });
  }
});

// User prompts: 3 per user, randomly chosen.
const userPrompts = [];
users.forEach((u) => {
  const picked = shuffle(prompts).slice(0, 3);
  picked.forEach((p, j) => {
    const answersForThis = ANSWERS[p.text];
    const answer = answersForThis ? pick(answersForThis) : pick(fallbackAnswers);
    userPrompts.push({
      id: cuid(),
      userId: u.id,
      promptId: p.id,
      answer,
      position: j,
      createdAt: u.createdAt
    });
  });
});

// Hooks: 2–5 per user, targeted at random others.
const hooks = [];
const hookSet = new Set();
users.forEach((u, i) => {
  const count = 2 + (i % 4);
  let attempts = 0;
  let made = 0;
  while (made < count && attempts < count * 5) {
    attempts++;
    const t = users[Math.floor(Math.random() * users.length)];
    if (t.id === u.id) continue;
    const key = `${u.id}->${t.id}`;
    if (hookSet.has(key)) continue;
    hookSet.add(key);
    hooks.push({
      id: cuid(),
      fromUserId: u.id,
      toUserId: t.id,
      targetType: "profile",
      photoId: null,
      userPromptId: null,
      promptId: null,
      note: null,
      isHardHook: false,
      seen: false,
      createdAt: pastIso(20)
    });
    made++;
  }
});

// Matches + Conversations for every mutual pair.
const matches = [];
const conversations = [];
const seenPair = new Set();
hooks.forEach((h) => {
  const reverseKey = `${h.toUserId}->${h.fromUserId}`;
  if (hookSet.has(reverseKey)) {
    const [a, b] = [h.fromUserId, h.toUserId].sort();
    const pairKey = `${a}::${b}`;
    if (seenPair.has(pairKey)) return;
    seenPair.add(pairKey);
    const matchId = cuid();
    const convId = cuid();
    const now = new Date().toISOString();
    matches.push({ id: matchId, userAId: a, userBId: b, createdAt: now });
    conversations.push({
      id: convId, matchId, userAId: a, userBId: b,
      interactionSeconds: 0, capSeconds: 900, locked: false,
      createdAt: now, updatedAt: now
    });
  }
});

// Conversations for ONE-WAY hooks too (current product behaviour: every
// hook opens a chat row for both sides). Canonical pair, dedup with the
// mutual ones above.
const convPairs = new Set(conversations.map((c) => `${c.userAId}::${c.userBId}`));
hooks.forEach((h) => {
  const [a, b] = [h.fromUserId, h.toUserId].sort();
  const key = `${a}::${b}`;
  if (convPairs.has(key)) return;
  convPairs.add(key);
  const now = new Date().toISOString();
  conversations.push({
    id: cuid(), matchId: null, userAId: a, userBId: b,
    interactionSeconds: 0, capSeconds: 900, locked: false,
    createdAt: now, updatedAt: now
  });
});

console.log(`built:
  users: ${users.length}
  photos: ${photos.length}
  userPrompts: ${userPrompts.length}
  hooks: ${hooks.length}
  matches: ${matches.length}
  conversations: ${conversations.length}`);

// ────────────────────────────────────────────────────────────────────────
// SQL emit
// ────────────────────────────────────────────────────────────────────────

const userSql = `INSERT INTO "User"
  (id, "authId", email, name, age, bio, gender, orientation, "showMe",
   height, location, intentions, "relationshipType",
   "qrCode", "accessTier", verified, "foundingMember", paused,
   "filterAgeMin", "filterAgeMax", "createdAt", "updatedAt", "lastSeenAt")
VALUES
${users.map((u) => `(${sqlStr(u.id)}, NULL, ${sqlStr(u.email)}, ${sqlStr(u.name)}, ${sqlNum(u.age)}, ${sqlStr(u.bio)}, ${sqlStr(u.gender)}::"Gender", ${sqlStr(u.orientation)}::"Orientation", ${sqlArr(u.showMe)}::"Gender"[], ${sqlStr(u.height)}, ${sqlStr(u.location)}, ${sqlStr(u.intentions)}, ${sqlStr(u.relationshipType)}, ${sqlStr(u.qrCode)}, '${u.accessTier}'::"AccessTier", ${sqlBool(u.verified)}, ${sqlBool(u.foundingMember)}, ${sqlBool(u.paused)}, ${u.filterAgeMin}, ${u.filterAgeMax}, ${sqlStr(u.createdAt)}, ${sqlStr(u.updatedAt)}, ${sqlStr(u.lastSeenAt)})`).join(",\n")}
ON CONFLICT (email) DO NOTHING;`;

const photoSql = `INSERT INTO "Photo" (id, "userId", url, "publicId", position, "createdAt")
VALUES
${photos.map((p) => `(${sqlStr(p.id)}, ${sqlStr(p.userId)}, ${sqlStr(p.url)}, ${sqlStr(p.publicId)}, ${p.position}, ${sqlStr(p.createdAt)})`).join(",\n")}
ON CONFLICT DO NOTHING;`;

const promptSql = userPrompts.length === 0 ? null : `INSERT INTO "UserPrompt" (id, "userId", "promptId", answer, position, "createdAt")
VALUES
${userPrompts.map((up) => `(${sqlStr(up.id)}, ${sqlStr(up.userId)}, ${sqlStr(up.promptId)}, ${sqlStr(up.answer)}, ${up.position}, ${sqlStr(up.createdAt)})`).join(",\n")}
ON CONFLICT ("userId", "promptId") DO NOTHING;`;

const hookSql = hooks.length === 0 ? null : `INSERT INTO "Hook" (id, "fromUserId", "toUserId", "targetType", "photoId", "userPromptId", "promptId", note, "isHardHook", seen, "createdAt")
VALUES
${hooks.map((h) => `(${sqlStr(h.id)}, ${sqlStr(h.fromUserId)}, ${sqlStr(h.toUserId)}, ${sqlStr(h.targetType)}::"HookTarget", NULL, NULL, NULL, NULL, ${sqlBool(h.isHardHook)}, ${sqlBool(h.seen)}, ${sqlStr(h.createdAt)})`).join(",\n")}
ON CONFLICT ("fromUserId", "toUserId") DO NOTHING;`;

const matchSql = matches.length === 0 ? null : `INSERT INTO "Match" (id, "userAId", "userBId", "createdAt")
VALUES
${matches.map((m) => `(${sqlStr(m.id)}, ${sqlStr(m.userAId)}, ${sqlStr(m.userBId)}, ${sqlStr(m.createdAt)})`).join(",\n")}
ON CONFLICT ("userAId", "userBId") DO NOTHING;`;

const convSql = conversations.length === 0 ? null : `INSERT INTO "Conversation" (id, "matchId", "userAId", "userBId", "interactionSeconds", "capSeconds", locked, "createdAt", "updatedAt")
VALUES
${conversations.map((c) => `(${sqlStr(c.id)}, ${c.matchId ? sqlStr(c.matchId) : "NULL"}, ${sqlStr(c.userAId)}, ${sqlStr(c.userBId)}, ${c.interactionSeconds}, ${c.capSeconds}, ${sqlBool(c.locked)}, ${sqlStr(c.createdAt)}, ${sqlStr(c.updatedAt)})`).join(",\n")}
ON CONFLICT DO NOTHING;`;

// ────────────────────────────────────────────────────────────────────────
// Send
// ────────────────────────────────────────────────────────────────────────

async function send(name, sql) {
  if (!sql) { console.log(`skip ${name}`); return; }
  process.stdout.write(`${name} … `);
  await q(sql);
  console.log("ok");
}

await send("users", userSql);
await send("photos", photoSql);
await send("userPrompts", promptSql);
await send("hooks", hookSql);
await send("matches", matchSql);
await send("conversations", convSql);

console.log("\nverify:");
const counts = await q(`SELECT
  (SELECT count(*) FROM "User") as users,
  (SELECT count(*) FROM "Photo") as photos,
  (SELECT count(*) FROM "UserPrompt") as user_prompts,
  (SELECT count(*) FROM "Hook") as hooks,
  (SELECT count(*) FROM "Match") as matches,
  (SELECT count(*) FROM "Conversation") as conversations;`);
console.log(counts.value);
