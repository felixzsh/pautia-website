"""Check the language machinery: key parity, the plan table, prices, the claims
guardrail, and the pitch. No dependencies, on purpose.

The page is written in the first language of its list and every other language is
a JSON file, so what has to hold is: every key in the page exists in each
dictionary, no dictionary carries a key the page does not use, and the two
languages never drift apart on the numbers.
"""

import json
import re
from decimal import Decimal
from html.parser import HTMLParser
from pathlib import Path

PAGE = Path("public/index.html")
I18N = Path("public/assets/i18n")


VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "source", "track", "wbr"}


class Page(HTMLParser):
    """The pieces of the page the checks need: JSON blocks, keys and their markup."""

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.open = []          # [key or None] for every element left open
        self.json = {}          # script id -> contents
        self.keys = []          # data-i18n values, in document order
        self.attr_keys = []     # (attr, key) pairs
        self.markup = set()     # keys whose element holds another element
        self._json_id = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        key = attrs.get("data-i18n")
        if tag == "script" and attrs.get("type") == "application/json":
            self._json_id = attrs.get("id")
        if key:
            self.keys.append(key)
        for pair in attrs.get("data-i18n-attrs", "").split(","):
            if pair:
                self.attr_keys.append(tuple(pair.split(":")))
        if tag in VOID:
            return
        if self.open and self.open[-1]:
            self.markup.add(self.open[-1])
        self.open.append(key)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if self.open:
            self.open.pop()
        if tag == "script":
            self._json_id = None

    def handle_data(self, data):
        if self._json_id is not None:
            self.json[self._json_id] = self.json.get(self._json_id, "") + data


page = Page()
page.feed(PAGE.read_text())
languages = json.loads(page.json["languages"])
source = languages[0]
assert "file" not in source, "the first language is the page itself, it has no file"

strings = {}
for lang in languages[1:]:
    path = I18N / lang["file"]
    assert path.exists(), f"{lang['code']}: {path} is listed but missing"
    strings[lang["code"]] = json.loads(path.read_text())

# Every file in the folder is a language the page offers, and the other way round.
on_disk = {p.name for p in I18N.glob("*.json")}
listed = {lang["file"] for lang in languages[1:]}
assert on_disk == listed, f"language files and list differ: {on_disk ^ listed}"

html = PAGE.read_text()
visible = re.sub(r"<!--.*?-->", "", html, flags=re.S)
keys = set(page.keys) | {key for _, key in page.attr_keys}

for code, table in strings.items():
    missing = sorted(keys - set(table))
    assert not missing, f"{code}: {len(missing)} keys the page uses and it lacks: {missing[:5]}"
    orphans = sorted(set(table) - keys)
    assert not orphans, f"{code}: {len(orphans)} keys the page never reads: {orphans[:5]}"

# A key whose element holds markup would lose that markup on every swap, so the
# page is written with the text in its own element instead.
for key in sorted(page.markup):
    assert key not in page.keys, \
        f"{key} holds markup: give the text an element of its own"

# Nothing in a dictionary may say what the page may not say.
for code, table in strings.items():
    blob = "\n".join(table.values())
    assert not re.search(
        r"24/7|3 de la mañana|grafo|determinist|chatbot|no-code|framework|"
        r"self-hosted|open source|sin c[oó]digo",
        blob, re.I), f"{code}: a dictionary says something the page may not"

# The claims the page makes, in the language it is written in.
for phrase in ("from scratch", "import", "without coding"):
    assert phrase in visible, phrase

offers = json.loads(
    re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S).group(1)
)["offers"]

# Prices: the monthly price, the yearly one and the yearly total agree.
cards = re.findall(r'<article class="plan(?: plan--\w+)?">.*?</article>', html, re.S)
assert len(cards) == 4, f"plan cards: {len(cards)}"
assert len(offers) == 3, f"offers: {len(offers)}"
for card, offer, monthly in zip(cards, offers, (9, 39, 79)):
    annual = Decimal(monthly) * Decimal("0.70")
    assert offer["priceCurrency"] == "USD" and offer["price"] == str(monthly)
    assert f'class="price__amount">${monthly}<' in card
    assert f'class="price__amount">${annual:.2f}<' in card
    assert f'${annual * 12:.2f}' in card

# The limits of the three priced plans, in the order the page lists them. The
# quantity is the same everywhere; the thousands mark is a language detail, so
# only the digits are compared.
ROWS = (
    (5, 1, 200, 3000, "50 MB"),
    (50, 5, 1000, 15000, "250 MB"),
    (100, 10, 2000, 30000, "500 MB"),
)


def digits(value):
    return re.sub(r"[.,\s]", "", value)


for card, row in zip(cards, ROWS):
    keys = re.findall(r'data-i18n="(plans\.row-value\.\d+)"', card)
    assert len(keys) == 5, keys
    for key, value in zip(keys, row):
        expected = f"{value:,}" if isinstance(value, int) else value
        shown = re.search(
            r'data-i18n="%s">([^<]*)</dd>' % re.escape(key), card).group(1)
        assert digits(shown) == digits(expected), (key, shown, expected)
        for code, table in strings.items():
            assert digits(table[key]) == digits(expected), (code, key, table[key])

# The fourth plan is quoted, not counted, and sells nothing yet.
assert "plan--wide" in cards[3]
assert "row__value" not in cards[3]
assert "Custom price" in cards[3]
assert "plan__cta" not in visible, "no card sells anything until there is a checkout"
assert "Billed every month" not in visible

print(f"{len(page.keys)} textos y {len(page.attr_keys)} atributos con clave, "
      f"traducidos en {', '.join(f'{c} ({len(t)})' for c, t in strings.items())}: OK")
