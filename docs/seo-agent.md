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
1. Work on a branch `seo/<date>-<topic>` off `main`. Commit as `idan guindy <idanguindy@gmail.com>`.
2. Before merging: `npx tsc --noEmit -p .` (ignore errors only in *.test.ts files, they are old) and
   `npx eslint` on the changed files. Both clean.
3. Production: merge into `main` (fast-forward or a normal merge) and push `main`. Vercel deploys it.
4. Check the build: `gh api repos/GUIDNY/my-ski/commits/<sha>/statuses` (context "Vercel"), or the
   Vercel MCP (team team_u47XiOrlKWEV0QngyrJCKBWx, project prj_sBdvefyrZfCF4c9NwToASlcKWm0q).
   A failure in `[next]/internal/font/google/...module.css` (module-not-found) is a known flaky
   Google-font cache error, not your change: redeploy the same commit with the Vercel MCP
   create_deployment (gitSource github GUIDNY/my-ski ref main, that sha, target production, forceNew 1).
   Any other build error: fix it, or revert your commit, so main always builds.
5. After it is live: `python3 -I scripts/seo/indexnow.py <changed urls>` and `bash scripts/seo/sweep.sh` (all 200).

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

## New articles (the main job: one new guide per run)
Every run publishes one new, fully sourced Hebrew guide (src/lib/guides.ts, same Guide format and
style as the existing ones: short direct answer in the intro, tables, FAQ that matches the text,
internal links to /packages /apartments /weekly /transfers and to related guides, `sources` for every
fact, `published` and `updated` = today). A topic that would compete with an existing guide's main
query is not new: improve that guide instead. When a topic also fits English/French visitors, an
EN/FR twin can follow in a later run. Pick the most timely open topic (the season dates come first:
in November and December, the December weeks and New Year), then mark it done here with the date
and URL. Add new topic ideas from Search Console queries and real Hebrew searches.

Open topics (Hebrew queries):
- [ ] סקי בדצמבר בואל טורנס (שלג ופתיחה, מחירים זולים לפני 19.12, שבועות שקטים). Note 2026-11-10: the Hanukkah (28.11-19.12) and New Year (19.12-9.1) guides already cover every December week; only write it with a clearly different angle (the opening weekend 21.11 and the 21.11 week), else improve those two guides
- [ ] אוכל כשר ושבת בואל טורנס (רק מה שאפשר לאמת: סופרמרקטים, מוצרים, שבת בדירה; בלי להמציא מסעדות)
- [ ] שיעורי סקי בואל טורנס (בתי ספר, גילאים, קבוצה או פרטי, מתי מזמינים)
- [ ] חופשת סקי בפברואר (חופשות בצרפת לפי אזורים, עומס ומחירים, שבועות שקטים)
- [ ] סקי במרץ ובאפריל בואל טורנס (סוף עונה, שלג אביבי, מחירים)
- [ ] חופשת סקי לזוגות בואל טורנס
- [ ] סנובורד למתחילים בואל טורנס
- [ ] מה עושים בואל טורנס חוץ מסקי (ספא, בריכה, פעילויות; רק עם מקור רשמי)
- [ ] כמה עולה חופשת סקי בצרפת לזוג ולמשפחה (פירוט לפי מחירי האתר ומחירונים רשמיים)
- [ ] ואל טורנס מול טין ומול לה פלאן (השוואה עובדתית)
- [ ] גובה ושינה בגובה 2,300 מ' (מה ידוע ממקורות רפואיים מוכרים, בלי ייעוץ רפואי)
- [ ] סקי בפורים 2027
- [ ] נסיעה ברכב לואל טורנס (השכרת רכב בז'נבה/ליון, שרשראות שלג, חניה)
- [ ] EN/FR twin of the opening guide ("val thorens opening weekend 2026", "ouverture val thorens 2026"); after 22.11 update the Hebrew one (opening done, 2027 date when SETAM posts it)
- [ ] Catch-up session (booking.valthorens.com lists one 27-30.11.2026, no details yet): add to the opening guide only once valthorens.com publishes the program
- [ ] EN/FR twin of the January guide ("val thorens in january", "val thorens en janvier")
- [ ] Freeride World Tour stop in Val Thorens (held in late January in 2025 and 2026): only once the 2027 dates are official on freerideworldtour.com / valthorens.com
- [ ] Equipment rental guide follow-up: once WebFetch works in a run, add what a standard rental includes (boots, poles, helmet) from an official source, and confirm with Idan what SkiShare's own rental includes (helmet? kids' sizes?)
- [ ] Insurance guide follow-up: once WebFetch works, add the 2026/27 Carré Neige price per day and the claim steps from ski.valthorens.com/assurance-carre-neige/ and carreneige.com (not on the guide yet)
- [ ] EN/FR twin of the New Year guide ("val thorens new year", "nouvel an val thorens") once valthorens.com publishes the 2026 program

