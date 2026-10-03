"""Exercise the inline journey with a mocked API; never sends email.

Runs on a desktop and on a real phone profile (is_mobile, its own device pixel
ratio and viewport), because the phone is where the landing of the scroll went
wrong: the section landed 56 to 64 px too low and pushed the first question off
the screen, and a plain viewport size does not reproduce it.
"""
import json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    profiles = [("desktop", {"viewport": {"width": 1440, "height": 900}}),
                ("Pixel 7", p.devices["Pixel 7"])]
    for label, profile in profiles:
        ctx = browser.new_context(**profile)
        page = ctx.new_page()
        attempts = []

        def endpoint(route):
            attempts.append(route.request.post_data_json)
            route.fulfill(status=502 if len(attempts) == 1 else 200,
                          content_type="application/json",
                          body=json.dumps({"ok": len(attempts) > 1}))

        page.route("**/api/waitlist", endpoint)
        page.goto("http://127.0.0.1:8080/")
        page.locator(".hero__cta [data-waitlist-open]").click()
        wizard = page.locator("#waitlist")
        assert wizard.is_visible()
        # The journey lands with its first question just below the header, not
        # under it and not half a screen down: the smooth scroll has to finish.
        page.wait_for_timeout(2500)
        header = page.locator("header").bounding_box()
        title = page.locator(".waitlist__title").bounding_box()
        gap = title["y"] - (header["y"] + header["height"])
        assert 0 < gap < 40, (label, gap)
        assert wizard.locator(".waitlist__step:visible").count() == 1
        for name in ("rubro", "objetivo", "atencion"):
            wizard.locator(f'input[name="{name}"][value="__other"]').check()
            detail = wizard.locator(f'input[name="{name}_other"]')
            assert detail.is_visible()
            assert detail.get_attribute("maxlength") == "100"
            detail.fill("Respuesta de prueba")
            wizard.locator(".waitlist__navigation .btn--primary:visible").click()
        wizard.locator(".waitlist__navigation .btn--ghost").click()
        assert wizard.locator('input[name="atencion_other"]').input_value() == "Respuesta de prueba"
        wizard.locator(".waitlist__navigation .btn--primary:visible").click()
        wizard.locator('input[type="email"]').fill("test@example.com")
        wizard.locator('button[type="submit"]').click()
        page.wait_for_selector("[data-waitlist-error]:visible")
        assert wizard.locator('input[type="email"]').input_value() == "test@example.com"
        wizard.locator('button[type="submit"]').click()
        page.wait_for_selector("[data-waitlist-done]:visible")
        assert not wizard.locator("form").is_visible()
        # The last step has to be readable without scrolling: the text it ends
        # on cannot sit below the fold.
        last = wizard.locator(".waitlist__done p").bounding_box()
        assert last["y"] + last["height"] <= page.viewport_size["height"], (label, last)
        assert len(attempts) == 2
        assert attempts[1]["rubro_other"] == "Respuesta de prueba"
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        ctx.close()
    browser.close()
print("Inline waitlist, landing, Other, back, retry and success: OK")
