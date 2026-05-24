// Cloudinary URL transform helper. Wraps any /image/upload/ URL with
// `w_<width>,q_auto,f_auto` so the asset is served as WebP/AVIF at a
// sensible width — cuts per-image bytes by ~4-5× without code in the DB.
// Non-Cloudinary URLs (Pravatar seed data, hot-linked test images) pass
// through unchanged.

export function thumb(url: string | null | undefined, width = 600): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com")) return url;
  if (url.includes("/upload/w_") || url.includes("/upload/f_") || url.includes("/upload/q_")) {
    return url; // already transformed
  }
  return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
}

// Single-arg helpers used at common feed sizes.
export const thumbFeed = (u: string | null | undefined) => thumb(u, 600);
export const thumbAvatar = (u: string | null | undefined) => thumb(u, 200);
