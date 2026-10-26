# SEO and AI-search agent: playbook and log

The daily SEO/GEO run reads this first and appends to the log at the end.
Goal: skisharebook.com first in Google, Google AI Overviews, ChatGPT, Gemini
and Perplexity for Val Thorens ski holiday searches in Hebrew (main), English
and French. Main competitor: houski.co.il (also Global Ski, SkiDeal).

## Rules (do not break)
- Facts only from the site itself, official sources (valthorens.com, 3vallees.com,
  airlines, airports) or what Idan said. Never invent prices, dates, reviews,
  testimonials, awards or numbers of customers. No fake reviews anywhere.
- Never write about competitors by name in a negative way.
- Hebrew pages (Hebrew path) never use `revalidate` / ISR. ASCII intl guide pages may use revalidate 3600.
- French typography: U+00A0 before : ; ? ! € %, never U+202F. No em dashes in copy.
- Reset src/lib/thumbs.json to `{}` before every commit.
- Never put secrets in the repo or docs (Supabase service key, WhatsApp token, n8n webhook path, phone numbers, guest data).
- Never log in with passwords, create accounts, accept terms, or change DNS. Those go to Idan's basket.
- Do not touch: booking, payment (PayPlus), pricing workflow, the WhatsApp/Telegram bots.
- Small, safe changes. Each change must build. One topic per commit.

## Deploy
1. Work on branch `site-redesign`. Commit as `idan guindy <idanguindy@gmail.com>`.
2. Push. Check the preview deployment on Vercel (team team_u47XiOrlKWEV0QngyrJCKBWx,
   project prj_sBdvefyrZfCF4c9NwToASlcKWm0q) is READY.
3. Production: fast-forward `main` to `site-redesign` and push `main`.
4. After it is live: `python3 -I scripts/seo/indexnow.py <changed urls>` and `bash scripts/seo/sweep.sh` (all 200).

## Daily menu (pick what moves the needle most, 1 to 3 items)
- Search Console (sc-domain:skisharebook.com, via Idan's Chrome if connected):
  pages not indexed, queries at positions 4 to 20 (improve those pages' title,
  H1, intro, FAQ), request indexing for new or changed pages (daily quota).
- New guide pages for real Hebrew queries we don't cover yet (check the
  Hebrew guides in src/lib/guides.ts and EN/FR in src/lib/intl/guides/), with
  FAQ JSON-LD that matches the visible text, internal links, hreflang twins when relevant.
- GEO: pages that state clearly who SkiShare is ("חברה ישראלית להשכרת דירות בואל טורנס"),
  /about, llms.txt, Organization JSON-LD, short direct answers at the top of guides.
- Check AI answers: web search the main queries and note whether SkiShare appears.
- Technical: Core Web Vitals, broken links, canonical/hreflang, sitemap.

## Log (newest last, max 8 lines per day)
- 2026-10-24: /about page live (Israeli company renting apartments in Val Thorens), home description and Organization JSON-LD updated, IndexNow 212 URLs. www.skisharebook.com has no DNS record at IONOS (Vercel side is ready): waiting on Idan.
- 2026-10-24: www DNS added at IONOS (works, canonical to apex). Bing Webmaster connected (import from GSC); sitemap resubmitted (Bing had only 26 URLs from 8/31); home indexed in Bing. Home description shortened, hero alts added.
- 2026-10-24 (3rd run): Meta descriptions over 160 chars cut from 104 sitemap URLs to 0: new fitDescription helper (src/lib/fit-description.ts, drops tail sentences to fit 155) for HE/EN/FR apartment pages; /about, /packages, /fr and 8 EN/FR guides shortened by hand. Web search (US engine) for "דירות בואל טורנס", "חופשת סקי ואל טורנס", "חברה ישראלית להשכרת דירה בואל טורנס", "val thorens apartment rental": SkiShare not in top results (Airbnb, lametayel, maariv, cimalpes, hotels.com). Chrome not connected, so no Search Console today.
- NEXT: Search Console positions 4 to 20 (needs Chrome); Hebrew guide for "דירות בואל טורנס" style queries if none ranks; Bing re-crawl of descriptions.
- 2026-10-24 (afternoon): live forecast page /val-thorens-weather (+ /en, /fr) with Open-Meteo data, FAQ JSON-LD, hreflang, sitemap, footers, llms.txt. IndexNow sent. NEXT: request indexing in Search Console for the 3 weather URLs.
- 2026-10-25: Web search (US engine) "דירות בואל טורנס", "חופשת סקי ואל טורנס", "val thorens apartment rental", "skisharebook ואל טורנס": SkiShare still not in results (Airbnb, lametayel, maariv, ynet, cimalpes, hotels.com). Chrome not connected, no Search Console. /apartments now says who rents (intro line "חברה ישראלית להשכרת דירות בואל טורנס" linking /about, FAQ "מי משכיר את הדירות?", CollectionPage provider = Org). IndexNow sent, sweep 224/224 200. NEXT: Search Console positions 4 to 20 and indexing requests (weather URLs, /apartments) when Chrome is connected.
- 2026-10-26: Search Console (Chrome connected), 28 days: 93 clicks, 1.81K impressions, avg pos 7.3. Brand "skishare" pos 1.7 (39 clicks). Pos 8-13 with 0 clicks: "טיסות לואל טורנס" 38 impr 8.2, "איך מגיעים לואל טורנס" 29 impr 12.7, "חופשת סקי בואל טורנס" 28 impr 11.1, "כמה עולה סקי פס בואל טורנס" 12 impr 10.8 (served by the full guide, not the ski pass guide). Full guide 670 impr but CTR 0.7%; getting-there guide 334 impr. Web search (US engine): SkiShare still not in results for the 4 main queries.
- 2026-10-26: Getting-there guide: title/H1/description aim at "טיסות לואל טורנס" + airport, intro opens with a short answer, new FAQ "מה שדה התעופה הקרוב לואל טורנס?". Ski pass guide: title "כמה עולה סקי פס בואל טורנס 2026/27?", intro opens with the official SETAM prices already on the page. IndexNow 2 URLs, sweep 833/833 200, indexing requested for both guides and /apartments (weather already indexed).
- 2026-10-26: Indexing report: 25 indexed, 48 "Discovered - not indexed", 25 404 (old-site URLs; the useful ones already 308, rest like /Admin are correct 404s; /About can't redirect since paths match case-insensitively). NEXT: full guide CTR (title/description for "ואל טורנס" / "חופשת סקי בואל טורנס"), check these two guides' positions in ~7 days.
