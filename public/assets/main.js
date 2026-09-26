/* Pautia landing page. Two behaviors, no dependencies and no libraries: the
   copyright year, and the language.

   Every language is a file in /assets/i18n, including the one the page is
   written in, and every text a language translates carries a data-i18n key.
   Switching puts the strings of that language in their place, in the page the
   visitor is already reading: no navigation, no reload, and the price switch
   and the open answers stay as they were. A key a language does not translate
   keeps the text already in the markup, so a half-translated language degrades
   to the page's own instead of leaving holes. */

(() => {
  "use strict";

  const STORED = "pautia:lang";

  const year = String(new Date().getFullYear());
  for (const node of document.querySelectorAll("[data-year]")) {
    node.textContent = year;
  }

  /* What each price is in pesos, at the day's rate. Prices are always in
     dollars; the caption is an approximation, and an approximation nobody can
     fetch is worse than no number at all, so if the rate never arrives the
     caption never appears. One request a day, kept in localStorage. */
  const RATE = { key: "pautia:rate", url: "https://open.er-api.com/v6/latest/USD",
                 day: 86400000 };

  let lastRate = 0;

  function pesos(rate) {
    lastRate = rate;
    const thousands = document.documentElement.lang === "es" ? "." : ",";
    for (const price of document.querySelectorAll(".price__amount")) {
      const amount = parseFloat(price.textContent.replace(/[^0-9.]/g, ""));
      if (!amount) continue;                    // "Custom price"
      let note = price.parentNode.querySelector(".price__mxn");
      if (!note) {
        note = document.createElement("span");
        note.className = "price__mxn";
        price.parentNode.append(note);
      }
      // Written again whenever the language changes, so the thousands mark
      // agrees with the table: 1.396 in Spanish, 1,396 in English.
      note.textContent = "≈ " + Math.floor(amount * rate)
        .toString().replace(/\B(?=(\d{3})+(?!\d))/g, thousands) + " MXN";
    }
  }

  function exchangeRate() {
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem(RATE.key));
    } catch {}
    if (cached && Date.now() - cached.at < RATE.day) return pesos(cached.mxn);
    fetch(RATE.url, { credentials: "omit" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const mxn = data && data.result === "success" && data.rates.MXN;
        if (!mxn) return;
        try {
          localStorage.setItem(RATE.key, JSON.stringify({ at: Date.now(), mxn }));
        } catch {}
        pesos(mxn);
      })
      .catch(() => {});
  }

  exchangeRate();

  const list = JSON.parse(document.getElementById("languages").textContent);
  const page = document.documentElement;
  const strings = {};         // file name -> { key: text }
  let wanted = list[0].code;  // what the visitor asked for, fetches included
  let shown = list[0].code;   // what the page is saying right now

  function remember(code) {
    try {
      localStorage.setItem(STORED, code);
    } catch {}
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
    if (lastRate) pesos(lastRate);
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

    mark(lang.code);
  }

  function apply(code) {
    const lang = list.find((item) => item.code === code) || list[0];
    wanted = lang.code;
    remember(lang.code);
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
    const details = document.createElement("details");
    details.className = "menu";
    details.dataset.menu = "lang";
    const summary = document.createElement("summary");
    summary.className = "menu__summary";
    summary.setAttribute("aria-label", "Language");
    summary.title = "Language";
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

  picker();
  menus();
  mark(shown);
  // The page already says its own language, so there is nothing to fetch unless
  // the visitor asked for another one before.
  const stored = page.dataset.lang;
  if (stored) apply(stored);
})();
