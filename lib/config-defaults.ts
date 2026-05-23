// Defaults the seed installs into the Config table. These keys are the only
// ones the app reads — change them at runtime in Prisma Studio without a
// redeploy.
export const DEFAULT_CONFIG = {
  freeDailyProfileLimit: 12,
  freeDailyHookLimit: 5,
  freeChatCapSeconds: 900,        // 15 minutes of active interaction
  paidChatCapSeconds: 14400,      // 4 hours
  chatExtensionSeconds: 3600,     // each top-up = 1 hour
  plusPriceMen: 19900,            // ₹199.00 — paise
  insightsPriceWomen: 49900,      // ₹499.00 — paise
  chatExtensionPrice: 9900,       // ₹99.00
  plusDurationDays: 7,
  foundingMemberLimit: 500,
  activeWindowSeconds: 120        // both users must have pinged within 120s
                                  // for the interaction timer to advance
} as const;

export type ConfigKey = keyof typeof DEFAULT_CONFIG;
