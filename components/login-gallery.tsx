import Image from "next/image";

const IMG_A = "https://ceranna.com/wp-content/uploads/2017/03/mg_7929.jpg";
const IMG_B =
  "https://eddinscounseling.com/wp-content/uploads/17-Social-Distancing-Date-Night-Activities-960x640.jpg";

// 10 tiles on a 4×6 grid. The mix of spans (2×2, 2×1, 1×2, 1×1) gives a
// magazine-collage feel; each tile fades in and out on its own schedule.
// Durations and delays are chosen so peaks rarely coincide — the overall
// rhythm reads as breathing, not strobing.
type Tile = {
  className: string;
  src: string | null;
  dur: number;       // seconds per full cycle
  delay: number;     // ms before first cycle
};

const TILES: Tile[] = [
  { className: "col-span-2 row-span-2", src: IMG_A, dur: 7,   delay: 0    },
  { className: "col-span-2 row-span-1", src: null,  dur: 5.5, delay: 1200 },
  { className: "col-span-1 row-span-1", src: null,  dur: 6,   delay: 2400 },
  { className: "col-span-1 row-span-1", src: IMG_B, dur: 8,   delay: 600  },
  { className: "col-span-1 row-span-2", src: null,  dur: 7,   delay: 3000 },
  { className: "col-span-1 row-span-1", src: null,  dur: 6.5, delay: 1800 },
  { className: "col-span-2 row-span-2", src: IMG_B, dur: 9,   delay: 900  },
  { className: "col-span-1 row-span-1", src: null,  dur: 5,   delay: 2100 },
  { className: "col-span-2 row-span-1", src: IMG_A, dur: 7.5, delay: 2700 },
  { className: "col-span-2 row-span-1", src: null,  dur: 6.5, delay: 3300 }
];

export function LoginGallery() {
  return (
    <div className="absolute inset-0 grid grid-cols-4 grid-rows-6 gap-2 p-4">
      {TILES.map((t, i) => (
        <figure
          key={i}
          className={
            "tile-breathe relative overflow-hidden border border-hairline rounded-[4px] bg-tint " +
            t.className
          }
          style={
            {
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              ["--breathe-dur" as any]: `${t.dur}s`,
              ["--breathe-delay" as any]: `${t.delay}ms`
            }
          }
        >
          {t.src && (
            <Image
              src={t.src}
              alt=""
              fill
              sizes="25vw"
              className="object-cover"
            />
          )}
        </figure>
      ))}
    </div>
  );
}
