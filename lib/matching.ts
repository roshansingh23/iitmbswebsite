import type { Gender, Orientation } from "@prisma/client";

// "I am G with orientation O" — who do I want shown?
// "Show me" is the user-controlled gender filter on top of orientation logic.
export function gendersIWant(meOrientation: Orientation | null, meGender: Gender | null, meShowMe: Gender[]): Gender[] {
  // showMe is the source of truth at the UI layer — orientation just informs
  // the default. If the user has explicitly set showMe, honor it.
  if (meShowMe && meShowMe.length > 0) return meShowMe;

  // Sensible defaults from orientation + own gender.
  if (!meGender) return [];
  if (meOrientation === "straight") {
    if (meGender === "man") return ["woman"];
    if (meGender === "woman") return ["man"];
    return ["man", "woman"];
  }
  if (meOrientation === "gay") return ["man"];
  if (meOrientation === "lesbian") return ["woman"];
  if (meOrientation === "bisexual" || meOrientation === "pansexual") {
    return ["man", "woman", "nonbinary", "other"];
  }
  // asexual / other / null — default to everyone visible
  return ["man", "woman", "nonbinary", "other"];
}

// And the inverse — would *I* appear on someone else's feed?
export function wouldIAppearTo(args: {
  myGender: Gender | null;
  theirOrientation: Orientation | null;
  theirGender: Gender | null;
  theirShowMe: Gender[];
}): boolean {
  if (!args.myGender) return false;
  const wanted = gendersIWant(args.theirOrientation, args.theirGender, args.theirShowMe);
  return wanted.includes(args.myGender);
}
