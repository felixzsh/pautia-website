/* Pautia landing page. Three behaviors, no dependencies and no libraries: the
   copyright year, the language and the currency.

   Every language is a file in /assets/i18n, including the one the page is
   written in, and every text a language translates carries a data-i18n key.
   Switching puts the strings of that language in their place, in the page the
   visitor is already reading: no navigation, no reload, and the price switch
   and the open answers stay as they were. A key a language does not translate
   keeps the text already in the markup, so a half-translated language degrades
   to the page's own instead of leaving holes.

   Money works the other way round: the page is written in dollars and every
   figure carries the dollars it starts from in data-usd, so a currency is a
   conversion and never a re-entry. The edge hints at the first one from the
   country it saw; after that, what the visitor picks is what they get. */

(() => {
  "use strict";

  const STORED = "pautia:lang";
  const CURRENCY = "pautia:currency";
  const RATE = { key: "pautia:rate", url: "https://open.er-api.com/v6/latest/USD",
                 day: 86400000 };
  // The dollar is the price on the page; the rest are conversions. The symbol is
  // what the reader sees in front of every figure, so it has to be the one their
  // own money uses, not the three letters.
  const CURRENCIES = [
    { code: "USD", symbol: "$" },      { code: "EUR", symbol: "€" },
    { code: "GBP", symbol: "£" },      { code: "MXN", symbol: "MX$" },
    { code: "BRL", symbol: "R$" },     { code: "INR", symbol: "₹" },
    { code: "CAD", symbol: "CA$" },    { code: "SGD", symbol: "S$" },
    { code: "RON", symbol: "RON" },    { code: "JPY", symbol: "¥" },
    { code: "MYR", symbol: "RM" },     { code: "CLP", symbol: "CLP$" },
    { code: "MAD", symbol: "MAD" },    { code: "PEN", symbol: "S/" },
    { code: "AUD", symbol: "A$" },     { code: "CHF", symbol: "CHF" },
  ];

  const year = String(new Date().getFullYear());
  for (const node of document.querySelectorAll("[data-year]")) {
    node.textContent = year;
  }

  const list = JSON.parse(document.getElementById("languages").textContent);
  const page = document.documentElement;
  const strings = {};         // file name -> { key: text }
  let wanted = list[0].code;  // what the visitor asked for, fetches included
  let shown = page.lang || list[0].code;   // what the markup says it is in
  const known = (code) => CURRENCIES.some((item) => item.code === code);
  let currency = [choice(CURRENCY), page.dataset.currency]
    .find((code) => code && known(code)) || "USD";
  let rates = null;

  // A choice lives in exactly one place: the cookie. It is what the edge reads,
  // so the page arrives already in the chosen language and money, and it is what
  // clearing your cookies clears. Keeping a second copy in localStorage left the
  // page remembering a choice the visitor thought they had thrown away.
  function choice(key) {
    const found = document.cookie.match(new RegExp(`(?:^|;\\s*)${key}=([\\w-]+)`));
    return found ? found[1] : null;
  }

  function remember(key, value) {
    document.cookie = `${key}=${value}; path=/; max-age=31536000; samesite=lax`;
    try {
      localStorage.removeItem(key);   // an older copy of this choice, if any
    } catch {}
  }

  // "RON 8", but "MX$159": a symbol goes against the number, an abbreviation of
  // three letters or more reads better with a space.
  function symbolOf(code) {
    const found = CURRENCIES.find((item) => item.code === code) || CURRENCIES[0];
    return found.symbol;
  }

  function prefix(code) {
    const symbol = symbolOf(code);
    return /^[A-Za-z]{3,}$/.test(symbol) ? `${symbol} ` : symbol;
  }

  // The amount exactly as the rate says it, to the cent, with the page's own
  // separators: 1.526,78 in Spanish and 1,526.78 in English. Yen and the
  // Chilean peso have no cents to show.
  const NO_CENTS = ["JPY", "CLP"];

  function money(value, code) {
    const [whole, cents] = value.toFixed(NO_CENTS.includes(code) ? 0 : 2).split(".");
    const groups = whole.replace(/\B(?=(\d{3})+(?!\d))/g,
      page.lang === "es" ? "." : ",");
    if (!cents) return groups;
    return `${groups}${page.lang === "es" ? "," : "."}${cents}`;
  }

  function rate() {
    if (currency === "USD") return 1;
    return rates && rates[currency] ? rates[currency] : 0;
  }

  // The dollars, two ways round. The markup is the source once, and after that
  // only the texts a language writes itself are read again: a figure that has
  // already been converted must never be used as the dollars it came from, or
  // the conversion would be applied twice and "MX$159" would grow a prefix of
  // its own.
  function stashMarkup() {
    for (const node of document.querySelectorAll("[data-money]")) {
      if (!node.dataset.usdText) node.dataset.usdText = node.textContent;
    }
  }

  function stashLanguage() {
    for (const node of document.querySelectorAll("[data-money][data-i18n]")) {
      node.dataset.usdText = node.textContent;   // the dictionary writes dollars
    }
  }

  function prices() {
    // The dollar is not a conversion: the page is already written in it, and a
    // figure the author chose ($9) must come back exactly as it is, not as the
    // arithmetic of multiplying by one ($9,00).
    const converted = currency === "USD" ? 0 : rate();
    for (const node of document.querySelectorAll("[data-money]")) {
      const dollars = node.dataset.usdText || node.textContent;
      // The replacement is a function on purpose: a "$" inside it would be read
      // as a reference to a capture group and eaten.
      if (!converted) {
        node.textContent = dollars;                   // no rate yet: stay in dollars
        continue;
      }
      const figure = money(Number(node.dataset.usd) * converted, currency);
      node.textContent = dollars.replace(/[$€]\s?[\d][\d.,]*/, () =>
        prefix(currency) + figure);
    }

    // The structured data describes what the visitor is looking at.
    const data = document.querySelector('script[type="application/ld+json"]');
    if (!data) return;
    try {
      const schema = JSON.parse(data.textContent);
      const monthly = document.querySelectorAll(".price--monthly .price__amount");
      for (const [index, offer] of (schema.offers || []).entries()) {
        const base = monthly[index] && Number(monthly[index].dataset.usd);
        if (!base) continue;
        offer.priceCurrency = currency;
        offer.price = converted ? (base * converted).toFixed(2) : String(base);
      }
      data.textContent = JSON.stringify(schema, null, 2);
    } catch {}
  }

  function fetchRate() {
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem(RATE.key));
    } catch {}
    // A table written by an older version of this script has no rates in it, and
    // trusting it left the page stuck in dollars for a day. Anything that is not
    // the shape we expect is thrown away and fetched again.
    if (cached && (!cached.rates || typeof cached.rates !== "object")) {
      try {
        localStorage.removeItem(RATE.key);
      } catch {}
      cached = null;
    }
    if (cached && Date.now() - cached.at < RATE.day) {
      rates = cached.rates;
      return prices();
    }
    fetch(RATE.url, { credentials: "omit" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || data.result !== "success") return fallback();
        rates = data.rates;
        try {
          localStorage.setItem(RATE.key,
            JSON.stringify({ at: Date.now(), rates: data.rates }));
        } catch {}
        prices();
      })
      .catch(fallback);
  }

  // A currency nobody can price is a currency the selector must not claim.
  function fallback() {
    currency = "USD";
    remember(CURRENCY, "USD");
    markCurrency();
    prices();
  }

  function markCurrency() {
    for (const node of document.querySelectorAll("[data-currency-shown]")) {
      node.textContent = currency;
    }
    for (const item of document.querySelectorAll("[data-currency-option]")) {
      item.setAttribute("aria-current",
        item.dataset.currencyOption === currency ? "true" : "false");
    }
  }

  function chooseCurrency(code) {
    currency = code;
    remember(CURRENCY, code);
    markCurrency();
    prices();
    if (rate() === 0) fetchRate();
  }

  // Sixteen currencies do not fit in a switch: this is a menu, the same component
  // as the language picker, with the symbol of each one as a hint.
  function currencyPicker() {
    const host = document.querySelector("[data-currency-picker]");
    if (!host) return;
    const label = host.getAttribute("aria-label");
    const details = document.createElement("details");
    details.className = "menu currency";
    details.dataset.menu = "currency";
    const summary = document.createElement("summary");
    summary.className = "menu__summary";
    summary.setAttribute("aria-label", label);
    summary.title = label;
    summary.innerHTML = `<span data-currency-shown>${currency}</span>`
      + '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
      + '<use href="#i-chevron" /></svg>';
    details.append(summary);

    const body = document.createElement("div");
    body.className = "menu__body menu__body--tall";
    for (const item of CURRENCIES) {
      const option = document.createElement("a");
      option.href = "#";
      option.className = "menu__item";
      option.dataset.currencyOption = item.code;
      option.textContent = `${item.code} (${item.symbol})`;
      option.addEventListener("click", (event) => {
        event.preventDefault();
        chooseCurrency(item.code);
      });
      body.append(option);
    }
    details.append(body);
    host.replaceWith(details);
    markCurrency();
    if (rate() === 0) fetchRate();
  }

  function mark(code) {
    for (const link of document.querySelectorAll("[data-lang-option]")) {
      link.setAttribute("aria-current",
        link.dataset.langOption === code ? "true" : "false");
    }
  }

  function paint(lang) {
    const table = strings[lang.file] || {};
    page.lang = lang.code;
    shown = lang.code;

    for (const node of document.querySelectorAll("[data-i18n]")) {
      const text = table[node.dataset.i18n];
      if (text) node.textContent = text;
    }
    for (const node of document.querySelectorAll("[data-i18n-attrs]")) {
      for (const pair of node.dataset.i18nAttrs.split(",")) {
        const [attr, key] = pair.split(":");
        const text = table[key];
        if (text) node.setAttribute(attr, text);
      }
    }

    const data = document.querySelector('script[type="application/ld+json"]');
    if (data) {
      const schema = JSON.parse(data.textContent);
      schema.inLanguage = lang.code;
      if (table["meta.description"]) schema.description = table["meta.description"];
      data.textContent = JSON.stringify(schema, null, 2);
    }

    stashLanguage();   // the new language writes the dollars; convert again after
    prices();
    mark(lang.code);
  }

  function apply(code) {
    const lang = list.find((item) => item.code === code) || list[0];
    wanted = lang.code;
    remember(STORED, lang.code);
    if (lang.code === shown) return;           // the page is already saying it
    if (strings[lang.file]) return paint(lang);

    fetch(`/assets/i18n/${lang.file}`, { credentials: "omit" })
      .then((response) => (response.ok ? response.json() : null))
      .then((table) => {
        if (!table) return;
        strings[lang.file] = table;
        // The visitor may have picked another language while this was in flight.
        if (wanted === lang.code) paint(lang);
      })
      .catch(() => {});
  }

  /* Menus. The mobile navigation and the language picker are the same
     component: a details element, one class for the panel and one for its
     items. A details element already opens, closes and takes the keyboard; what
     it does not do is close when the visitor clicks away, close on escape, stay
     out of the way of the other menu, or close after picking something. All four
     are here, once, for every menu on the page. */
  function menus() {
    const all = () => document.querySelectorAll("[data-menu]");

    document.addEventListener("pointerdown", (event) => {
      for (const menu of all()) {
        if (menu.open && !menu.contains(event.target)) menu.open = false;
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      for (const menu of all()) {
        if (!menu.open) continue;
        menu.open = false;
        menu.querySelector("summary").focus();
      }
    });

    // Picking something closes the menu it came from, in either menu.
    document.addEventListener("click", (event) => {
      const item = event.target.closest(".menu__item");
      if (item) item.closest("[data-menu]").open = false;
    });

    for (const menu of all()) {
      menu.addEventListener("toggle", () => {
        if (!menu.open) return;
        for (const other of all()) {
          if (other !== menu) other.open = false;
        }
      });
    }
  }

  function picker() {
    const host = document.querySelector("[data-lang-picker]");
    if (!host) return;
    const label = host.getAttribute("aria-label");
    const details = document.createElement("details");
    details.className = "menu";
    details.dataset.menu = "lang";
    const summary = document.createElement("summary");
    summary.className = "menu__summary";
    summary.setAttribute("aria-label", label);
    summary.title = label;
    summary.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
      + '<use href="#i-globe" /></svg>';
    details.append(summary);

    const body = document.createElement("div");
    body.className = "menu__body";
    for (const lang of list) {
      const link = document.createElement("a");
      link.href = "#";
      link.className = "menu__item";
      link.dataset.langOption = lang.code;
      link.textContent = lang.name;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        apply(lang.code);
      });
      body.append(link);
    }
    details.append(body);
    host.replaceWith(details);
  }

  // The language and the money used to be copied into localStorage as well, and
  // a reader in the page's head kept honouring that copy: a visitor who cleared
  // the cookies saw an old choice come back, and the page wrote its cookie
  // again. The cookie is now the only store, and the leftovers go at boot.
  for (const key of [STORED, CURRENCY]) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }

  stashMarkup();
  currencyPicker();
  picker();
  menus();
  mark(shown);
  // The page already says its own language, so there is nothing to fetch unless
  // the visitor asked for another one before.
  const stored = page.dataset.lang || choice(STORED);
  if (stored && stored !== shown) apply(stored);
})();
