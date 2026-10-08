"""Render the landing page in a real browser and check what greps cannot: console
errors, horizontal overflow, the number of requests, the price switch, and the
FAQ opened with the keyboard alone.

This is a developer tool, not a dependency of the page. It needs playwright and
a server already running on the port below:

    make serve
    make check-browser

Screenshots land in the system temporary directory so they never reach a
commit."""

import os
import pathlib
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("PAUTIA_BASE", "http://127.0.0.1:8080")
OUT = pathlib.Path("/tmp/opencode/pautia-landing")
OUT.mkdir(parents=True, exist_ok=True)

# What the headline says in each language, so a dictionary that loads half way
# or a swap that misses a key cannot pass unnoticed.
HEADLINES = {
    "en": "Manage your business with predictable agents",
    "es": "Gestiona tu negocio con agentes predecibles",
    "pt": "Gerencie seu negócio com agentes previsíveis",
    "fr": "Gérez votre activité avec des agents prévisibles",
    "de": "Führen Sie Ihr Geschäft mit vorhersehbaren Agenten",
    "it": "Gestisci la tua attività con agenti prevedibili",
}

problems = []


def fits(menu, which, name, label, problems):
    """A menu panel has to be as wide as its items and hang from its own button.

    Both were wrong once: the mobile navigation stretched to the width of the
    screen and left its links floating in an empty box, and the picker opened
    above the button that opened it.
    """
    panel = menu.locator(".menu__body")
    box = panel.bounding_box()
    button = menu.locator(".menu__summary").bounding_box()
    if not box or not button:
        problems.append(f"{name}-{label}: the {which} panel did not open")
        return panel
    if box["y"] < button["y"] + button["height"] - 1:
        problems.append(f"{name}-{label}: the {which} panel does not open below its button")

    widest = max((item.bounding_box() or {}).get("width", 0)
                 for item in panel.locator(".menu__item").all())
    padding = panel.evaluate(
        "p => parseFloat(getComputedStyle(p).paddingLeft)"
        " + parseFloat(getComputedStyle(p).paddingRight)"
    )
    if box["width"] > widest + padding + 2:
        problems.append(
            f"{name}-{label}: the {which} panel is {round(box['width'])}px wide for"
            f" {round(widest)}px of text"
        )
    return panel


def budget(page, url):
    sizes = page.evaluate(
        """() => {
        const nav = performance.getEntriesByType('navigation')[0] || {};
        const res = performance.getEntriesByType('resource').map(r => ({
          name: r.name, size: r.transferSize,
        }));
        return {
          html: nav.transferSize,
          resources: res,
          requests: res.length + 1,
        };
      }"""
    )
    return sizes


