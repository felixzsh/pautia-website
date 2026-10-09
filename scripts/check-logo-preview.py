"""Check the reference logo and its mirrored preview; needs make serve."""

import os
from io import BytesIO
from pathlib import Path
from xml.etree import ElementTree

from playwright.sync_api import sync_playwright
from PIL import Image


def shapes(root):
    result = []
    for node in root:
        tag = node.tag.split("}")[-1]
        if tag not in ("path", "rect"):
            continue
        attrs = {key: " ".join(value.split()) for key, value in node.attrib.items()}
        result.append((tag, attrs))
    return result


source = ElementTree.parse("public/assets/logo.svg").getroot()
approved = shapes(source)
assert source.attrib["viewBox"] == "0 0 24 24"
assert len(approved) == 1
assert approved[0][1]["fill"] == "#06252b"
assert approved[0][1]["fill-rule"] == "evenodd"
assert approved[0][1]["d"].count("h6.96") == 2
assert approved[0][1]["d"].count("h2.64") == 1

ns = "{http://www.w3.org/2000/svg}"
chosen = ElementTree.parse("public/assets/logo-mirror.svg").getroot().find(f"{ns}g")
assert chosen.attrib["transform"] == "translate(24 0) scale(-1 1)"
icons = ElementTree.fromstring(Path("site/_includes/icons.njk").read_text())
mark = icons.find(".//*[@id='i-pautia']")
assert shapes(mark) == shapes(chosen), "the page must use the chosen artwork without redrawing"
assert mark.attrib["transform"] == chosen.attrib["transform"]
favicon = ElementTree.parse("public/assets/favicon.svg").getroot().find(f"{ns}g")
assert shapes(favicon) == shapes(chosen)
assert favicon.attrib["transform"] == chosen.attrib["transform"]

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(java_script_enabled=False)
    base = os.environ.get("PAUTIA_BASE", "http://127.0.0.1:8080")
    # The preview must work as a local file too, not only behind a running server.
    preview = Path("public/assets/logo-concepts/preview.html").resolve().as_uri()
    page.goto(preview, wait_until="load")
    assert page.locator("article").count() == 2
    assert page.locator("img").evaluate_all(
        "images => images.every(img => img.complete && img.naturalWidth > 0)"
    )
    assert page.locator("article").first.locator("img").evaluate_all(
        "images => images.every(img => img.getAttribute('src') === '../logo.svg')"
    )
    assert page.locator("article").last.locator("img").evaluate_all(
        "images => images.every(img => img.getAttribute('src') === '../logo-mirror.svg')"
    )
    for width in (1200, 390, 320):
        page.set_viewport_size({"width": width, "height": 900})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")

    # Check actual pixels: no white paint, neither outside the bubble nor inside its bars.
    page.set_viewport_size({"width": 240, "height": 240})
    page.set_content(
        "<style>body{margin:0}svg{display:block;width:240px;height:240px}</style>"
        + Path("public/assets/logo.svg").read_text()
    )
    raster = Image.open(BytesIO(page.screenshot(omit_background=True))).convert("RGBA")
    assert raster.getpixel((40, 100)) == (6, 37, 43, 255)
    for point in ((5, 5), (120, 65), (120, 109), (98, 154)):
        assert raster.getpixel(point)[3] == 0, f"{point}: logo must be transparent"

    page.set_content(
        "<style>body{margin:0}svg{display:block;width:240px;height:240px}</style>"
        + Path("public/assets/logo-mirror.svg").read_text()
    )
    mirror = Image.open(BytesIO(page.screenshot(omit_background=True))).convert("RGBA")
    # The three cutouts share their left edge after mirroring the bubble.
    starts = []
    for y in (65, 109, 154):
        starts.append(next(x for x in range(40, 180) if mirror.getpixel((x, y))[3] == 0))
    assert len(set(starts)) == 1, "all three mirrored cutouts must be left-aligned"
    assert mirror.getpixel((40, 100))[3] == 255
    assert mirror.getpixel((5, 5))[3] == 0

    page.set_viewport_size({"width": 390, "height": 900})
    for route in ("/", "/pricing", "/seguridad-whatsapp", "/campanas-masivas"):
        page.goto(f"{base}{route}", wait_until="networkidle")
        favicon_href = page.locator('link[rel="icon"]').get_attribute("href")
        assert favicon_href == "/assets/logo-mirror.svg"
        assert page.locator(".brand__mark use").get_attribute("href") == "#i-pautia"
    browser.close()

print("Reference logo, shared icon, favicon and exact mirrored preview: OK")