Done:
- 2026-11-13: ביטוח לחופשת סקי → https://skisharebook.com/guide/ביטוח-לחופשת-סקי
- 2026-11-12: פתיחת עונת הסקי בואל טורנס (La Grande Première, the 21.11 and 28.11 weeks) → https://skisharebook.com/guide/פתיחת-עונת-הסקי-בואל-טורנס
- 2026-11-11: השכרת ציוד סקי בואל טורנס → https://skisharebook.com/guide/השכרת-ציוד-סקי-בואל-טורנס
- 2026-11-10: סקי בינואר בואל טורנס → https://skisharebook.com/guide/סקי-בינואר-בואל-טורנס
- 2026-11-10: סילבסטר וחג המולד בואל טורנס → https://skisharebook.com/guide/סילבסטר-וחג-המולד-בואל-טורנס

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
- 2026-10-27: Web search (US engine) "חופשת סקי בואל טורנס", "דירות בואל טורנס", "חברה ישראלית להשכרת דירה בואל טורנס", "val thorens apartment rental": SkiShare still not in results (lametayel, Airbnb, cimalpes, hotels.com). Chrome not connected, no Search Console. Full guide (pos 11.1 for "חופשת סקי בואל טורנס", CTR 0.7%): title/H1/description now lead with "חופשת סקי בואל טורנס" + season dates, new FAQ "כמה עולה חופשת סקי בואל טורנס?" (only site prices, link /packages). IndexNow 1 URL, sweep 831/831 200. NEXT: request indexing for the full guide in Search Console when Chrome is connected; check its CTR/position ~11.03.
- 2026-10-28: Web search (US engine) "דירות בואל טורנס", "איך מגיעים לואל טורנס", "טיסות לואל טורנס", "val thorens apartment rental": SkiShare still not in results (Airbnb, lametayel, cimalpes, hotels.com; the Hebrew queries return mostly noise on this engine). Chrome not connected, no Search Console. New EN/FR twins of the Hebrew family guide: /en/guide/val-thorens-with-kids and /fr/guide/val-thorens-en-famille (schools and nursery by age, free carpets, EasyRider, Family Flex, when to go, FAQ, sources; only facts already on the Hebrew guide), hreflang he/en/fr on all three. IndexNow 6 URLs, sweep 851/851 200. NEXT: request indexing for the two new guides and the full guide in Search Console when Chrome is connected; other Hebrew-only topics to twin: beginners, packing, groups, Courchevel/Méribel comparison.
- 2026-10-29: Web search (US engine) "דירות בואל טורנס", "חופשת סקי בואל טורנס", "val thorens apartment rental Israeli company": SkiShare still not in results (Airbnb, lametayel, hotels.com, cimalpes). Chrome not connected, no Search Console. New EN/FR twins of the Hebrew beginners guide: /en/guide/val-thorens-for-beginners and /fr/guide/ski-debutant-val-thorens (lessons at ESF/Evolution 2/Audacius, free carpets, EasyRider, ski or snowboard, safety, mistakes, week plan, FAQ, sources; only facts on the Hebrew guide, no SkiShare prices, no phone numbers), hreflang he/en/fr. IndexNow 5 URLs, sweep 829/829 200. NEXT: request indexing in Search Console for the beginners and family twins and the full guide when Chrome is connected; remaining twins: packing, groups, Courchevel/Méribel comparison.
- 2026-10-31: Search Console (Chrome connected), 28 days: 107 clicks, 3.02K impressions, avg pos 9.5. Biggest gap: /en/apartments 142 impr at pos 27.1, 0 clicks ("val thorens apartments" 17.1, "apartments val thorens france" 24.5, "val thorens ski apartments" 30.5, "apartment val thorens" 24); /fr/apartments pos 53. Other: "ואל טורנס" 73 impr pos 22.8, "חופשת סקי בואל טורנס" 13.3, "איך מגיעים לואל טורנס" 11.4, "דירות בואל טורנס" 8.2, EN ski pass guide 346 impr pos 10.2. Web search (US engine): SkiShare still not in results for "דירות בואל טורנס", "חופשת סקי בואל טורנס", "val thorens apartment rental Israeli company".
- 2026-10-31: /en/apartments and /fr/apartments: H1 "Val Thorens apartments to rent", intro under H1 saying who rents (Israeli company, own apartments by the night + weekly Sat-Sat), 6-question FAQ (who rents, why Sat-Sat, how many people, what's included, price for your dates, payment; only facts already on the site), CollectionPage (provider = Org, ItemList) + FAQPage + Breadcrumb JSON-LD (these pages had none). IndexNow 2 URLs, sweep 832/832 200, indexing requested in Search Console. NEXT: check /en/apartments position ~11.07; "ואל טורנס" head term (pos 22.8) on the full guide.
- 2026-11-01: Web search (US engine) "דירות בואל טורנס", "ואל טורנס חופשת סקי", "val thorens apartments to rent Israeli company", "skisharebook Val Thorens": SkiShare still not in results (Airbnb, lametayel, ynet, expedia/hotels.com, les3vallees). Chrome not connected, no Search Console. New EN/FR twins of the Hebrew packing guide: /en/guide/what-to-pack-for-a-ski-holiday and /fr/guide/que-mettre-dans-sa-valise-ski (three layers, Météo-France monthly temps already on the Hebrew guide, rent vs bring, documents/insurance, what people forget, checklist, FAQ, sources; no SkiShare equipment/transfer prices since EN/FR don't sell them), hreflang he/en/fr. IndexNow 6 URLs, sweep 828/828 200. NEXT: Search Console when Chrome is connected: /en/apartments position (was 27.1 on 10-31), request indexing for the packing/beginners/family twins and the full guide; remaining twins: groups, Courchevel/Méribel comparison.
- 2026-11-02: Web search (US engine) "דירות בואל טורנס", "חופשת סקי בואל טורנס חברה ישראלית", "val thorens apartments to rent": SkiShare still not in results (Airbnb, lametayel, walla/mako/ynet, expedia/hotels.com, les3vallees, holidu). Chrome: two browsers connected and none selected for scheduled runs, so no Search Console. New EN/FR twins of the Hebrew comparison guide: /en/guide/val-thorens-vs-meribel-vs-courchevel and /fr/guide/val-thorens-meribel-ou-courchevel (short answer on top, table, Méribel/Courchevel/Les Menuires, blue-run day to Courchevel, 6-day pass difference €53.50 from SETAM prices, FAQ, sources; only facts on the Hebrew guide), hreflang he/en/fr. IndexNow 5 URLs, sweep 836/836 200. NEXT: Search Console once a Chrome is selected: /en/apartments position, indexing for the twins and the full guide; last twin left: groups.
- 2026-11-03: Web search (US engine) "דירות בואל טורנס", "חופשת סקי לקבוצות ואל טורנס", "val thorens apartment rental group ski holiday": SkiShare still not in results (Airbnb, lametayel, ynet/maariv, Marriott Homes & Villas, cimalpes, ski-planet, hometogo). Chrome: two browsers connected, none selected, so no Search Console. Last twin done: /en/guide/val-thorens-ski-trip-with-friends and /fr/guide/ski-entre-amis-val-thorens (short answer, apartment by group size, beds/bathrooms/extras, peak and quiet weeks, mixed levels and pass with SETAM prices, après-ski, organiser checklist, FAQ; no Hebrew-only products like packages or split payment), hreflang he/en/fr. IndexNow 5 URLs, sweep 847/847 200. NEXT: Search Console once a Chrome is selected: /en/apartments position, indexing for all twins and the full guide; then the "ואל טורנס" head term on the full guide.
- 2026-11-10: New guide /guide/סילבסטר-וחג-המולד-בואל-טורנס (weeks 19.12/26.12/2.1 table, French Christmas holiday 19.12-4.1, the 2025/26 Christmas and New Year program from valthorens.com labelled as last season, SETAM pass prices before/after 19.12, live weekly prices with count, same-apartment example from 23.10, December/January Météo-France temps, Super 6 + book lessons early, Shabbat part-week, booking steps, 6 FAQ, 16 sources). Linked from the Hanukkah and when-to-go guides. IndexNow 4 URLs, sweep 851/851 200. Cloud run, no Chrome, so no Search Console. The SETAM PDF could not be fetched today, so pass prices reuse the figures already sourced on the Hanukkah guide. NEXT: when valthorens.com posts the 2026/27 New Year program, update that section with the new dates; request indexing for the new guide.
- 2026-11-10 (2nd run): New guide /guide/סקי-בינואר-בואל-טורנס (5 Saturday weeks 2.1-30.1 vs French holidays, live weekly prices 26.12-13.2 with count, same-apartment example from 23.10, SETAM main-period pass table, Family Flex, Météo-France January cold and snow depth, packing, who it suits, Shabbat part-week, booking steps, 6 FAQ, 15 sources). December topic skipped: it overlaps the Hanukkah and New Year guides. WebFetch permission was not answered in this unattended run, so every fact reuses figures already sourced in other guides (SETAM PDF, Météo-France, French school calendar, ESF); nothing new from the web. Linked from the New Year and when-to-go guides. IndexNow 4 URLs, sweep 852/852 200 (one transient timeout, 200 on recheck). No Chrome, no Search Console. NEXT: request indexing for the January and New Year guides.
- 2026-11-11: New guide /guide/השכרת-ציוד-סקי-בואל-טורנס (SkiShare equipment price by ski days 1-8 from equipCost in src/lib/pricing.ts, nights-1 ski days rule, what to send when booking per 3 Vallées, ski vs snowboard, helmet per SETAM/ESF, kids per ESF, bring vs rent, La Grande Première test village, booking steps, 6 FAQ, 13 sources). December and February skipped: they overlap the Hanukkah/New Year and semester guides. WebFetch permission again not answered in this unattended run, so every outside fact reuses figures already sourced in other guides; it does not say what SkiShare's rental includes beyond skis/snowboard (ask us). Linked from the packing and beginners guides. IndexNow 5 URLs, sweep 844/844 200. No Chrome, no Search Console. NEXT: request indexing for the January, New Year and rental guides.
- 2026-11-12: New guide /guide/פתיחת-עונת-הסקי-בואל-טורנס (opening 21.11 and the site calendar, La Grande Première 2026 from the SETAM opening-weekend page: 50+ brands test village, Saturday mountain-film night and stand-up, 2-day pass €105.70; weeks 21.11/28.11 table, November snow per winter and temps from Météo-France, SETAM early-season pass prices, live weekly prices, ESF start dates, Shabbat part-week, booking steps, 6 FAQ, 21 sources). The December topic stays skipped (Hanukkah/New Year cover it); this takes the opening-week angle the note allowed. valthorens.com and ski.valthorens.com/en/home could not be fetched (permission not answered), so the Place Caron detail reuses the source already on other guides. Linked from the Hanukkah and when-to-go guides. IndexNow 4 URLs, sweep 854/854 200. No Chrome, no Search Console.
- 2026-11-13: New guide /guide/ביטוח-לחופשת-סקי (why ski cover: paid piste rescue per SETAM map, ESF/Evolution 2 do not insure students, SkiShare terms 3.3 require winter-sports insurance and packages exclude it; Carré Neige cover per valthorens.com, bought with the pass for the same days; who-covers-what table; 8 questions for the insurer; flight cancelled/war per /emergency-policy and /cancellation-policy; steps and accident checklist with the piste safety number from the SETAM map; 6 FAQ, 12 sources; new shield icon). December, kosher and lessons topics skipped (December/lessons overlap Hanukkah/New Year/beginners; kosher needs new facts). WebFetch permission again not answered, so every outside fact reuses figures already sourced in other guides; no Carré Neige price. Linked from the full and packing guides. IndexNow 4 URLs, sweep 852/852 200. No Chrome, no Search Console. For Idan: /cancellation-policy now shows "ביטוח מלחמה" +€100 while the booking forms (apartment, combo, quote) still sell "ביטול גמיש" +€100 (80%/50%), and the groups guide describes ביטול גמיש; the new guide only links the policy pages, no terms or price.
