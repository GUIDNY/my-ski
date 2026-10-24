/**
 * a meta description that fits search snippets (Bing flags over 160 chars):
 * the sentences in order, dropping the optional tail ones until it fits
 */
export function fitDescription(sentences: string[], max = 155) {
  const parts = sentences.filter(Boolean);
  while (parts.length > 1 && parts.join(" ").length > max) parts.pop();
  const s = parts.join(" ");
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,:;\s]+$/, "") + "…";
}
