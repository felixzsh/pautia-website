/* The edge decides the language and the money, so a visitor never sees the wrong
 * one and never has to go looking for the switch.
 *
 * This is a Worker with the site as static assets: the pages are the same files
 * as always, and this only stands in front of the landing page (see
 * run_worker_first in wrangler.jsonc) to hand it over in the right language.
 * Everything else — the stylesheet, the dictionaries, the legal pages — is served
 * straight from the assets and never reaches this code.
 *
 * Which language, in order:
 *   1. the visitor's own choice, if they made one (the cookie the picker sets);
 *   2. crawlers get the language the page is written in, so what gets indexed is
 *      what was written, and the card a post shares says the same as the page;
 *   3. what the browser asks for in Accept-Language;
 *   4. the country, for a visitor whose browser asked for none of the languages
 *      we ship;
 *   5. otherwise the page's own language.
 *
 * The country also picks the money the page opens in, which it passes on as
 * data-currency. Prices stay in dollars in the markup; the page converts them.
 *
 * On localhost there is no Worker: `make serve` serves the files as they are and
 * the page opens in its own language and dollars. To exercise this code locally,
 * `make edge`.
 *
 * The body is read and rewritten in one pass instead of streamed through
 * HTMLRewriter on purpose: that API hands the JSON-LD script over in fragments,
 * which cannot be parsed, and 42 KB is well inside the CPU a request may use.
 */

import en from "../public/assets/i18n/en.json";
import pt from "../public/assets/i18n/pt.json";
import fr from "../public/assets/i18n/fr.json";

const DEFAULT = "es";
const SHIPPED = ["es", "en", "pt", "fr"];

// A language that is not the page's own arrives as one of these files. The
// page's own language has none: it is the text already in the markup.
const DICTIONARIES = { en, pt, fr };

// Where the browser said nothing we could use. Spanish by default: that is the
// page's own language, so an unknown request is never handed an English one.
const ENGLISH_SPOKEN = new Set(["US", "GB", "IE", "AU", "NZ", "CA", "SG"]);

// Where the visitor is, turned into the money they think in. Only the countries
// whose currency the page offers: anyone else gets dollars, which is what the
// page is priced in and what the prices are actually charged in.
const CURRENCY = {
  EUR: ["AD", "AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE",
        "IT", "LT", "LU", "LV", "MC", "ME", "MT", "NL", "PT", "SI", "SK", "SM",
        "VA", "XK"],
  USD: ["EC", "PA", "PR", "SV", "TL", "US", "ZW"],
  GBP: ["GB", "GG", "IM", "JE"],
  AUD: ["AU", "KI", "NR", "TV"],
  CHF: ["CH", "LI"],
  BRL: ["BR"],
  CAD: ["CA"],
  CLP: ["CL"],
  INR: ["IN"],
  JPY: ["JP"],
  MAD: ["MA"],
  MXN: ["MX"],
  MYR: ["MY"],
  PEN: ["PE"],
  RON: ["RO"],
  SGD: ["SG"],
};
const BY_COUNTRY = Object.fromEntries(
  Object.entries(CURRENCY).flatMap(([code, countries]) =>
    countries.map((country) => [country, code])));

function cookie(request, name) {
  const found = (request.headers.get("cookie") || "")
    .match(new RegExp(`(?:^|;\\s*)${name}=([\\w-]+)`));
  return found ? found[1] : null;
}

function preferred(header) {
  // The best-ranked language among the ones we ship: "es;q=0.9, en;q=0.8".
  const ranked = (header || "").split(",").map((part, order) => {
    const [code, ...params] = part.trim().split(";");
    const quality = params.map((p) => p.trim()).reduce((acc, p) => {
      const value = p.match(/^q=([\d.]+)$/);
      return value ? Number(value[1]) : acc;
    }, 1);
    return { code: code.trim().toLowerCase().split("-")[0], quality, order };
  }).filter((entry) => SHIPPED.includes(entry.code));
  ranked.sort((a, b) => b.quality - a.quality || a.order - b.order);
  return ranked.length ? ranked[0].code : null;
}

function crawler(userAgent) {
  return /googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|crawler|spider|bot\//i
    .test(userAgent || "");
}

function country(request) {
  return (request.cf && request.cf.country) || null;
}

function languageFor(request) {
  const mine = cookie(request, "pautia:lang");
  if (mine && SHIPPED.includes(mine)) return mine;
  if (crawler(request.headers.get("user-agent"))) return DEFAULT;
  const asked = preferred(request.headers.get("accept-language"));
  if (asked) return asked;
  return country(request) && ENGLISH_SPOKEN.has(country(request)) ? "en" : DEFAULT;
}

function currencyFor(request) {
  const mine = cookie(request, "pautia:currency");
  if (mine && Object.hasOwn(CURRENCY, mine)) return mine;
  return BY_COUNTRY[country(request)] || "USD";
}

// Every text the page carries for a key, in one pass: the key names the text
// that follows it, up to the next tag.
function texts(html, table) {
  return html.replace(/data-i18n="([\w.-]+)">([\s\S]*?)</g, (whole, key) =>
    table[key] ? `data-i18n="${key}">${table[key]}<` : whole);
}

// The five values that live in attributes: the description, the cards, the
// locale, and the label of the navigation.
function attributes(html, table) {
  return html.replace(
    /<([a-z]+)([^>]*\sdata-i18n-attrs="([^"]+)"[^>]*)>/g,
    (whole, tag, attrs, pairs) => {
      let out = attrs;
      for (const pair of pairs.split(",")) {
        const [attr, key] = pair.split(":");
        if (table[key]) {
          out = out.replace(new RegExp(`\\b${attr}="[^"]*"`), `${attr}="${table[key]}"`);
        }
      }
      return `<${tag}${out}>`;
    },
  );
}

// The structured data describes the page as it is served, so it follows.
function schema(html, table, language) {
  return html.replace(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    (whole, body) => {
      try {
        const data = JSON.parse(body);
        data.inLanguage = language;
        data.description = table["meta.description"];
        const names = ["plans.plan-name.0", "plans.plan-name.1", "plans.plan-name.2"];
        for (const [index, offer] of (data.offers || []).entries()) {
          if (names[index]) offer.name = table[names[index]];
        }
        return whole.replace(body, JSON.stringify(data, null, 2));
      } catch {
        return whole;   // a payload we cannot parse is left alone, not dropped
      }
    },
  );
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html")) return response;
    if (new URL(request.url).pathname !== "/") return response;

    const language = languageFor(request);
    const currency = currencyFor(request);
    if (language === DEFAULT && currency === "USD") return response;

    let html = await response.text();
    if (language !== DEFAULT) {
      const table = DICTIONARIES[language];
      html = schema(attributes(texts(html, table), table), table, language);
      html = html.replace('<html lang="es"', `<html lang="${language}"`);
    }
    if (currency !== "USD") {
      html = html.replace(/<html lang="[a-z-]+"/,
        (whole) => `${whole} data-currency="${currency}"`);
    }

    const headers = new Headers(response.headers);
    headers.delete("content-length");        // the new body is a different size
    return new Response(html, { status: response.status, headers });
  },
};
