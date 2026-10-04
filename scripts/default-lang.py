"""Put the site in another language, and make that language its default.

The pages are written in one language and that language lives in the markup, so
the default is not a setting: it is what the templates say. Changing it means
moving every text between the templates and the dictionaries and turning the
roles of the files around. Done by hand that is careful editing across the pages
and their shared pieces, so it is a command:

    make default-lang lang=en
    python3 scripts/default-lang.py es

It rewrites the templates in site/ with the texts of that language, writes the
language the site had to its own file (it stops being the generated one), puts
the new default first in the list in the head, and fixes what the markup says
about itself: <html lang>, and the structured data, which quotes the language it
is served in. The command builds and regenerates afterwards, so `make
default-lang` does that itself.

The result is checked against the target dictionary on the way out: every text
must land exactly where it was, or the command fails instead of publishing a
half-translated site.
"""

import json
import re
import sys
import textwrap
from html.parser import HTMLParser
from pathlib import Path

import i18n

SITE = Path("site")
SOURCES = sorted(SITE.rglob("*.njk"))
INDEX = SITE / "index.njk"
I18N = Path("public/assets/i18n")
PLAN_NAMES = ("plans.plan-name.0", "plans.plan-name.1", "plans.plan-name.2")


class Position(HTMLParser):
    """Where the text of every key sits in the source."""

    def __init__(self, src):
        super().__init__(convert_charrefs=False)
        self.src = src
        self.starts = [0]
        for i, ch in enumerate(src):
            if ch == "\n":
                self.starts.append(i + 1)
        self.values = []      # (key, start, end, raw)

    def here(self):
        line, col = self.getpos()
        return self.starts[line - 1] + col

    def tag_end(self, start):
        quote, i = None, start
        while i < len(self.src):
            ch = self.src[i]
            if quote:
                if ch == quote:
                    quote = None
            elif ch in "\"'":
                quote = ch
            elif ch == ">":
                return i
            i += 1
        raise ValueError("unterminated tag")

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        start = self.here()
        end = self.tag_end(start)
        if attrs.get("data-i18n"):
            stop = self.src.index("<", end + 1)
            self.values.append((attrs["data-i18n"], end + 1, stop,
                                self.src[end + 1:stop]))
        for pair in attrs.get("data-i18n-attrs", "").split(","):
            if not pair:
                continue
            attr, key = pair.split(":")
            match = re.search(re.escape(attr) + r'="', self.src[start:end + 1])
            assert match, (key, attr)
            begin = start + match.end()
            finish = self.src.index('"', begin)
            self.values.append((key, begin, finish, self.src[begin:finish]))

    def handle_startendtag(self, tag, attrs):
        pass


def placed(value, raw):
    """The text, wrapped the way the text it replaces is wrapped."""
    body = " ".join(value.split())
    if "\n" not in raw:
        return body
    lines = raw.split("\n")
    indent = re.match(r"[ \t]*", lines[1]).group(0)
    closing = re.search(r"[ \t]*$", lines[-1]).group(0)
    wrapped = textwrap.wrap(body, width=max(40, 92 - len(indent)),
                            break_long_words=False, break_on_hyphens=False)
    prefix, first = ("\n", indent) if raw.startswith("\n") else ("", "")
    parts = [prefix + first + wrapped[0]] + [indent + w for w in wrapped[1:]]
    return "\n".join(parts) + closing


def swap(src, table):
    parser = Position(src)
    parser.feed(src)
    edits = []
    for key, start, end, raw in parser.values:
        assert key in table, key
        edits.append((start, end, placed(table[key], raw)))
    out = src
    for start, end, value in sorted(edits, reverse=True):
        out = out[:start] + value + out[end:]
    return out, len(edits)


def head(src, code, table):
    """What the markup says about its own language, outside the keys."""
    out = re.sub(r'<html lang="[a-z]+"', f'<html lang="{code}"', src, count=1)

    match = re.search(r'(<script type="application/ld\+json">\n)(.*?)(\n\s*</script>)',
                      out, re.S)
    if not match:
        return out
    schema = json.loads(match.group(2))
    schema["inLanguage"] = code
    schema["description"] = table["meta.description"]
    for offer, key in zip(schema["offers"], PLAN_NAMES):
        offer["name"] = table[key]
        offer.pop("description", None)      # the page already says they are proposals
    body = json.dumps(schema, ensure_ascii=False, indent=2)
    body = "\n".join("  " + line for line in body.split("\n"))
    return out[:match.start(2)] + body + out[match.end(2):]


def reorder(src, code, listing):
    block = re.search(r'(<script type="application/json" id="languages">\n)(.*?)(\n\s*</script>)',
                      src, re.S)
    if not block:
        return src
    ordered = [lang for lang in listing if lang["code"] == code]
    ordered += [lang for lang in listing if lang["code"] != code]
    lines = ",\n".join("      " + json.dumps(lang, ensure_ascii=False)
                       for lang in ordered)
    body = "    [\n" + lines + "\n    ]"
    return src[:block.start(2)] + body + src[block.end(2):]


def main(argv):
    current_values = i18n.extract_all()
    src = INDEX.read_text()
    match = re.search(r'(<script type="application/json" id="languages">\n)(.*?)(\n\s*</script>)',
                      src, re.S)
    listing = json.loads(match.group(2))
    by_code = {lang["code"]: lang for lang in listing}

    if not argv:
        print("usage: default-lang.py <code> — one of: " + ", ".join(by_code))
        return 2
    wanted = argv[0]
    if wanted not in by_code:
        print(f"unknown language: {wanted}", file=sys.stderr)
        return 1
    if wanted == listing[0]["code"]:
        print(f"the site is already written in {wanted}")
        return 0

    target = json.loads((I18N / by_code[wanted]["file"]).read_text())
    assert set(target) == set(current_values), sorted(
        set(target) ^ set(current_values))[:5]

    count = 0
    for path in SOURCES:
        out, edits = swap(path.read_text(), target)
        out = head(out, wanted, target)
        out = reorder(out, wanted, listing)
        path.write_text(out)
        count += edits

    # The language the site had becomes a file it reads; the one it takes becomes
    # the file `make i18n` writes from now on.
    (I18N / by_code[listing[0]["code"]]["file"]).write_text(i18n.written(current_values))
    print(f"{len(SOURCES)} templates: {count} texts now in {wanted}, and {wanted} is the default")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
