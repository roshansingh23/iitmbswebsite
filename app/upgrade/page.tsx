import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { getConfigInt } from "@/lib/config";

export const dynamic = "force-dynamic";

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default async function UpgradePage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  const [plusPriceMen, insightsPriceWomen, extensionPrice, plusDays] = await Promise.all([
    getConfigInt("plusPriceMen"),
    getConfigInt("insightsPriceWomen"),
    getConfigInt("chatExtensionPrice"),
    getConfigInt("plusDurationDays")
  ]);

  const tiers = [
    {
      name: "Plus",
      blurb: "More hooks, hard hooks, and unlimited search.",
      price: inr(plusPriceMen),
      meta: `${plusDays} days`,
      audience: "Recommended for men"
    },
    {
      name: "Insights",
      blurb: "See who hooked you, trust signals, priority placement.",
      price: inr(insightsPriceWomen),
      meta: `${plusDays} days`,
      audience: "Built for women"
    },
    {
      name: "Chat top-up",
      blurb: "Add more conversation time. Stackable.",
      price: inr(extensionPrice),
      meta: "One-time",
      audience: "Anyone"
    }
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 lg:px-10 py-14">
        <p className="eyebrow">Levelling up</p>
        <h1 className="display text-5xl md:text-6xl mt-3">
          Pick what you need.<br/>
          <span className="italic">Skip what you don't.</span>
        </h1>

        <ul className="mt-14 space-y-6">
          {tiers.map((t) => (
            <li key={t.name} className="card-line p-7 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="eyebrow">{t.audience}</p>
                <h2 className="display text-3xl mt-2">{t.name}</h2>
                <p className="mt-3 text-muted max-w-md">{t.blurb}</p>
              </div>
              <div className="md:text-right">
                <p className="display text-3xl">{t.price}</p>
                <p className="text-xs text-muted mt-1">{t.meta}</p>
                <button className="btn-ink mt-4" disabled>Coming soon</button>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-xs text-muted max-w-md">
          Safety features — block, report, unmatch — are always free and never paywalled.
        </p>
      </div>
    </AppShell>
  );
}
