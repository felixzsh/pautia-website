"""Check the language machinery: key parity, the plan table, prices, the claims
guardrail, and the pitch. No dependencies, on purpose.

The page is written in the first language of its list and every other language is
a JSON file, so what has to hold is: every key in the page exists in each
dictionary, no dictionary carries a key the page does not use, and the two
languages never drift apart on the numbers.
"""

import json
import re
import sys
from decimal import Decimal
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import i18n

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
html = PAGE.read_text()
page.feed(html)
languages = json.loads(page.json["languages"])

# The first language is the one the page is written in, and its dictionary is
# written from the page by scripts/i18n.py, so the two cannot drift.
source = i18n.page_language(html)
assert languages[0]["code"] == source, "the list and the page disagree on the language"
generated = i18n.written(i18n.extract(html))
own = I18N / languages[0]["file"]
assert own.exists(), f"missing {own}: run make i18n"
assert own.read_text() == generated, f"{own} is out of date: run make i18n"

strings = {}
for lang in languages:
    path = I18N / lang["file"]
    assert path.exists(), f"{lang['code']}: {path} is listed but missing"
    strings[lang["code"]] = json.loads(path.read_text())

# Every file in the folder is a language the page offers, and the other way round.
on_disk = {p.name for p in I18N.glob("*.json")}
listed = {lang["file"] for lang in languages}
assert on_disk == listed, f"language files and list differ: {on_disk ^ listed}"

visible = re.sub(r"<!--.*?-->", "", html, flags=re.S)
keys = set(page.keys) | {key for _, key in page.attr_keys}

for code, table in strings.items():
    missing = sorted(keys - set(table))
    assert not missing, f"{code}: {len(missing)} keys the page uses and it lacks: {missing[:5]}"
    orphans = sorted(set(table) - keys)
    assert not orphans, f"{code}: {len(orphans)} keys the page never reads: {orphans[:5]}"

# A phrase in two or more words that reads the same in both languages is prose
# nobody translated. Numbers, units and single words like "Legal" are allowed to
# be the same: they belong to both languages.
english = strings[languages[0]["code"]]
for code, table in strings.items():
    if code == languages[0]["code"]:
        continue
    untranslated = sorted(
        key for key, value in table.items()
        if value == english[key] and len(re.findall(r"[A-Za-z]+", value)) >= 2
    )
    assert not untranslated, \
        f"{code}: prose that never changed language: {untranslated[:5]}"

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

# The claims a customer has to read, in every language that carries them. Checked
# in the dictionaries and not in the markup, because either of them can be the
# one the page is written in.
CLAIMS = {
    "es": ("desde cero", "import", "sin programar"),
    "en": ("from scratch", "import", "without coding"),
}
for code, table in strings.items():
    if code not in CLAIMS:
        continue
    blob = " ".join(table.values()).lower()
    for phrase in CLAIMS[code]:
        assert phrase in blob, f"{code}: the page stopped claiming {phrase!r}"

offers = json.loads(
    re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S).group(1)
)["offers"]

# Prices: the monthly price, the yearly one and the yearly total agree.
cards = re.findall(r'<article class="plan(?: plan--\w+)?">.*?</article>', html, re.S)
assert len(cards) == 4, f"plan cards: {len(cards)}"
assert len(offers) == 3, f"offers: {len(offers)}"
for card, offer, monthly in zip(cards, offers, (9, 39, 69)):
    annual = Decimal(monthly) * Decimal("0.80")
    assert offer["priceCurrency"] == "USD" and offer["price"] == str(monthly)
    # The annual price shows the monthly one it discounts, crossed out above it,
    # so the saving is visible without a sentence explaining it.
    assert f'class="price__was" data-money data-usd="{monthly}">${monthly}<' in card
    assert f'data-money data-usd="{monthly}">${monthly}<' in card
    assert f'data-money data-usd="{annual:.2f}">${annual:.2f}<' in card

# Every figure carries the dollars it starts from, and the number it shows is
# that same figure: a conversion that drifted from what was written would price
# the page twice.
for base, shown in re.findall(r'data-money data-usd="([\d.]+)"[^>]*>([^<]*)<', html):
    token = re.search(r"[\d.]+", shown)
    assert token and token.group(0) == base, (base, shown)

# The limits of the three priced plans, in the order the page lists them:
# active agents first, because that is the question a customer asks first.
# Every language has to sell the same quantity; the thousands mark is a language
# detail, so only the digits are compared.
ROWS = (
    (1, 5, 200, 3000, "50 MB"),
    (5, 50, 1000, 15000, "250 MB"),
    (10, 100, 2000, 30000, "500 MB"),
)


def digits(value):
    return re.sub(r"[.,\s]", "", value)


for card, row in zip(cards, ROWS):
    keys = re.findall(r'data-i18n="(plans\.row-value\.\d+)"', card)
    assert len(keys) == 5, keys
    for key, value in zip(keys, row):
        expected = f"{value:,}" if isinstance(value, int) else value
        for code, table in strings.items():
            assert digits(table[key]) == digits(expected), \
                (code, key, table[key], expected)

# The fourth plan is quoted, not counted, and sells nothing yet.
assert "plan--wide" in cards[3]
assert "row__value" not in cards[3]
# The quoted plan says its price in the language the page is written in.
assert strings[languages[0]["code"]]["plans.price-amount.0"] in cards[3]
assert "plan__cta" not in visible, "no card sells anything until there is a checkout"
renewal = ("Se renueva cada mes", "Billed every month")
assert not any(phrase in visible for phrase in renewal), \
    "a monthly note that says what the switch already says"

print(f"{len(page.keys)} textos y {len(page.attr_keys)} atributos con clave, "
      f"traducidos en {', '.join(f'{c} ({len(t)})' for c, t in strings.items())}: OK")
