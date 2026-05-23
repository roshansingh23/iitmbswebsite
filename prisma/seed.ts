import { PrismaClient } from "@prisma/client";
import { DEFAULT_CONFIG } from "../lib/config-defaults";
import { PROMPT_BANK } from "../lib/prompts";

const prisma = new PrismaClient();

async function main() {
  // Config (idempotent)
  for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
    await prisma.config.upsert({
      where: { key },
      update: {},
      create: { key, value: String(value) }
    });
  }

  // Prompt bank
  for (const text of PROMPT_BANK) {
    await prisma.prompt.upsert({
      where: { text },
      update: { active: true },
      create: { text, active: true }
    });
  }

  console.log("Seeded config + prompts.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