with sync_playwright() as p:
    browser = p.chromium.launch()
    for width, label in ((1440, "desktop"), (900, "tablet"), (390, "mobile"),
                         (320, "small")):
        for name, locale in (("en", "en-US"), ("es", "es-ES"), ("pt", "pt-BR"),
                             ("fr", "fr-FR"), ("de", "de-DE"), ("it", "it-IT")):
            ctx = browser.new_context(
                viewport={"width": width, "height": 900},
                device_scale_factor=1,
                locale=locale,
            )
            # The browser language must not decide anything: one URL, one page, in
            # the language the page is written in until the visitor says otherwise.
            page = ctx.new_page()
            errors = []
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(f"{BASE}/", wait_until="networkidle")
            if page.locator("html").get_attribute("lang") != "es":
                problems.append(f"{name}-{label}: the page did not open in Spanish")
            assert page.locator('.brand__mark use').get_attribute('href') == '#i-pautia'
            favicon_href = page.locator('link[rel="icon"]').get_attribute("href")
            assert favicon_href == "/assets/favicon-horizontal.svg"
            favicon = page.request.get(f"{BASE}{favicon_href}").text()
            assert 'M38 54h10V42h10' in favicon
            assert 'rotate(90 48 48)' in favicon
            assert favicon.count('#0e7c6b') == 2
            assert '#2fb39c' not in favicon

            # The header shows its links or the button that stands in for them,
            # never both and never neither.
            links = page.locator(".nav").first.is_visible()
            button = page.locator('[data-menu="nav"] .menu__summary').is_visible()
            if links == button:
                shown = "the links and the menu button" if links else "neither"
                problems.append(f"{name}-{label}: header shows {shown}")

            # The sections alternate between two backgrounds, and a card is the
            # colour its section is not: a panel painted like its section
            # disappears into it, which three of them did. A plain section has no
            # background of its own, so the walk climbs to the one it really shows.
            flat = page.evaluate("""() => {
              const shown = (el) => {
                let node = el;
                while (node) {
                  const bg = getComputedStyle(node).backgroundColor;
                  if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
                  node = node.parentElement;
                }
                return '';
              };
              const bad = [];
              for (const panel of document.querySelectorAll(
                     '.card, .plan, .fact')) {
                const section = panel.closest('section');
                if (shown(section) === shown(panel)) {
                  bad.push(panel.className + ' in #' + section.id);
                }
              }
              return bad;
            }""")
            if flat:
                problems.append(
                    f"{name}-{label}: panels with no contrast against their section: {flat}"
                )

            backgrounds = page.evaluate("""() => {
              const color = el => {
                while (el) {
                  const bg = getComputedStyle(el).backgroundColor;
                  if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
                  el = el.parentElement;
                }
              };
              return [...document.querySelectorAll('main > section, body > footer')].map(color);
            }""")
            if any(a == b for a, b in zip(backgrounds, backgrounds[1:])):
                problems.append(f"{name}-{label}: adjacent section/footer backgrounds match")

            # Both menus are the same component, so both are opened and
            # measured here: the panel has to fit what is inside it, hang
            # from its own button and close when the visitor clicks away. The
            # picker switches the page in English and does nothing in Spanish,
            # which is the state the page starts in.
            menus = page.locator("[data-menu]")
            if menus.count() < 2:
                problems.append(f"{name}-{label}: the header has no language picker")
            for which in ("nav", "lang"):
                menu = page.locator(f'[data-menu="{which}"]')
                if not menu.count():
                    continue
                if not menu.locator(".menu__summary").is_visible():
                    continue      # the nav menu is for small screens only
                menu.locator(".menu__summary").click()
                box = fits(menu, which, name, label, problems)
                if which == "lang":
                    if box.locator("[data-lang-option]").count() < 2:
                        problems.append(
                            f"{name}-{label}: the picker lists no languages"
                        )
                    page.screenshot(path=str(OUT / f"picker-{label}.png"))
                    # A click away closes it; escape closes it too.
                    page.mouse.click(20, 400)
                    if menu.evaluate("m => m.open"):
                        problems.append(
                            f"{name}-{label}: the picker stays open after a click away"
                        )
                    menu.locator(".menu__summary").click()
                    page.keyboard.press("Escape")
                    if menu.evaluate("m => m.open"):
                        problems.append(f"{name}-{label}: escape does not close the picker")
                    menu.locator(".menu__summary").click()
                    page.locator(
                        f'[data-menu="lang"] [data-lang-option="{name}"]'
                    ).click()
                    page.wait_for_function(
                        "() => document.documentElement.lang === '%s'" % name,
                        timeout=5000,
                    )
                    if page.url != f"{BASE}/":
                        problems.append(f"{name}-{label}: switching navigated away")

            page.wait_for_function(
                "() => document.documentElement.lang === '%s'" % name, timeout=5000
            )
            if page.locator("h1").inner_text().strip() != HEADLINES[name]:
                problems.append(
                    f"{name}-{label}: headline is {page.locator('h1').inner_text()!r}"
                )

            channels = page.locator('.channels')
            eyebrow = page.locator('.hero .eyebrow')
            assert eyebrow.locator('.term').count() == 0
            assert eyebrow.evaluate('el => getComputedStyle(el).textTransform') == 'uppercase'
            assert channels.locator('a').count() == 4
            assert channels.locator('img').evaluate_all(
                'images => images.every(img => img.complete && img.naturalWidth > 0)'
            )
            for host in ('whatsapp.com', 'telegram.org', 'signal.org', 'simplex.chat'):
                assert channels.locator(f'a[href="https://{host}"]').count() == 1
            pitch_box = page.locator('.hero__pitch').bounding_box()
            channels_box = channels.bounding_box()
            if width >= 900:
                assert channels_box['x'] >= pitch_box['x'] + pitch_box['width']
            else:
                assert channels_box['y'] >= pitch_box['y'] + pitch_box['height']
            term = page.locator('.hero__sub [data-term="messaging"]')
            term.click()
            help_box = page.locator('#term-help')
            if not help_box.is_visible() or help_box.inner_text() != term.get_attribute('title'):
                problems.append(f"{name}-{label}: clicking a term did not show its help")
            for brand in ('WhatsApp', 'Telegram', 'Signal', 'SimpleX Chat'):
                assert brand in help_box.inner_text()
            box = help_box.bounding_box()
            if box and (box['x'] < 0 or box['x'] + box['width'] > width):
                problems.append(f"{name}-{label}: term help overflows the viewport")
            term.click()
            if help_box.is_visible():
                problems.append(f"{name}-{label}: clicking a term again did not close help")
            term.focus()
            page.keyboard.press('Enter')
            if not help_box.is_visible():
                problems.append(f"{name}-{label}: term help is not keyboard accessible")
            page.keyboard.press('Escape')
            if help_box.is_visible():
                problems.append(f"{name}-{label}: Escape did not close term help")
            term.click()
            page.locator('.hero h1').click()
            if help_box.is_visible():
                problems.append(f"{name}-{label}: outside click did not close term help")

            # The illustration is readable content, and its request panel must
            # translate too. It is not a booking confirmation or a live screen.
            expected_status = {
                "es": "Por confirmar", "en": "Awaiting confirmation", "pt": "A confirmar",
                "fr": "À confirmer", "de": "Noch zu bestätigen", "it": "Da confermare",
            }
            if page.locator(".mock__status").first.inner_text() != expected_status[name]:
                problems.append(f"{name}-{label}: the request status did not translate")
            if not page.locator(".mock__request").first.is_visible():
                problems.append(f"{name}-{label}: the example stops at the conversation")

            for section_id, count in (("examples", 4), ("api-examples", 3)):
                host = page.locator(f"#{section_id}")
                if host.locator("figure.mock").count() != count:
                    problems.append(f"{name}-{label}: #{section_id} has missing examples")
                next_button = host.locator("[data-mock-next]")
                if width >= 900:
                    next_button.click()
                    page.wait_for_function(
                        "id => document.querySelector(`#${id} .mocks__track`).scrollLeft > 10",
                        arg=section_id,
                    )
                    page.wait_for_timeout(500)
                    host.locator("[data-mock-prev]").click()
                    page.wait_for_function(
                        "id => document.querySelector(`#${id} .mocks__track`).scrollLeft < 2",
                        arg=section_id,
                    )
                elif next_button.is_visible():
                    problems.append(f"{name}-{label}: #{section_id} shows desktop arrows")

            # A limit is one thing on one line: "50 MB", never "50" over "MB".
            split = page.evaluate("""() => {
              const bad = [];
              for (const value of document.querySelectorAll('.row__value:not(.row__value--text)')) {
                const range = document.createRange();
                range.selectNodeContents(value.firstElementChild);
                if (range.getClientRects().length > 1) bad.push(value.textContent.trim());
              }
              return bad;
            }""")
            if split:
                problems.append(f"{name}-{label}: a plan value wraps: {split}")

            # The controls over the table are anchored to the edges: the period
            # switch on the left, the currency on the right, the two the same
            # size on one line, and neither a section of its own above the cards.
            bar = page.evaluate("""() => {
              const bar = document.querySelector('.plans__bar');
              const box = (el) => el.getBoundingClientRect();
              const barBox = box(bar);
              const toggle = box(bar.querySelector('.plans__switch'));
              const money = box(bar.querySelector('[data-menu="currency"]'));
              return {
                switchLeft: Math.round(toggle.left - barBox.left),
                moneyRight: Math.round(barBox.right - money.right),
                sameHeight: Math.round(toggle.height - money.height),
                sameTop: Math.round(toggle.top - money.top),
                gap: Math.round(box(document.querySelector('.plans__grid')).top
                  - barBox.bottom),
                options: document.querySelectorAll('[data-currency-option]').length,
                shown: document.querySelector('[data-currency-shown]').textContent,
              };
            }""")
            if bar["options"] < 10 or bar["shown"] not in page.evaluate(
                    "() => [...document.querySelectorAll('[data-currency-option]')]"
                    ".map(o => o.dataset.currencyOption)"):
                problems.append(f"{name}-{label}: the currency selector is not a selector")
            if abs(bar["switchLeft"]) > 2:
                problems.append(
                    f"{name}-{label}: the period switch is {bar['switchLeft']}px off the left"
                )
            if abs(bar["moneyRight"]) > 2:
                problems.append(
                    f"{name}-{label}: the currency is {bar['moneyRight']}px off the right"
                )
            if bar["gap"] > 24:
                problems.append(f"{name}-{label}: {bar['gap']}px between the controls and the plans")
            # Every card starts on the same line, whether or not it wears the
            # "Recommended" tag: the ones without it reserve the same room.
            # (Only when the cards sit side by side: stacked, each one starts its
            # own row and lining up means nothing.)
            starts = page.evaluate("""() => [...document.querySelectorAll(
              '.plans__grid .plan:not(.plan--wide)'
            )].map((card) => Math.round(
              card.querySelector('.plan__name').getBoundingClientRect().top))""")
            if width >= 900 and len(set(starts)) > 1:
                problems.append(f"{name}-{label}: the plan names do not line up: {starts}")

            # The two controls share one line at every width, the switch on the
            # left and the currency on the right: same top, same height.
            if abs(bar["sameHeight"]) > 2 or abs(bar["sameTop"]) > 2:
                problems.append(
                    f"{name}-{label}: the two controls do not line up: "
                    f"{bar['sameHeight']}px of height, {bar['sameTop']}px of top"
                )

            page.screenshot(path=str(OUT / f"{name}-{label}.png"), full_page=True)

            b = budget(page, f"{BASE}/")
            print(f"[{name}-{label}] requests={b['requests']} html={b['html']}B")
            for r in b["resources"]:
                print(f"    {r['size']:>7}B {r['name'].replace(BASE, '')}")
            # HTML, CSS, JS, terms, optional dictionary and four local brand SVGs.
            if b["requests"] > 9:
                problems.append(f"{name}-{label}: {b['requests']} requests")

            # overflow check: nothing may push the page sideways
            overflow = page.evaluate(
                "() => document.documentElement.scrollWidth - "
                "document.documentElement.clientWidth"
            )
            if overflow > 0:
                problems.append(f"{name}-{label}: horizontal overflow {overflow}px")

            # the price switch, without script
            page.locator("label[for=period-yearly]").first.click()
            yearly = page.locator(".price--yearly").first.is_visible()
            monthly = page.locator(".price--monthly").first.is_visible()
            if not yearly or monthly:
                problems.append(
                    f"{name}-{label}: switch yearly={yearly} monthly={monthly}"
                )
            # The annual price shows the monthly one it discounts, crossed out,
            # and the line is drawn at an angle: a flat one hides the figure.
            was = page.evaluate("""() => {
              const node = document.querySelector('.price--yearly .price__was');
              if (!node) return null;
              return {
                text: node.textContent,
                line: getComputedStyle(node, '::after').transform,
              };
            }""")
            if not was or not was["text"].startswith("$"):
                problems.append(f"{name}-{label}: the annual price hides what it saves")
            elif was["line"] in ("none", ""):
                problems.append(f"{name}-{label}: the crossed price is not crossed")

            page.locator("label[for=period-monthly]").first.click()
            if not page.locator(".price--monthly").first.is_visible():
                problems.append(f"{name}-{label}: switch does not go back to monthly")

            # The waitlist: a real mail client handoff for a visitor without a
            # script, and one dialog behind it for everyone else. It starts
            # closed, opens from the call to action, asks four things, and closes
            # with escape. The trap is off the screen, where nobody clicks it.
            cta = page.locator(".header [data-waitlist-open]")
            if not cta.is_visible():
                cta = page.locator(".cta [data-waitlist-open]")
            if "mailto:" not in (cta.get_attribute("href") or ""):
                problems.append(f"{name}-{label}: primary CTA is not a waitlist mailto")
            dialog = page.locator("#waitlist")
            if not dialog.count():
                problems.append(f"{name}-{label}: the waitlist dialog is not in the page")
            elif dialog.is_visible():
                problems.append(f"{name}-{label}: the waitlist is open on load")
            else:
                cta.click()
                if not dialog.is_visible():
                    problems.append(f"{name}-{label}: the waitlist did not open")
                asked = dialog.locator(".waitlist__step, input[type=email]").count()
                if asked != 4:
                    problems.append(f"{name}-{label}: the waitlist asks {asked} things")
                trap = dialog.locator('input[name="website"]').bounding_box()
                if trap and trap["x"] > 0:
                    problems.append(f"{name}-{label}: the honeypot is on the screen")
                dialog.locator("[data-waitlist-close]").click()
                if dialog.is_visible():
                    problems.append(f"{name}-{label}: close does not close the waitlist")

            # the FAQ, keyboard only
            page.locator(".faq summary").first.focus()
            page.keyboard.press("Enter")
            if not page.locator(".faq details").first.evaluate("d => d.open"):
                problems.append(f"{name}-{label}: FAQ did not open with the keyboard")

            # One answer at a time: opening a second one closes the first.
            page.locator('[data-i18n="faq.summary.0"]').click()
            opened = page.evaluate("""() => [...document.querySelectorAll('#faq details')]
              .map((one, at) => (one.open ? at : -1)).filter((at) => at >= 0)""")
            if len(opened) != 1:
                problems.append(f"{name}-{label}: {len(opened)} answers open at once")

            page.locator('[data-i18n="faq.summary.3"]').click()
            page.locator('[data-i18n="faq.management-link"]').click()
            if not page.url.endswith("#examples"):
                problems.append(f"{name}-{label}: CRM answer does not link to Pautia examples")

            page.locator('[data-i18n="faq.summary.6"]').click()
            if page.locator('.account-safety').count():
                problems.append(f"{name}-{label}: account-safety details clutter the landing")
            if page.locator('.faq__answer > a[href="/seguridad-whatsapp"]').count() != 1:
                problems.append(f"{name}-{label}: account-safety link is outside the answer")
            page.locator('a[href="/seguridad-whatsapp"]').click()
            page.wait_for_load_state("networkidle")
            if not page.url.endswith("/seguridad-whatsapp"):
                problems.append(f"{name}-{label}: account-safety link did not reach its target")
            if page.locator('.account-safety li').count() != 4:
                problems.append(f"{name}-{label}: account-safety explanation is incomplete")
            if page.locator('html').get_attribute('lang') != name:
                problems.append(f"{name}-{label}: account-safety page lost the chosen language")
            page.goto(f"{BASE}/", wait_until="networkidle")
            page.locator('[data-i18n="faq.summary.8"]').click()
            page.locator('a[href="/campanas-masivas"]').click()
            page.wait_for_load_state("networkidle")
            if page.locator('.campaign-limits li').count() != 2:
                problems.append(f"{name}-{label}: mass-campaign limits are incomplete")
            if page.locator('html').get_attribute('lang') != name:
                problems.append(f"{name}-{label}: campaign limits page lost the chosen language")

            if errors:
                problems.append(f"{name}-{label}: console errors {errors}")
            ctx.close()

    # dark mode
    ctx = browser.new_context(color_scheme="dark", viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(f"{BASE}/", wait_until="networkidle")
    page.screenshot(path=str(OUT / "dark.png"))
    ctx.close()

    # The choice survives a reload, and coming back to a language the page was
    # not written in puts its text back, not only its lang attribute. This is the
    # round trip that used to pass while the page stayed in the other language.
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    page = ctx.new_page()
    page.goto(f"{BASE}/", wait_until="networkidle")
    page.locator('[data-menu="lang"] .menu__summary').click()
    page.locator('[data-menu="lang"] [data-lang-option="es"]').click()
    page.wait_for_function("() => document.documentElement.lang === 'es'", timeout=5000)
    if page.locator("h1").inner_text().strip() != HEADLINES["es"]:
        problems.append("round trip: switching to Spanish left the text in English")
    page.reload(wait_until="networkidle")
    if page.locator("html").get_attribute("lang") != "es" \
            or page.locator("h1").inner_text().strip() != HEADLINES["es"]:
        problems.append("reload: the chosen language was forgotten")
    page.locator('[data-menu="lang"] .menu__summary').click()
    page.locator('[data-menu="lang"] [data-lang-option="en"]').click()
    page.wait_for_function("() => document.documentElement.lang === 'en'", timeout=5000)
    if page.locator("h1").inner_text().strip() != HEADLINES["en"]:
        problems.append("round trip: coming back to English left the text in Spanish")
    page.reload(wait_until="networkidle")
    if page.locator("h1").inner_text().strip() != HEADLINES["en"]:
        problems.append("reload: English did not come back")

    # The copy of the choice an older version of the script left in localStorage
    # must decide nothing now that the cookie is the only store: with no cookies
    # at all, the page keeps the language it was served in, and the leftovers are
    # cleared on the way so they cannot come back.
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    page = ctx.new_page()
    page.goto(f"{BASE}/", wait_until="networkidle")
    page.evaluate("""() => {
      localStorage.setItem('pautia:lang', 'en');
      localStorage.setItem('pautia:currency', 'MXN');
    }""")
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(400)
    stale = page.evaluate("""() => ({
      lang: document.documentElement.lang,
      headline: document.querySelector('h1').textContent.trim(),
      kept: [localStorage.getItem('pautia:lang'), localStorage.getItem('pautia:currency')],
    })""")
    if stale["lang"] != "es" or stale["headline"] != HEADLINES["es"]:
        problems.append(f"stale: a leftover in localStorage chose a language: {stale}")
    if any(stale["kept"]):
        problems.append(f"stale: the leftovers were not cleared: {stale['kept']}")
    ctx.close()

    # The currency: chosen by hand, marked, applied to every price and to the
    # structured data, and remembered for the next visit.
    ctx = browser.new_context(viewport={"width": 1280, "height": 900}, locale="es-MX")
    page = ctx.new_page()
    page.goto(f"{BASE}/", wait_until="networkidle")
    page.locator('[data-menu="currency"] .menu__summary').click()
    page.locator('[data-currency-option="MXN"]').click()
    page.wait_for_function(
        "() => document.querySelector('.price__amount').textContent.startsWith('MX$')",
        timeout=8000,
    )
    # Only the figures that carry a base convert: the quoted plan says "Custom
    # price" and has no number to convert.
    shown = page.evaluate("""() => [...document.querySelectorAll('.price--monthly [data-money]')]
      .map((node) => node.textContent)""")
    if not shown or not all(price.startswith("MX$") for price in shown):
        problems.append(f"currency: the prices did not take the symbol: {shown}")
    money = page.evaluate("""() => JSON.parse(document.querySelector(
        'script[type="application/ld+json"]').textContent
    ).offers.map((offer) => offer.priceCurrency)""")
    if set(money) != {"MXN"}:
        problems.append(f"currency: the structured data still says {money}")

    # A converted price is one piece of text that names its currency, on one
    # line, and the three cards stay level with each other.
    converted = page.evaluate("""() => {
      const cards = [...document.querySelectorAll('.plans__grid .plan:not(.plan--wide)')];
      const shown = cards.map((card) => card.querySelector('.price--monthly .price__amount'));
      return {
        texts: shown.map((node) => node.textContent),
        lines: shown.map((node) => {
          const range = document.createRange();
          range.selectNodeContents(node);
          return range.getClientRects().length;
        }),
        tables: [...new Set(cards.map((card) => Math.round(
          card.querySelector('.plan__rows').getBoundingClientRect().top)))].length,
      };
    }""")
    if not all(text.startswith("MX$") for text in converted["texts"]):
        problems.append(
            f"currency: the prices do not name their currency: {converted['texts']}"
        )
    if set(converted["lines"]) != {1}:
        problems.append(f"currency: a price takes more than one line: {converted['lines']}")
    if converted["tables"] != 1:
        problems.append("currency: the three tables do not line up in this currency")
    if "pautia:currency=MXN" not in page.evaluate("() => document.cookie"):
        problems.append("currency: the choice was not written down")
    page.reload(wait_until="networkidle")
    page.wait_for_function(
        "() => document.querySelector('.price__amount').textContent.startsWith('MX$')",
        timeout=8000,
    )

    # A rates table written by an older version of the script has no rates in it,
    # and trusting it left the page stuck in dollars for a day. It has to be
    # spotted, dropped and asked for again.
    page.evaluate("""() => localStorage.setItem('pautia:rate',
      JSON.stringify({ at: Date.now(), mxn: 17.671073 }))""")
    page.reload(wait_until="networkidle")
    page.wait_for_function(
        "() => document.querySelector('.price__amount').textContent.startsWith('MX$')",
        timeout=8000,
    )
    if page.evaluate("() => JSON.parse(localStorage.getItem('pautia:rate')).rates === undefined"):
        problems.append("currency: the page kept a rates table it cannot use")

    # And a language change must not convert a price that was already converted:
    # "MX$159.04", never "MXMX$159.04".
    page.locator('[data-menu="lang"] .menu__summary').click()
    page.locator('[data-menu="lang"] [data-lang-option="en"]').click()
    page.wait_for_function("() => document.documentElement.lang === 'en'")
    doubled = page.evaluate("""() => [...document.querySelectorAll('[data-money]')]
      .map((node) => node.textContent)
      .filter((text) => (text.match(/MX\\$/g) || []).length > 1)""")
    if doubled:
        problems.append(f"currency: a price converted twice: {doubled}")
    page.locator('[data-menu="lang"] .menu__summary').click()
    page.locator('[data-menu="lang"] [data-lang-option="es"]').click()
    page.wait_for_function("() => document.documentElement.lang === 'es'")
    page.locator('[data-menu="currency"] .menu__summary').click()
    page.locator('[data-currency-option="USD"]').click()
    page.wait_for_function(
        "() => document.querySelector('.price__amount').textContent.startsWith('$')",
        timeout=8000,
    )
    # Back in dollars the figure is the one the page was written with, not the
    # arithmetic of multiplying by one: "$9", never "$9,00".
    back = page.evaluate("""() => ({
      prices: [...document.querySelectorAll('.plans__grid .plan:not(.plan--wide)')]
        .map((card) => card.querySelector('.price--monthly .price__amount').textContent),
    })""")
    if back["prices"] != ["$9", "$39", "$69"]:
        problems.append(f"currency: the dollar prices came back as {back['prices']}")

    # The choice lives in the cookie and nowhere else, so clearing the cookies
    # leaves no second copy remembering what the visitor threw away.
    page.locator('[data-menu="currency"] .menu__summary').click()
    page.locator('[data-currency-option="MXN"]').click()
    page.wait_for_function(
        "() => document.querySelector('.price__amount').textContent.includes('MX$')",
        timeout=8000,
    )
    page.evaluate("""() => document.cookie.split(";").forEach((pair) => {
      document.cookie = pair.trim().split("=")[0] + "=; path=/; max-age=0";
    })""")
    page.reload(wait_until="networkidle")
    forgotten = page.evaluate("""() => ({
      prices: [...document.querySelectorAll('.plans__grid .plan:not(.plan--wide)')]
        .map((card) => card.querySelector('.price--monthly .price__amount').textContent),
      kept: [localStorage.getItem('pautia:currency'), localStorage.getItem('pautia:lang')],
    })""")
    if forgotten["prices"] != ["$9", "$39", "$69"]:
        problems.append(
            f"currency: the page kept a choice after the cookies went: {forgotten['prices']}"
        )
    if any(forgotten["kept"]):
        problems.append(f"localStorage: a second copy of a choice: {forgotten['kept']}")
    ctx.close()

    # The pricing route: the full table the landing page keeps short. The
    # Enterprise card and the builder are here, and the builder still prices a
    # basic plan the same way.
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(f"{BASE}/pricing", wait_until="networkidle")
    if page.locator(".plan--wide").count() != 1:
        problems.append("pricing: the Enterprise card is missing")
    if not page.locator("[data-custom-plan]").count():
        problems.append("pricing: the plan builder is missing")
    assert page.locator('#custom-storage-output').text_content() == '5 GB'
    for tier, size in [('professional', '10 GB'), ('standard', '5 GB')]:
        page.locator(f'input[name="custom-plan-base"][value="{tier}"]').check()
        assert page.locator('#custom-storage-output').text_content() == size
    credits = page.locator("#ai-credits")
    assert credits.locator("details").count() == 3
    assert credits.locator("input, a").count() == 0
    credits.locator("summary").first.click()
    assert credits.locator("details").first.get_attribute("open") is not None
    fuzzy = credits.locator('[data-term="fuzzy-routing"]').first
    assert "sin IA" in fuzzy.get_attribute("title")
    fuzzy.click()
    assert page.locator("#term-help").is_visible()
    assert page.locator("#term-help").text_content() == fuzzy.get_attribute("title")
    page.keyboard.press("Escape")
    assert page.locator("#term-help").is_hidden()
    builder = page.locator('input[name="custom-plan-base"][value="basic"]')
    builder.evaluate("el => el.scrollIntoView({ block: 'center' })")
    builder.check()
    assert page.locator('#custom-storage-output').text_content() == '1 GB'
    page.evaluate("""() => {
      for (const [id, value] of [
          ['custom-bots', 2], ['custom-storage', 2100],
      ]) {
        const input = document.getElementById(id);
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }""")
    estimate = page.locator('[data-custom-price="total"]')
    if estimate.text_content() != "$15.10":
        problems.append(f"pricing: custom monthly estimate is {estimate.text_content()}")
    page.locator("label[for=period-yearly]").first.click()
    annual = page.locator(".custom-plan__annual")
    if estimate.text_content() != "$12.08" or "$144.96" not in annual.text_content():
        problems.append(
            f"pricing: custom yearly estimate is {estimate.text_content()}, "
            f"{annual.text_content()}"
        )
    page.locator('label[for=period-monthly]').first.click()
    page.evaluate("""() => {
      for (const id of ['custom-bots', 'custom-storage']) {
        const input = document.getElementById(id);
        input.value = input.max;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }""")
    assert page.locator('#custom-bots').input_value() == '100'
    assert page.locator('#custom-storage').input_value() == '1000000'
    assert page.locator('#custom-storage-output').text_content() == '1 TB'
    assert page.locator('[data-custom-max="storage"]').text_content() == '1 TB'
    assert estimate.text_content() == '$708.90'
    ctx.close()

    ctx = browser.new_context(java_script_enabled=False,
                              viewport={"width": 1280, "height": 900})
    page = ctx.new_page()
    page.goto(f"{BASE}/", wait_until="load")
    # Counted on the served HTML: with no script there are no locators to ask.
    served = page.content()
    if served.count('<article class="plan') != 3:
        problems.append("no script: the landing does not render its three plans")
    if "<h1" not in served or HEADLINES["es"] not in served:
        problems.append("no script: the page is not readable without a script")
    if 'class="lang"' in served:
        problems.append("no script: a language picker that cannot work is in the page")
    page.screenshot(path=str(OUT / "no-js.png"), full_page=True)
    ctx.close()

    ctx = browser.new_context(java_script_enabled=False,
                              viewport={"width": 1280, "height": 900})
    page = ctx.new_page()
    page.goto(f"{BASE}/pricing", wait_until="load")
    served = page.content()
    if served.count('<article class="plan') != 4:
        problems.append("no script: the pricing page does not render its four plans")
    if "Planes y precios" not in served:
        problems.append("no script: the pricing page is not readable without a script")
    page.screenshot(path=str(OUT / "no-js-pricing.png"), full_page=True)
    ctx.close()

    # the legal shells
    for slug in ("privacidad", "terminos", "cookies"):
        ctx = browser.new_context(viewport={"width": 900, "height": 700})
        page = ctx.new_page()
        page.goto(f"{BASE}/legal/{slug}.html", wait_until="networkidle")
        page.screenshot(path=str(OUT / f"legal-{slug}.png"), full_page=True)
        ctx.close()

    browser.close()

print("\nPROBLEMS:" if problems else "\nNo problems found.")
for x in problems:
    print(" -", x)
sys.exit(1 if problems else 0)
