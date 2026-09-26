"""Render the landing page in a real browser and check what greps cannot: console
errors, horizontal overflow, the number of requests, the price switch, and the
FAQ opened with the keyboard alone.

This is a developer tool, not a dependency of the page. It needs playwright and
a server already running on the port below:

    make serve
    make check-browser

Screenshots land in the system temporary directory so they never reach a
commit."""

import pathlib
import sys
import tempfile
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8080"
OUT = pathlib.Path(tempfile.gettempdir()) / "pautia-landing"
OUT.mkdir(parents=True, exist_ok=True)

# What the headline says in each language, so a dictionary that loads half way
# or a swap that misses a key cannot pass unnoticed.
HEADLINES = {
    "en": "An agent for your business's WhatsApp",
    "es": "Un agente para el WhatsApp de tu negocio",
}

problems = []


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
        for name, locale in (("en", "en-US"), ("es", "es-ES")):
            ctx = browser.new_context(
                viewport={"width": width, "height": 900},
                device_scale_factor=1,
                locale=locale,
            )
            # The browser language must not decide anything: one URL, one page, and
            # English until the visitor says otherwise.
            page = ctx.new_page()
            errors = []
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(f"{BASE}/", wait_until="networkidle")
            if page.locator("html").get_attribute("lang") != "en":
                problems.append(f"{name}-{label}: the page opened in the wrong language")

            if name == "es":
                picker = page.locator(".lang")
                if not picker.count():
                    problems.append(f"{name}-{label}: no language picker in the header")
                else:
                    page.locator(".lang__summary").click()
                    body = page.locator(".lang__body")
                    box = body.bounding_box()
                    button = page.locator(".lang__summary").bounding_box()
                    if not box or box["y"] < button["y"] + button["height"] - 1:
                        problems.append(
                            f"{name}-{label}: the picker does not open below the button"
                        )
                    if body.locator("[data-lang-option]").count() < 2:
                        problems.append(f"{name}-{label}: the picker lists no languages")
                    page.screenshot(path=str(OUT / "picker.png"))
                    page.locator('[data-lang-option="es"]').click()
                    page.wait_for_function(
                        "() => document.documentElement.lang === 'es'", timeout=5000
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
            page.screenshot(path=str(OUT / f"{name}-{label}.png"), full_page=True)

            b = budget(page, f"{BASE}/")
            print(f"[{name}-{label}] requests={b['requests']} html={b['html']}B")
            for r in b["resources"]:
                print(f"    {r['size']:>7}B {r['name'].replace(BASE, '')}")
            if b["requests"] > 5:
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
            note = page.locator(".note--yearly").first.is_visible()
            if not yearly or monthly or not note:
                problems.append(
                    f"{name}-{label}: switch yearly={yearly} monthly={monthly} note={note}"
                )
            page.locator("label[for=period-monthly]").first.click()
            if not page.locator(".price--monthly").first.is_visible():
                problems.append(f"{name}-{label}: switch does not go back to monthly")

            # the waitlist call to action: a real mail client handoff
            cta = page.locator(".hero__cta a.btn--primary").first
            if "mailto:" not in (cta.get_attribute("href") or ""):
                problems.append(f"{name}-{label}: primary CTA is not a waitlist mailto")
            if page.locator("dialog, [data-open-login]").count():
                problems.append(f"{name}-{label}: a login dialog is still in the page")

            # the FAQ, keyboard only
            page.locator(".faq summary").first.focus()
            page.keyboard.press("Enter")
            if not page.locator(".faq details").first.evaluate("d => d.open"):
                problems.append(f"{name}-{label}: FAQ did not open with the keyboard")

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
    page.locator(".lang__summary").click()
    page.locator('[data-lang-option="es"]').click()
    page.wait_for_function("() => document.documentElement.lang === 'es'", timeout=5000)
    if page.locator("h1").inner_text().strip() != HEADLINES["es"]:
        problems.append("round trip: switching to Spanish left the text in English")
    page.reload(wait_until="networkidle")
    if page.locator("html").get_attribute("lang") != "es" \
            or page.locator("h1").inner_text().strip() != HEADLINES["es"]:
        problems.append("reload: the chosen language was forgotten")
    page.locator(".lang__summary").click()
    page.locator('[data-lang-option="en"]').click()
    page.wait_for_function("() => document.documentElement.lang === 'en'", timeout=5000)
    if page.locator("h1").inner_text().strip() != HEADLINES["en"]:
        problems.append("round trip: coming back to English left the text in Spanish")
    page.reload(wait_until="networkidle")
    if page.locator("h1").inner_text().strip() != HEADLINES["en"]:
        problems.append("reload: English did not come back")
    ctx.close()

    ctx = browser.new_context(java_script_enabled=False,
                              viewport={"width": 1280, "height": 900})
    page = ctx.new_page()
    page.goto(f"{BASE}/", wait_until="load")
    # Counted on the served HTML: with no script there are no locators to ask.
    served = page.content()
    if served.count('<article class="plan') != 4:
        problems.append("no script: the page does not render its four plans")
    if "<h1" not in served or "An agent for your business" not in served:
        problems.append("no script: the page is not readable in English")
    if 'class="lang"' in served:
        problems.append("no script: a language picker that cannot work is in the page")
    page.screenshot(path=str(OUT / "no-js.png"), full_page=True)
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
