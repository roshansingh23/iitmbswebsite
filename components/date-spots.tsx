import Image from "next/image";

type Spot = { label: string; src?: string };

const ROW_ONE: Spot[] = [
  {
    label: "Besant Nagar Beach",
    src: "https://eddinscounseling.com/wp-content/uploads/17-Social-Distancing-Date-Night-Activities-960x640.jpg"
  },
  { label: "Elliot's Beach" },
  { label: "Theosophical Society" },
  { label: "Amethyst, Royapettah" },
  { label: "Writer's Cafe" },
  { label: "Mylapore Tank" },
  { label: "Marina at sunrise" },
  { label: "Mahabalipuram" }
];

const ROW_TWO: Spot[] = [
  { label: "Cholamandal Village" },
  { label: "Anna Centenary Library" },
  { label: "Adyar Boardwalk" },
  { label: "Pondicherry promenade" },
  { label: "Higginbothams" },
  { label: "DakshinaChitra" },
  { label: "Kalakshetra" },
  { label: "Sandy's Chocolate Lab" }
];

function Tile({ spot }: { spot: Spot }) {
  return (
    <figure className="shrink-0 w-[260px] sm:w-[300px] md:w-[340px]">
      <div
        className="bg-tint border border-hairline rounded-[4px] overflow-hidden relative"
        style={{ aspectRatio: "4/3", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        {spot.src ? (
          <Image
            src={spot.src}
            alt={spot.label}
            fill
            sizes="340px"
            className="object-cover"
          />
        ) : (
          <span
            className="absolute top-3 left-3"
            style={{
              fontSize: "0.55rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--muted)",
              fontWeight: 600
            }}
          >
            Photo
          </span>
        )}
      </div>
      <figcaption className="mt-3 text-sm font-medium text-ink tracking-[-0.005em]">
        {spot.label}
      </figcaption>
    </figure>
  );
}

function Row({ items, speed }: { items: Spot[]; speed: string }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee-mask overflow-hidden">
      <div className="marquee-row" style={{ ["--marquee-speed" as any]: speed }}>
        {doubled.map((s, i) => (
          <Tile key={i} spot={s} />
        ))}
      </div>
    </div>
  );
}

export function DateSpots() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32">
        <div className="max-w-3xl">
          <p className="eyebrow">Off the app</p>
          <h2 className="mt-4 display text-4xl md:text-5xl lg:text-6xl">
            Spend time with<br/>
            <span className="display-italic font-medium">your date.</span>
          </h2>
        </div>

        <div className="mt-14 space-y-5">
          <Row items={ROW_ONE} speed="55s" />
          <Row items={ROW_TWO} speed="75s" />
        </div>
      </div>
    </section>
  );
}
