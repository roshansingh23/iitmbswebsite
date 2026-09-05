// Avatar for an anonymous chat.
//
// Nobody uploads a picture here, so we draw one — a little character built
// deterministically from the handle, the way Reddit hands out an avatar to
// an account that never set one.
//
// It is generated from the NAME, never from the member's real photo:
// pulling their Cloudinary picture in here would undo the anonymous layer.
// Deterministic, so both people see the same face for a given handle, with
// no storage and no round trip.

const BACKDROPS = [
  "#6D1F4E", "#2F4858", "#8A5A2B", "#3E5C3A", "#5B3A6E",
  "#1F4E5F", "#7A3B2E", "#40485E", "#4A5D23", "#703D57"
];

// Skin/body fills, kept light so the features read against the backdrop.
const BODIES = ["#F4E4CE", "#EFD8C0", "#F7EDE2", "#E8D5B7", "#FAF0E4"];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Pull independent small numbers out of one hash so the features vary
// separately instead of moving in lockstep.
function pick(h: number, shift: number, mod: number): number {
  return ((h >>> shift) ^ (h * (shift + 7))) % mod;
}

export function AnonAvatar({
  name,
  size = 32,
  className = ""
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const h = hash(name || "?");
  const backdrop = BACKDROPS[h % BACKDROPS.length];
  const body = BODIES[pick(h, 3, BODIES.length)];
  const eyes = pick(h, 7, 4);
  const mouth = pick(h, 11, 4);
  const top = pick(h, 17, 4);

  return (
    <svg
      role="img"
      aria-label={`${name} avatar`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={"shrink-0 " + className}
      style={{
        background: backdrop,
        display: "block",
        // A small squared-off frame rather than a circle. The slight radius
        // and hairline keep it reading as a framed thumbnail at 32px.
        borderRadius: Math.max(4, Math.round(size * 0.18)),
        border: "1px solid rgba(0,0,0,0.10)"
      }}
    >
      {/* Shoulders, clipped by the bottom of the frame. Kept low so the head
          stays the thing you actually read at this size. */}
      <circle cx="32" cy="66" r="20" fill={body} opacity="0.75" />

      {/* Head */}
      <circle cx="32" cy="28" r="19" fill={body} />

      {/* Something on top — ears, tuft, antenna, or nothing */}
      {top === 0 && (
        <>
          <circle cx="17" cy="18" r="5.5" fill={body} />
          <circle cx="47" cy="18" r="5.5" fill={body} />
        </>
      )}
      {top === 1 && (
        <path d="M32 7 L37 16 L27 16 Z" fill={body} />
      )}
      {top === 2 && (
        <>
          <line x1="32" y1="11" x2="32" y2="6" stroke={body} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="4.5" r="3" fill={body} />
        </>
      )}
      {top === 3 && (
        <path d="M15 20 Q32 3 49 20" fill="none" stroke={body} strokeWidth="4" strokeLinecap="round" />
      )}

      {/* Eyes */}
      {eyes === 0 && (
        <>
          <circle cx="26" cy="26" r="2.8" fill={backdrop} />
          <circle cx="38" cy="26" r="2.8" fill={backdrop} />
        </>
      )}
      {eyes === 1 && (
        <>
          <rect x="23" y="23.5" width="5.5" height="5.5" rx="1.2" fill={backdrop} />
          <rect x="35.5" y="23.5" width="5.5" height="5.5" rx="1.2" fill={backdrop} />
        </>
      )}
      {eyes === 2 && (
        <>
          <path d="M22 27 Q26 22 30 27" fill="none" stroke={backdrop} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M34 27 Q38 22 42 27" fill="none" stroke={backdrop} strokeWidth="2.6" strokeLinecap="round" />
        </>
      )}
      {eyes === 3 && (
        <>
          <circle cx="26" cy="26" r="3.6" fill={backdrop} />
          <circle cx="38" cy="26" r="2" fill={backdrop} />
        </>
      )}

      {/* Mouth */}
      {mouth === 0 && (
        <path d="M25 35 Q32 42 39 35" fill="none" stroke={backdrop} strokeWidth="2.6" strokeLinecap="round" />
      )}
      {mouth === 1 && (
        <line x1="27" y1="37" x2="37" y2="37" stroke={backdrop} strokeWidth="2.6" strokeLinecap="round" />
      )}
      {mouth === 2 && (
        <circle cx="32" cy="37" r="3" fill={backdrop} />
      )}
      {mouth === 3 && (
        <path d="M26 39 Q32 33 38 39" fill="none" stroke={backdrop} strokeWidth="2.6" strokeLinecap="round" />
      )}
    </svg>
  );
}
