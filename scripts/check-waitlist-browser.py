"""Exercise the inline journey with a mocked API; never sends email."""
import json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    for width in (390, 1440):
        page = browser.new_page(viewport={"width": width, "height": 900})
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
        assert len(attempts) == 2
        assert attempts[1]["rubro_other"] == "Respuesta de prueba"
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.close()
    browser.close()
print("Inline waitlist, Other, back, retry and success: OK")
