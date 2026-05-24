import { redirect } from "next/navigation";

// Discover now shows the full profile inline (photos + prompts + info card).
// This route used to be the "open profile" detail page; redirecting any old
// links to discover so nothing breaks.
export default function LegacyProfileRedirect() {
  redirect("/discover");
}
