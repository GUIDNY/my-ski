import { pageMeta } from "@/lib/page-meta";

// The packages page builds its results in the browser, so search engines
// see an empty page: keep it out of the index (links on it are still
// followed) until it renders content on the server.
export const metadata = pageMeta({
  title: "חבילת סקי לואל טורנס לפי תאריכים | SkiShare",
  description: "בוחרים תאריכים ומספר אנשים, ורואים אילו דירות בואל טורנס פנויות ובכמה, עם סקי פס, הסעה וציוד, במחיר לאדם.",
  path: "/search",
  noindex: true,
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
