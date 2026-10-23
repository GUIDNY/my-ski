import THUMBS from "./thumbs.json";

/*
 * The card-size copies of an apartment's first photo (scripts/thumbs.mjs
 * makes them before every build). For any other photo, or when the build
 * couldn't make them, the original.
 */
const map = THUMBS as Record<string, Record<string, string>>;

/** <img> props for a listing card photo: srcSet + sizes when there are copies */
export function cardImage(url: string | null | undefined, fallback: string) {
  const src = url || fallback;
  const t = url ? map[url] : undefined;
  if (!t?.["480"] || !t["960"]) return { src };
  return {
    src: t["960"],
    srcSet: `${t["480"]} 480w, ${t["960"]} 960w`,
    // a full-width card on a phone, a third of the page on a computer
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px",
  };
}
