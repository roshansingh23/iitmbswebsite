// Marquee of date spots scrolling right-to-left. Each row is duplicated so
// the loop is seamless. The component is intentionally placed inside the
// same max-width container as the heading so the side-fade aligns with the
// heading column instead of running to the page edge.

const ROW_ONE = [
  "Besant Nagar Beach",
  "Elliot's Beach",
  "Theosophical Society",
  "Amethyst, Royapettah",
  "Writer's Cafe",
  "Mylapore Tank",
  "Marina at sunrise",
  "Mahabalipuram"
];

const ROW_TWO = [
  "Cholamandal Village",
  "Anna Centenary Library",
  "Adyar Boardwalk",
  "Pondicherry promenade",
  "Higginbothams",
  "DakshinaChitra",
  "Kalakshetra",
  "Sandy's Chocolate Lab"
];

function Tile({ label }: { label: string }) {
  return (
    <figure className="shrink-0 w-[260px] sm:w-[300px] md:w-[340px]">
      <div
        className="bg-tint border border-hairline rounded-[4px] overflow-hidden relative"
        style={{ aspectRatio: "4/3", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
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
      </div>
      <figcaption className="mt-3 text-sm font-medium text-ink tracking-[-0.005em]">
        {label}
      </figcaption>
    </figure>
  );
}

function Row({ items, speed }: { items: string[]; speed: string }) {
  // Duplicate so the marquee loops without a visible jump.
  const doubled = [...items, ...items];
  return (
    <div className="marquee-mask overflow-hidden">
      <div className="marquee-row" style={{ ["--marquee-speed" as any]: speed }}>
        {doubled.map((label, i) => (
          <Tile key={i} label={label} />
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
          <p className="mt-6 max-w-xl text-base md:text-lg leading-relaxed text-ink/85">
            A short list of places people on the app actually go. Pick one,
            put your phone away, and let the conversation do the rest.
          </p>
        </div>

        <div className="mt-14 space-y-5">
          <Row items={ROW_ONE} speed="55s" />
          <Row items={ROW_TWO} speed="75s" />
        </div>
      </div>
    </section>
  );
}
