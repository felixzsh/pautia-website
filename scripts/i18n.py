"""Write the dictionary of the language the page is written in.

The page is served as it is written, in one language, and that language is the
copy a visitor without JavaScript reads and a crawler indexes. The runtime needs
it as a dictionary too, so that every language is a file and none of them is a
special case. Rather than keep two copies of the same text in two places by
hand, this writes the file from the page:

    make i18n            # rewrite public/assets/i18n/en.json
    python3 i18n.py --check   # say whether the file is up to date

The other languages are written by hand: a translation cannot be generated.
"""

import json
import sys
from html.parser import HTMLParser
from pathlib import Path

PAGE = Path("public/index.html")
FOLDER = Path("public/assets/i18n")

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "source", "track", "wbr"}


class Reader(HTMLParser):
    """The text the page carries for every key it declares."""

    def __init__(self, html):
        super().__init__(convert_charrefs=False)
        self.open = []          # [key or None] for every element left open
        self.words = {}         # key -> [text pieces]
        self.attrs = {}         # key -> the attribute value the page shows

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        key = attrs.get("data-i18n")
        if key:
            self.words.setdefault(key, [])
        for pair in attrs.get("data-i18n-attrs", "").split(","):
            if pair:
                attr, name = pair.split(":")
                self.attrs[name] = " ".join(attrs.get(attr, "").split())
        if tag in VOID:
            return
        self.open.append(key)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if self.open:
            self.open.pop()

    def handle_data(self, data):
        if self.open and self.open[-1] and data.strip():
            self.words[self.open[-1]].append(data)


def extract(html):
    """The dictionary the page describes, in the order a reader meets it."""
    reader = Reader(html)
    reader.feed(html)
    strings = {key: " ".join(" ".join(pieces).split())
               for key, pieces in reader.words.items()}
    strings.update(reader.attrs)
    return strings


def written(strings):
    """The file, byte for byte, so a check can compare without parsing."""
    return json.dumps(strings, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def page_language(html):
    """The first language of the list in the head: the one the page is in."""
    import re
    block = re.search(
        r'<script type="application/json" id="languages">(.*?)</script>', html, re.S
    ).group(1)
    return json.loads(block)[0]["code"]


def main(argv):
    html = PAGE.read_text()
    strings = extract(html)
    code = page_language(html)
    path = FOLDER / f"{code}.json"
    content = written(strings)

    if "--check" in argv:
        if not path.exists():
            print(f"missing {path}: run make i18n", file=sys.stderr)
            return 1
        if path.read_text() != content:
            print(f"{path} is out of date: run make i18n", file=sys.stderr)
            return 1
        print(f"{path} is up to date ({len(strings)} keys)")
        return 0

    path.write_text(content)
    print(f"{path}: {len(strings)} keys")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
