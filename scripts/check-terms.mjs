import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Parser } from "htmlparser2";
import { linkTerms, translateTexts } from "../public/assets/terms.js";

// Every language finds the same terms and gives each one a hover hint.
const samples = {
  es: "Smart Import, Smart Imports, flujo, flujos, acción, acciones, agentes",
  en: "Smart Imports, flow, flows, action, actions, agents",
  pt: "Smart Imports, fluxo, fluxos, ação, ações, agentes",
  fr: "Smart Imports, flux, action, actions, agents",
  de: "Smart Imports, Ablauf, Abläufe, Aktion, Aktionen, Agenten",
  it: "Smart Imports, flusso, flussi, azione, azioni, agenti",
};
for (const [language, text] of Object.entries(samples)) {
  const linked = linkTerms(text, language);
  assert.equal(linked.replace(/<[^>]+>/g, ""), text, language);
  for (const id of ["smart-imports", "flow", "action", "agent"]) {
    assert(linked.includes(`data-term="${id}"`), `${language}: ${id}`);
  }
  assert(linked.includes('title="'), `${language}: no hover hint`);
  assert(!linked.includes("<a "), `${language}: a term must not be a link`);
}
assert.equal(linkTerms("actionable workflow agentless", "en"), "actionable workflow agentless");
assert.equal(linkTerms("<img onerror='x'> &", "en"), "&lt;img onerror=&#39;x&#39;&gt; &amp;");

// Edge and browser translation rebuild the terms for the chosen language.
const source = '<p data-i18n="example" data-terms>Old <span class="term">flujo</span>.</p>';
const translated = translateTexts(source, { example: "Flow and actions." }, "en");
assert.equal(translated.replace(/<[^>]+>/g, ""), "Flow and actions.");
assert.equal((translated.match(/data-term=/g) || []).length, 2);
assert.equal(translateTexts(translated, { example: "Flow and actions." }, "en"), translated);
assert.equal(translateTexts(source, {}, "en"), source);

// In the built pages a term carries its hint and never sits inside a control.
for (const path of ["public/index.html", "public/pricing.html"]) {
  const stack = [];
  let terms = 0;
  const parser = new Parser({
    onopentag(tag, attrs) {
      if (attrs["data-term"]) {
        const inside = ["a", "button", "label", "summary", "select"].some((p) => stack.includes(p));
        assert(!inside, `${path}: ${attrs["data-term"]} term inside a control`);
        assert(attrs.title, `${path}: ${attrs["data-term"]} has no hover hint`);
        terms++;
      }
      stack.push(tag);
    },
    onclosetag() {
      stack.pop();
    },
  });
  parser.end(readFileSync(path, "utf8"));
  const minimum = path.endsWith("index.html") ? 10 : 3;
  assert(terms > minimum, `${path}: too few product terms (${terms})`);
}
console.log("Product terms, hover hints, escaping, translation and control boundaries: OK");
