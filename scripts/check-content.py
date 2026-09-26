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


for filename in ("public/index.html", "public/en/index.html"):
    html = Path(filename).read_text()
    page = Page()
    page.feed(html)
    offers = json.loads(page.json)["offers"]
    cards = re.findall(r'<article class="plan(?: plan--top)?">.*?</article>', html, re.S)
    assert len(cards) == len(offers) == 3, filename
    assert html.count('<li class="step">') == 3, filename
    visible = re.sub(r"<!--.*?-->", "", html, flags=re.S)
    assert not re.search(
        r"24/7|3 de la mañana|3 in the morning|grafo|graph|determinist",
        visible,
        re.I,
    ), filename

    for card, offer, monthly in zip(cards, offers, (39, 99, 249)):
        annual = Decimal(monthly) * Decimal("0.70")
        assert offer["priceCurrency"] == "USD" and offer["price"] == str(monthly)
        assert f'class="price__amount">${monthly}<' in card
        assert f'class="price__amount">${annual:.2f}<' in card
        assert f'${annual * 12:.2f}' in card

print("Bilingual prices, structured data and pitch: OK")
