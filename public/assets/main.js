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

  function picker() {
    const host = document.querySelector("[data-lang-picker]");
    if (!host) return;
    const details = document.createElement("details");
    details.className = "lang";
    const summary = document.createElement("summary");
    summary.className = "lang__summary";
    summary.setAttribute("aria-label", "Language");
    summary.title = "Language";
    summary.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
      + '<use href="#i-globe" /></svg>';
    details.append(summary);

    const body = document.createElement("div");
    body.className = "lang__body";
    for (const lang of list) {
      const link = document.createElement("a");
      link.href = "#";
      link.className = "lang__option";
      link.dataset.langOption = lang.code;
      link.textContent = lang.name;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        details.open = false;
        apply(lang.code);
      });
      body.append(link);
    }
    details.append(body);
    host.replaceWith(details);
  }

  picker();
  mark(shown);
  // The page already says its own language, so there is nothing to fetch unless
  // the visitor asked for another one before.
  const stored = page.dataset.lang;
  if (stored) apply(stored);
})();
