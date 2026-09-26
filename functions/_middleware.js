/* The edge does the translation, so a visitor never sees the wrong language.
 *
 * The page is one file, written in Spanish, and this middleware sends it in the
 * language the request asks for. The strings come from en.json, the same file the
 * browser fetches when it switches languages by hand, so every translation has
 * one copy and the page itself needs no build step. Anything that is not the
 * landing page passes through untouched, and so does the default language: no
 * request that is already right pays for the rewrite.
 *
 * Which language, in order:
 *   1. the visitor's own choice, if they made one (the cookie the picker sets);
 *   2. crawlers get the language the page is written in, so what gets indexed is
 *      what was written, and the cards a post shares say the same thing;
 *   3. what the browser asks for in Accept-Language;
 *   4. the country, for a visitor whose browser asked for nothing about es or en;
 *   5. otherwise the page's own language.
 *
 * It runs on pautia.app only. On localhost there is no Cloudflare, no middleware
 * and no rewrite: the page is served as it is written.
 *
 * The whole body is read and rewritten in one pass instead of streamed through
 * HTMLRewriter on purpose: that API hands the JSON-LD script over in fragments,
 * which cannot be parsed, and this page is 42 KB, so one regex pass over it is
 * well inside the 10 ms of CPU the free plan allows.
 */

import en from "../public/assets/i18n/en.json";

const DEFAULT = "es";
const SHIPPED = ["es", "en"];

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

// Where the browser said nothing we could use. Spanish by default: that is the
// page's own language, so an unknown request is never handed an English one.
const ENGLISH_SPOKEN = new Set(["US", "GB", "IE", "AU", "NZ", "CA", "SG"]);

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

function languageFor(request) {
  const mine = cookie(request, "pautia:lang");
  if (mine && SHIPPED.includes(mine)) return mine;
  if (crawler(request.headers.get("user-agent"))) return DEFAULT;
  const asked = preferred(request.headers.get("accept-language"));
  if (asked) return asked;
  const country = request.cf && request.cf.country;
  return country && ENGLISH_SPOKEN.has(country) ? "en" : DEFAULT;
}

function currencyFor(request) {
  const mine = cookie(request, "pautia:currency");
  if (mine && Object.hasOwn(CURRENCY, mine)) return mine;
  const country = request.cf && request.cf.country;
  return (country && BY_COUNTRY[country]) || "USD";
}

// Every text the page carries for a key, in one pass: the key names the text
// that follows it, up to the next tag.
function texts(html) {
  return html.replace(/data-i18n="([\w.-]+)">([\s\S]*?)</g, (whole, key) =>
    en[key] ? `data-i18n="${key}">${en[key]}<` : whole);
}

// The five values that live in attributes: the description, the cards, the
// locale, and the label of the navigation.
function attributes(html) {
  return html.replace(
    /<([a-z]+)([^>]*\sdata-i18n-attrs="([^"]+)"[^>]*)>/g,
    (whole, tag, attrs, pairs) => {
      let out = attrs;
      for (const pair of pairs.split(",")) {
        const [attr, key] = pair.split(":");
        if (en[key]) {
          out = out.replace(new RegExp(`\\b${attr}="[^"]*"`), `${attr}="${en[key]}"`);
        }
      }
      return `<${tag}${out}>`;
    },
  );
}

// The structured data describes the page as it is served, so it follows.
function schema(html) {
  return html.replace(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    (whole, body) => {
      try {
        const data = JSON.parse(body);
        data.inLanguage = "en";
        data.description = en["meta.description"];
        const names = ["plans.plan-name.0", "plans.plan-name.1", "plans.plan-name.2"];
        for (const [index, offer] of (data.offers || []).entries()) {
          if (names[index]) offer.name = en[names[index]];
        }
        return whole.replace(body, JSON.stringify(data, null, 2));
      } catch {
        return whole;   // a payload we cannot parse is left alone, not dropped
      }
    },
  );
}

export async function onRequest(context) {
  const response = await context.next();
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  if (new URL(context.request.url).pathname !== "/") return response;

  const language = languageFor(context.request);
  const currency = currencyFor(context.request);
  if (language === DEFAULT && currency === "USD") return response;

  let html = await response.text();
  if (language !== DEFAULT) html = schema(attributes(texts(html)));
  if (language !== DEFAULT) {
    html = html.replace('<html lang="es"', `<html lang="${language}"`);
  }
  if (currency !== "USD") {
    // The page is priced in dollars; this tells the runtime which money to show.
    html = html.replace(/<html lang="[a-z-]+"/,
      (whole) => `${whole} data-currency="${currency}"`);
  }

  const headers = new Headers(response.headers);
  headers.delete("content-length");        // the new body is a different size
  return new Response(html, { status: response.status, headers });
}
