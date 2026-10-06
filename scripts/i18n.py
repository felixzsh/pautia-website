"""Write the dictionary of the language the pages are written in.

The site is a few pages, each served as it is written, in one language, and that
language is the copy a visitor without JavaScript reads and a crawler indexes.
The runtime needs it as a dictionary too, so that every language is a file and
none of them is a special case. Rather than keep two copies of the same text in
two places by hand, this writes the file from the pages, together:

    make i18n            # rewrite the dictionary of the default language
    python3 i18n.py --check   # say whether the file is up to date

The shared header and footer are the same text on every page, so a key that
shows up more than once is the same text each time; a key that read two ways is
a mistake and stops the command.

The other languages are written by hand: a translation cannot be generated.
"""

import json
import sys
from html.parser import HTMLParser
from pathlib import Path

PAGES = sorted(Path("public").glob("*.html"))
FOLDER = Path("public/assets/i18n")

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "source", "track", "wbr"}


class Reader(HTMLParser):
    """The text the pages carry for every key they declare.

    Each keyed element contributes its own text, collected when the element
    closes, so an element split into pieces still reads as one string and a key
    reused across pages (the shared header, a repeated label) does not pile up.
    """

    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.open = []          # [key or None, [text pieces]] per open element
        self.words = {}         # key -> [the text each element holds]
        self.attrs = {}         # key -> the attribute value the page shows

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        key = attrs.get("data-i18n")
        for pair in attrs.get("data-i18n-attrs", "").split(","):
            if pair:
                attr, name = pair.split(":")
                self.attrs[name] = " ".join(attrs.get(attr, "").split())
        if tag in VOID:
            return
        self.open.append([key, []])

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if not self.open:
            return
        key, pieces = self.open.pop()
        if key:
            self.words.setdefault(key, []).append(" ".join("".join(pieces).split()))

    def handle_data(self, data):
        for key, pieces in reversed(self.open):
            if key:
                pieces.append(data)
                break


def extract(html):
    """The dictionary one page describes, in the order a reader meets it."""
    reader = Reader(html)
    reader.feed(html)
    strings = {}
    for key, values in reader.words.items():
        unique = list(dict.fromkeys(values))
        strings[key] = unique[0] if unique else ""
    strings.update(reader.attrs)
    return strings


def extract_all(pages=None):
    """Every page's texts, merged. One key, one text, on every page."""
    strings = {}
    for path in (pages if pages is not None else PAGES):
        for key, text in extract(path.read_text()).items():
            if key in strings and strings[key] != text:
                raise ValueError(
                    f"{path}: {key} reads two ways: {strings[key]!r} / {text!r}"
                )
            strings.setdefault(key, text)
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
    strings = extract_all()
    code = page_language(PAGES[0].read_text())
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
