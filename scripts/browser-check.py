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
    for width, label in ((1440, "desktop"), (390, "mobile")):
        ctx = browser.new_context(
            viewport={"width": width, "height": 900},
            device_scale_factor=1,
            locale="es-ES",
        )
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))

        for name, url in (("es", f"{BASE}/"), ("en", f"{BASE}/en/")):
            page.goto(url, wait_until="networkidle")
            page.screenshot(path=str(OUT / f"{name}-{label}.png"), full_page=True)

            b = budget(page, url)
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
            problems.append(f"{label}: console errors {errors}")
        ctx.close()

    # dark mode
    ctx = browser.new_context(color_scheme="dark", viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(f"{BASE}/", wait_until="networkidle")
    page.screenshot(path=str(OUT / "es-dark.png"))
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
