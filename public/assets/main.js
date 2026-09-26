/* Pautia landing page. Two behaviors, no dependencies and no libraries: the
   copyright year, and the language.

   The page is written in the first language of the list in its head, and every
   text another language translates carries a data-i18n key. Switching puts the
   strings of that language in their place, in the page the visitor is already
   reading: no navigation, no reload, and the price switch and the open answers
   stay as they were. A key a language does not translate keeps the text already
   in the markup, so a half-translated language degrades to English instead of
   leaving holes. */

(() => {
  "use strict";

  const STORED = "pautia:lang";

  const year = String(new Date().getFullYear());
  for (const node of document.querySelectorAll("[data-year]")) {
    node.textContent = year;
  }

  const list = JSON.parse(document.getElementById("languages").textContent);
  const page = document.documentElement;
  const loaded = {};          // file name -> { key: text }
  let wanted = list[0].code;  // what the visitor asked for, loads included

  function remember(code) {
    try {
      localStorage.setItem(STORED, code);
    } catch {}
  }

  function paint(lang) {
    const strings = loaded[lang.file] || null;
    if (lang.file && !strings) return false;

    page.lang = lang.code;
    for (const node of document.querySelectorAll("[data-i18n]")) {
      const text = strings && strings[node.dataset.i18n];
      if (text) node.textContent = text;
    }
    for (const node of document.querySelectorAll("[data-i18n-attrs]")) {
      for (const pair of node.dataset.i18nAttrs.split(",")) {
        const [attr, key] = pair.split(":");
        const text = strings && strings[key];
        if (text) node.setAttribute(attr, text);
      }
    }

    const data = document.querySelector('script[type="application/ld+json"]');
    if (data) {
      const schema = JSON.parse(data.textContent);
      schema.inLanguage = lang.code;
      const description = strings && strings["meta.description"];
      if (description) schema.description = description;
      data.textContent = JSON.stringify(schema, null, 2);
    }

    for (const link of document.querySelectorAll("[data-lang-option]")) {
      link.setAttribute("aria-current",
        link.dataset.langOption === lang.code ? "true" : "false");
    }
    return true;
  }

  function apply(code) {
    const lang = list.find((item) => item.code === code) || list[0];
    wanted = lang.code;
    remember(lang.code);
    if (paint(lang) || !lang.file) return;

    fetch(`/assets/i18n/${lang.file}`, { credentials: "omit" })
      .then((response) => (response.ok ? response.json() : null))
      .then((strings) => {
        if (!strings) return;
        loaded[lang.file] = strings;
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
  // The head already decided which language was asked for and preloaded it.
  apply(page.dataset.lang || list[0].code);
})();
