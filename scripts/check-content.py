"""Check bilingual pricing and the customer-facing pitch without dependencies."""

import json
import re
from decimal import Decimal
from html.parser import HTMLParser
from pathlib import Path


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_json = False
        self.json = ""

    def handle_starttag(self, tag, attrs):
        if tag == "script" and dict(attrs).get("type") == "application/ld+json":
            self.in_json = True

    def handle_data(self, data):
        if self.in_json:
            self.json += data

    def handle_endtag(self, tag):
        if tag == "script":
            self.in_json = False


for filename, phrases, thousands in (
    ("public/index.html", ("desde cero", "importar", "sin programar"), "."),
    ("public/en/index.html", ("from scratch", "import", "without coding"), ","),
):
    html = Path(filename).read_text()
    page = Page()
    page.feed(html)
    offers = json.loads(page.json)["offers"]
    cards = re.findall(r'<article class="plan(?: plan--\w+)?">.*?</article>', html, re.S)
    assert len(cards) == 4 and len(offers) == 3, filename
    assert html.count('<li class="step">') == 3, filename
    visible = re.sub(r"<!--.*?-->", "", html, flags=re.S)
    assert all(phrase in visible for phrase in phrases), filename
    assert not re.search(
        r"24/7|3 de la mañana|3 in the morning|grafo|graph|determinist",
        visible,
        re.I,
    ), filename

    for card, offer, monthly in zip(cards, offers, (9, 39, 79)):
        annual = Decimal(monthly) * Decimal("0.70")
        assert offer["priceCurrency"] == "USD" and offer["price"] == str(monthly)
        assert f'class="price__amount">${monthly}<' in card
        assert f'class="price__amount">${annual:.2f}<' in card
        assert f'${annual * 12:.2f}' in card

    # Declared agents, concurrent agents, declared actions, outgoing messages and
    # message storage, in that order. The last plan is quoted, not counted.
    def group(value):
        return f"{value:,}".replace(",", thousands) if isinstance(value, int) else value

    limits = [[group(n) for n in row] for row in (
        (5, 1, 200, 3000, "50 MB"),
        (50, 5, 1000, 15000, "250 MB"),
        (100, 10, 2000, 30000, "500 MB"),
    )]
    for card, expected in zip(cards, limits):
        values = re.findall(r'<dd class="row__value">([^<]*)</dd>', card)
        assert values == expected, (filename, values, expected)

    # The custom-priced plan sits under the three priced ones and inherits them,
    # so it repeats no limit.
    assert 'plan--wide' in cards[3], filename
    assert "row__value" not in cards[3], filename
    assert cards[3].count("Custom price") == 2, filename  # one per billing period

    # No card sells anything yet: the header carries the waitlist, and the buy
    # button waits in a comment until there is a checkout to point it at.
    assert "plan__cta" not in visible, filename
    assert visible.count("Se renueva cada mes" if thousands == "." else "Billed every month") == 0, filename

print("Bilingual prices, structured data and pitch: OK")
