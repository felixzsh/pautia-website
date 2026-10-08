"""Check the logo preview: python3 scripts/check-logo-preview.py (needs make serve)."""

import os
import re
from pathlib import Path
from xml.etree import ElementTree
from playwright.sync_api import sync_playwright

for svg in Path("public/assets/logo-concepts").glob("carril-*.svg"):
    source = svg.read_text()
    assert "Gradient" not in source, f"{svg}: logo colors must be flat"
    colors = set(re.findall(r"#[0-9a-fA-F]{6}", source))
    assert colors <= {"#0e7c6b"}, f"{svg}: logo must use one brand color"

folder = Path("public/assets/logo-concepts")
ns = "{http://www.w3.org/2000/svg}"
frame = ElementTree.parse(folder / "pauta.svg").find(f"{ns}path").attrib


def paths_of(name):
    return ElementTree.parse(folder / f"carril-{name}.svg").findall(f"{ns}path")


simple = paths_of("simple")
chosen = paths_of("horizontal")
descending = paths_of("horizontal-invertido")

# The chosen mark is the approved frame turned above and below, over the Simple route.
rotated = chosen[0].attrib.copy()
assert rotated.pop("transform") == "rotate(90 48 48)", "rotate the frame, do not redraw it"
assert rotated == simple[0].attrib
assert chosen[1].attrib == simple[1].attrib, "keep the Simple route unchanged"
assert descending[0].attrib == chosen[0].attrib, "same limits in both horizontal marks"
assert descending[1].attrib["d"] == "M36 42h12V54h12", "the descending route is longer"

# A hand-redrawn icon once squeezed the gaps on the real site. The shared icon, the
# favicon and the preview must all be the exact chosen geometry, only scaled.
icons = ElementTree.fromstring(Path("site/_includes/icons.njk").read_text())
mark = icons.find(".//*[@id='i-pautia']")
assert mark.attrib["transform"] == "scale(.25)"
assert [path.attrib for path in mark.findall("path")] == [path.attrib for path in chosen]
for favicon in ("favicon.svg", "favicon-horizontal.svg"):
    served = ElementTree.parse(Path("public/assets") / favicon).findall(f"{ns}path")
    assert [path.attrib for path in served] == [path.attrib for path in chosen]

for name in ("simple", "invertido"):
    paths = paths_of(name)
    assert paths[0].attrib == frame, f"{name}: preserve Carril's original frame"
    assert len(paths) == 2
    assert paths[1].attrib["stroke"] == "#0e7c6b"
    assert len(re.findall(r"[hHvV]", paths[1].attrib["d"])) == 3, "one less route segment"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(java_script_enabled=False)
    base = os.environ.get("PAUTIA_BASE", "http://127.0.0.1:8080")
    page.goto(f"{base}/assets/logo-concepts/preview.html", wait_until="networkidle")
    assert page.locator("article").count() == 4
    assert page.locator("img").evaluate_all(
        "images => images.every(img => img.complete && img.naturalWidth > 0)"
    )
    for width in (1200, 390, 320):
        page.set_viewport_size({"width": width, "height": 900})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    page.locator("#monochrome").check()
    light = page.locator(".light img").first
    dark = page.locator(".dark img").first
    assert light.evaluate("el => getComputedStyle(el).filter") == "brightness(0)"
    assert "invert(1)" in dark.evaluate("el => getComputedStyle(el).filter")
    page.locator("#monochrome").uncheck()
    assert light.evaluate("el => getComputedStyle(el).filter") == "none"

    page.goto(f"{base}/", wait_until="networkidle")
    for width in (1200, 390, 320):
        page.set_viewport_size({"width": width, "height": 900})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        for selector, size in ((".brand__mark", 46), (".channels__hub svg", 58)):
            logo = page.locator(selector)
            box = logo.bounding_box()
            assert box["width"] == size and box["height"] == size, "do not shrink the logo"
            geometry = logo.locator("use").evaluate("""el => {
                const box = el.getBBox();
                return [box.x, box.y, box.width, box.height];
            }""")
            assert geometry == [4.5, 5.5, 15, 13], "preserve the chosen mark's proportions"
            left, top, mark_w, mark_h = geometry
            assert round(left - (24 - left - mark_w), 6) == 0, "keep the mark centered"
            assert left >= 4 and top >= 4, "keep a gap between the limits and the route"
    assert page.locator(".brand__mark").evaluate("el => getComputedStyle(el).flexShrink") == "0"
    browser.close()

print("Logo previews, responsive layout and native monochrome toggle: OK")
