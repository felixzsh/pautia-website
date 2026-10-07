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

import { linkTerms } from "/assets/terms.js";

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
  let refreshCustomPlan = () => {};

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
  // separators: a dot for thousands and a comma for cents in Spanish,
  // Portuguese, German and Italian (1.526,78), a space in French (1 526,78),
  // and the other way round in English (1,526.78). Yen and the
  // Chilean peso have no cents to show.
  const NO_CENTS = ["JPY", "CLP"];
  const NUMBER_STYLE = {
    es: { group: ".", decimal: "," },
    pt: { group: ".", decimal: "," },
    de: { group: ".", decimal: "," },
    it: { group: ".", decimal: "," },
    fr: { group: "\u00a0", decimal: "," },
    en: { group: ",", decimal: "." },
  };

  function money(value, code) {
    const style = NUMBER_STYLE[page.lang] || NUMBER_STYLE.en;
    const [whole, cents] = value.toFixed(NO_CENTS.includes(code) ? 0 : 2).split(".");
    const groups = whole.replace(/\B(?=(\d{3})+(?!\d))/g, style.group);
    if (!cents) return groups;
    return `${groups}${style.decimal}${cents}`;
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

  function customPlan() {
    const host = document.querySelector("[data-custom-plan]");
    if (!host) return;

    const plans = [...document.querySelectorAll(
      "#plans .plans__grid > .plan:not(.plan--wide)"
    )];
    const tiers = [...host.querySelectorAll('input[name="custom-plan-base"]')];
    const controls = {
      bots: host.querySelector("#custom-bots"),
      storage: host.querySelector("#custom-storage"),
    };
    const outputs = Object.fromEntries(Object.entries(controls).map(([key]) => [
      key, host.querySelector(`#custom-${key}-output`),
    ]));
    const bounds = Object.fromEntries(Object.entries(controls).map(([key]) => [key, {
      min: host.querySelector(`[data-custom-min="${key}"]`),
      max: host.querySelector(`[data-custom-max="${key}"]`),
    }]));
    const moneyNodes = Object.fromEntries([...host.querySelectorAll("[data-custom-price]")]
      .map((node) => [node.dataset.customPrice, node]));
    // Storage beyond the plan adds up in progressive GB tiers: a small history
    // pays only the first tier, a large one keeps a lower rate on the rest, and
    // reaching a new tier never makes the running total cost more than before.
    const max = { bots: 100, storage: 100000 };
    const STORAGE_TIERS = [
      { upTo: 10, price: 1 },
      { upTo: 100, price: 0.5 },
      { upTo: 500, price: 0.25 },
      { upTo: Infinity, price: 0.1 },
    ];
    const format = (value) => new Intl.NumberFormat(page.lang).format(value);
    function storagePrice(mb) {
      let left = mb / 1000;
      let total = 0;
      let floor = 0;
      for (const tier of STORAGE_TIERS) {
        const span = Math.min(left, tier.upTo - floor);
        if (span <= 0) break;
        total += span * tier.price;
        left -= span;
        floor = tier.upTo;
      }
      return total;
    }
    function capacity(key, value) {
      if (key !== "storage") return format(value);
      if (value >= 1000000) return `${format(value / 1000000)} TB`;
      if (value >= 1000) return `${format(value / 1000)} GB`;
      return `${format(value)} MB`;
    }

    function amount(key, value) {
      const rounded = Number(value.toFixed(2));
      const node = moneyNodes[key];
      node.dataset.usd = rounded.toFixed(2);
      node.dataset.usdText = `$${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}`;
      node.textContent = node.dataset.usdText;
    }

    function refresh(reset = false) {
      const tier = tiers.find((item) => item.checked);
      const plan = plans[Number(tier.dataset.planIndex)];
      if (!plan) return;

      const base = {
        price: Number(plan.dataset.customPrice),
        bots: Number(plan.dataset.customBots),
        storage: Number(plan.dataset.customStorage),
      };
      const current = {};
      for (const [key, control] of Object.entries(controls)) {
        control.min = base[key];
        control.max = max[key];
        if (reset || Number(control.value) < base[key]) control.value = base[key];
        current[key] = Number(control.value);
        outputs[key].textContent = capacity(key, current[key]);
        bounds[key].min.textContent = capacity(key, base[key]);
        bounds[key].max.textContent = capacity(key, max[key]);
        control.setAttribute("aria-valuetext", outputs[key].textContent);
      }

      const extra = {
        bots: (current.bots - base.bots) * 5,
        storage: storagePrice(current.storage - base.storage),
      };
      const monthly = base.price + extra.bots + extra.storage;
      const annual = document.querySelector("#period-yearly").checked;
      const factor = annual ? 0.8 : 1;

      amount("base", base.price * factor);
      amount("bots", extra.bots * factor);
      amount("storage", extra.storage * factor);
      amount("total", monthly * factor);
      amount("annual", monthly * 0.8 * 12);
      host.querySelector("[data-custom-selected]").textContent =
        tier.closest("label").querySelector("[data-custom-name]").textContent;
      host.querySelector(".custom-plan__annual").hidden = !annual;
    }

    function update(reset = false) {
      refresh(reset);
      prices();
    }

    tiers.forEach((tier) => tier.addEventListener("change", () => update(true)));
    Object.values(controls).forEach((control) => {
      control.addEventListener("input", () => update());
    });
    for (const id of ["period-monthly", "period-yearly"]) {
      document.getElementById(id).addEventListener("change", () => update());
    }

    refreshCustomPlan = () => refresh();
    refresh();
    prices();
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
    closeTermHelp();
    const table = strings[lang.file] || {};
    page.lang = lang.code;
    shown = lang.code;

    for (const node of document.querySelectorAll("[data-i18n]")) {
      const text = table[node.dataset.i18n];
      if (!text) continue;
      if (node.hasAttribute("data-terms")) node.innerHTML = linkTerms(text, lang.code);
      else node.textContent = text;
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
    refreshCustomPlan();
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

  // One floating hint works for built terms and terms recreated by translation.
  function termHelp() {
    const help = document.createElement("div");
    help.className = "term-help";
    help.id = "term-help";
    help.setAttribute("role", "tooltip");
    help.hidden = true;
    document.body.append(help);
    let active = null;

    function close() {
      active?.setAttribute("aria-expanded", "false");
      active?.removeAttribute("aria-describedby");
      active = null;
      help.hidden = true;
    }

    document.addEventListener("click", (event) => {
      const term = event.target.closest(".term[data-term]");
      if (help.contains(event.target)) return;
      if (!term || term === active) return close();
      close();
      active = term;
      help.textContent = term.title;
      help.hidden = false;
      const box = term.getBoundingClientRect();
      const tip = help.getBoundingClientRect();
      const left = Math.max(12, Math.min(box.left, innerWidth - tip.width - 12));
      const below = box.bottom + 8;
      const top = below + tip.height <= innerHeight - 12 ? below : box.top - tip.height - 8;
      help.style.left = `${left}px`;
      help.style.top = `${Math.max(12, top)}px`;
      term.setAttribute("aria-expanded", "true");
      term.setAttribute("aria-describedby", help.id);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
    document.addEventListener("focusin", (event) => {
      if (active && event.target !== active) close();
    });
    addEventListener("scroll", close, true);
    addEventListener("resize", close);
    return close;
  }

  // Each examples track navigates independently. Phones stack its cards instead.
  function examples() {
    document.querySelectorAll("[data-mocks]").forEach((host) => {
      const track = host.querySelector(".mocks__track");
      const count = track.children.length;
      const step = () => (matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto" : "smooth");

      function update() {
        const index = Math.round(track.scrollLeft / track.clientWidth);
        prev.disabled = index <= 0;
        next.disabled = index >= count - 1;
      }

      const prev = host.querySelector("[data-mock-prev]");
      const next = host.querySelector("[data-mock-next]");
      prev.addEventListener("click", () =>
        track.scrollBy({ left: -track.clientWidth, behavior: step() }));
      next.addEventListener("click", () =>
        track.scrollBy({ left: track.clientWidth, behavior: step() }));
      // Resizing switches between a scrolling track and the stacked phone layout.
      addEventListener("resize", update);
      track.addEventListener("scroll", update, { passive: true });
      prev.hidden = false;
      next.hidden = false;
      update();
    });
  }

  /* An inline journey in the final section, enhanced from the translated fields.
     Native radios keep keyboard navigation; no requests until the final step.
     The links retain a mailto fallback when JavaScript is unavailable. */
  function waitlist() {
    const dialog = document.getElementById("waitlist");
    if (!dialog) return;
    const form = dialog.querySelector("[data-waitlist-form]");
    const done = dialog.querySelector("[data-waitlist-done]");
    const error = dialog.querySelector("[data-waitlist-error]");
    const submit = form.querySelector('button[type="submit"]');
    const receiptKey = "pautia:waitlist-email";
    function receipt(email) {
      form.hidden = true;
      done.querySelector("[data-waitlist-email]").textContent = email;
      done.hidden = false;
    }
    try {
      const saved = localStorage.getItem(receiptKey);
      if (saved && saved.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(saved)) {
        receipt(saved);
      }
    } catch {} // Storage may be blocked; registration still works.
    const section = document.querySelector(".cta");
    const intro = section.querySelector(".wrap");
    const header = document.querySelector(".header");
    section.append(dialog);
    form.noValidate = true;
    const words = {
      es: ["Volver", "Continuar", "Otro", "Cuéntanos brevemente", "Anotando…"],
      en: ["Back", "Continue", "Other", "Tell us briefly", "Joining…"],
      pt: ["Voltar", "Continuar", "Outro", "Conte brevemente", "Inscrevendo…"],
      fr: ["Retour", "Continuer", "Autre", "Dites-nous en quelques mots", "Inscription…"],
      de: ["Zurück", "Weiter", "Andere", "Erzählen Sie uns kurz", "Eintragen…"],
      it: ["Indietro", "Continua", "Altro", "Raccontaci brevemente", "Iscrizione…"],
    };
    const ui = (index) => (words[page.lang] || words.en)[index];
    const steps = [];
    for (const select of form.querySelectorAll("select")) {
      const field = document.createElement("fieldset");
      field.className = "field waitlist__step";
      const legend = document.createElement("legend");
      legend.append(select.parentElement.querySelector(".field__label"));
      select.parentElement.replaceWith(field);
      field.append(legend);
      const choices = document.createElement("div");
      choices.className = "waitlist__choices";
      const options = [...select.options].filter((option) => option.value);
      if (select.name === "rubro") options.pop(); // Replace the existing Other with free text.
      for (const option of options) {
        const label = document.createElement("label");
        label.className = "waitlist__choice";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = select.name;
        radio.value = option.value;
        radio.required = true;
        const caption = document.createElement("span");
        caption.textContent = option.textContent;
        caption.dataset.i18n = option.dataset.i18n;
        label.append(radio, caption);
        choices.append(label);
      }
      const other = document.createElement("label");
      other.className = "waitlist__choice";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = select.name;
      radio.value = "__other";
      radio.required = true;
      const caption = document.createElement("span");
      caption.textContent = ui(2);
      other.append(radio, caption);
      choices.append(other);
      const detail = document.createElement("label");
      detail.className = "field waitlist__other";
      detail.hidden = true;
      const prompt = document.createElement("span");
      prompt.textContent = ui(3);
      const input = document.createElement("input");
      input.className = "field__input";
      input.name = `${select.name}_other`;
      input.maxLength = 100;
      const count = document.createElement("small");
      count.textContent = "0/100";
      input.addEventListener("input", () => { count.textContent = `${input.value.length}/100`; });
      detail.append(prompt, input, count);
      field.append(choices, detail);
      field.addEventListener("change", () => {
        const selected = field.querySelector('input[type="radio"]:checked');
        detail.hidden = selected?.value !== "__other";
        input.required = !detail.hidden;
        input.disabled = detail.hidden;
        if (!detail.hidden) input.focus();
      });
      input.disabled = true;
      steps.push(field);
    }
    steps.push(form.querySelector('input[type="email"]').closest(".field"));
    const progress = document.createElement("p");
    progress.className = "waitlist__progress";
    progress.setAttribute("aria-live", "polite");
    form.prepend(progress);
    const navigation = document.createElement("div");
    navigation.className = "waitlist__navigation";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "btn btn--ghost";
    back.textContent = ui(0);
    const next = document.createElement("button");
    next.type = "button";
    next.className = "btn btn--primary";
    next.textContent = ui(1);
    navigation.append(back, next, submit);
    form.append(navigation);
    let current = 0;
    let busy = false;
    const valid = () => [...steps[current].querySelectorAll("input")]
      .filter((input) => !input.disabled).every((input) => input.reportValidity());
    function show(index) {
      current = index;
      steps.forEach((step, i) => { step.hidden = i !== index; });
      progress.textContent = `${String(index + 1).padStart(2, "0")} / 04`;
      back.hidden = index === 0;
      next.hidden = index === 3;
      submit.hidden = index !== 3;
      form.querySelector(".waitlist__legal").hidden = index !== 3;
      const heading = steps[index].querySelector(".field__label");
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        steps[index].animate([
          { opacity: 0, transform: "translateX(24px)" },
          { opacity: 1, transform: "translateX(0)" },
        ], { duration: 240, easing: "ease-out" });
      }
    }
    back.addEventListener("click", () => { if (!busy) show(current - 1); });
    next.addEventListener("click", () => { if (valid()) show(current + 1); });
    show(0);
    dialog.querySelector("[data-waitlist-reset]").addEventListener("click", () => {
      try { localStorage.removeItem(receiptKey); } catch {}
      form.reset();
      for (const detail of form.querySelectorAll(".waitlist__other")) {
        detail.hidden = true;
        const input = detail.querySelector("input");
        input.disabled = true;
        input.required = false;
        detail.querySelector("small").textContent = "0/100";
      }
      error.hidden = true;
      done.hidden = true;
      form.hidden = false;
      show(0);
    });

    /* Landing on the journey. scrollIntoView is not enough on a phone: the
       browser's own bar and the sticky header move the target, and the section
       landed between 56 and 64 px too low, which is the whole first question
       pushed off the screen. So the position is computed from the header's real
       height and, once the smooth scroll stops, whatever is left over is
       corrected in place. On a desktop the residual is already zero and the
       second pass does nothing. */
    const GAP = 8;
    function toJourney(reduced) {
      const top = window.scrollY + section.getBoundingClientRect().top
        - header.offsetHeight - GAP;
      window.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
    }

    function settle(tries = 0) {
      const left = section.getBoundingClientRect().top - header.offsetHeight - GAP;
      if (Math.abs(left) < 4 || tries > 4) return;
      window.scrollTo({ top: window.scrollY + left, behavior: "auto" });
      setTimeout(() => settle(tries + 1), 80);
    }

    function settleWhenStopped() {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        settle();
      };
      window.addEventListener("scrollend", finish, { once: true });
      setTimeout(finish, 1200);   // a browser that never fires scrollend
    }

    for (const opener of document.querySelectorAll("[data-waitlist-open]")) {
      opener.addEventListener("click", (event) => {
        event.preventDefault();
        intro.hidden = true;
        dialog.hidden = false;
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!reduced) {
          dialog.animate([
            { opacity: 0, transform: "translateX(32px)" },
            { opacity: 1, transform: "translateX(0)" },
          ], { duration: 300, easing: "ease-out" });
        }
        toJourney(reduced);
        settleWhenStopped();
        back.textContent = ui(0);
        next.textContent = ui(1);
        dialog.querySelectorAll(".waitlist__other > span")
          .forEach((node) => { node.textContent = ui(3); });
        dialog.querySelectorAll('input[value="__other"] + span')
          .forEach((node) => { node.textContent = ui(2); });
        if (done.hidden) show(current);
        else done.querySelector("h2").focus({ preventScroll: true });
      });
    }

    for (const closer of dialog.querySelectorAll("[data-waitlist-close]")) {
      closer.addEventListener("click", () => {
        dialog.hidden = true;
        intro.hidden = false;
        intro.querySelector("[data-waitlist-open]").focus({ preventScroll: true });
      });
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (busy) return;
      if (current !== 3) {
        if (valid()) show(current + 1);
        return;
      }
      if (!valid()) return;
      busy = true;
      error.hidden = true;
      submit.disabled = true;
      back.disabled = true;
      const original = submit.textContent;
      submit.textContent = ui(4);

      const answers = Object.fromEntries(new FormData(form));
      fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...answers, lang: page.lang }),
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((body) => {
          if (!body || !body.ok) throw new Error("refused");
          const email = answers.email.trim();
          try { localStorage.setItem(receiptKey, email); } catch {}
          receipt(email);
          done.querySelector("h2").focus({ preventScroll: true });
          if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
            done.animate([
              { opacity: 0, transform: "translateY(12px)" },
              { opacity: 1, transform: "translateY(0)" },
            ], { duration: 300, easing: "ease-out" });
          }
        })
        .catch(() => {
          error.hidden = false;
        })
        .finally(() => {
          busy = false;
          submit.disabled = false;
          back.disabled = false;
          submit.textContent = original;
        });
    });
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

  const closeTermHelp = termHelp();
  stashMarkup();
  customPlan();
  currencyPicker();
  picker();
  menus();
  examples();
  waitlist();
  // Content stays visible even without JavaScript or an observer callback.
  if ("IntersectionObserver" in window
      && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.animate([
          { opacity: 0.4, transform: "translateY(16px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], { duration: 400, easing: "ease-out" });
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.15 });
    document.querySelectorAll("main section:not(.hero):not(.cta) h2")
      .forEach((node) => observer.observe(node));
  }
  mark(shown);
  // The page already says its own language, so there is nothing to fetch unless
  // the visitor asked for another one before.
  const stored = page.dataset.lang || choice(STORED);
  if (stored && stored !== shown) apply(stored);
})();
