import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { GUIDE_PAIRS, guidePair, pathInLang } from "./config.ts";

const SKI_PASS_HE = "/guide/מחיר-סקי-פס-ואל-טורנס";

test("the language switch on a guide goes to the same guide", () => {
  assert.equal(pathInLang("/en/guide/val-thorens-ski-pass-prices", "", "fr"), "/fr/guide/prix-forfait-val-thorens");
  assert.equal(pathInLang("/fr/guide/prix-forfait-val-thorens", "", "he"), encodeURI(SKI_PASS_HE));
  assert.equal(pathInLang(encodeURI(SKI_PASS_HE), "", "en"), "/en/guide/val-thorens-ski-pass-prices");
  assert.equal(pathInLang(SKI_PASS_HE, "", "fr"), "/fr/guide/prix-forfait-val-thorens");
  // no Hebrew guide on this topic: the Hebrew list of guides
  assert.equal(pathInLang("/en/guide/val-thorens-apartment-prices", "", "he"), "/guide");
  // a Hebrew guide with no English one: the English list
  assert.equal(pathInLang(encodeURI("/guide/חופשת-סקי-בחנוכה"), "", "en"), "/en/guide");
  assert.equal(pathInLang("/en/guide", "?x=1", "fr"), "/fr/guide");
  assert.equal(pathInLang("/fr/guide/", "", "he"), "/guide");
  assert.equal(pathInLang("/guide", "", "en"), "/en/guide");
});

test("the language switch on other pages is unchanged", () => {
  assert.equal(pathInLang("/en/apartments", "?checkin=2027-01-09&checkout=2027-01-16", "fr"), "/fr/apartments?checkin=2027-01-09&checkout=2027-01-16");
  assert.equal(pathInLang("/en/guidebook", "", "fr"), "/fr");
  assert.equal(pathInLang("/en", "", "he"), "/");
  assert.equal(pathInLang("/weekly", "", "en"), "/en");
});

test("every guide: unique ASCII addresses, a text in English and in French, a Hebrew twin that exists", () => {
  const slugs = GUIDE_PAIRS.flatMap(p => [p.en, p.fr]);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.equal(new Set(GUIDE_PAIRS.map(p => p.key)).size, GUIDE_PAIRS.length);
  const hebrewGuides = readFileSync(new URL("../guides.ts", import.meta.url), "utf8");
  for (const p of GUIDE_PAIRS) {
    for (const lang of ["en", "fr"] as const) {
      assert.match(p[lang], /^[a-z0-9]+(-[a-z0-9]+)*$/);
      assert.equal(guidePair(lang, p[lang]), p);
      const file = new URL(`./guides/${p.key}.${lang}.json`, import.meta.url);
      assert.ok(existsSync(file), `${p.key}.${lang}.json`);
      const g = JSON.parse(readFileSync(file, "utf8"));
      assert.equal(g.key, p.key);
      assert.equal(g.lang, lang);
    }
    if (p.he) {
      assert.ok(hebrewGuides.includes(`slug: "${p.he}"`), `Hebrew guide ${p.he}`);
      assert.equal(guidePair("he", encodeURIComponent(p.he)), p);
    }
  }
});
