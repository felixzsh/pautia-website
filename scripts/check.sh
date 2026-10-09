#!/bin/sh
# Site checks: forbidden words, unfinished markers, anchors, internal files, and
# the language files agreeing with the pages. No linter and no dependency, on
# purpose: the pages are static HTML, a stylesheet and a folder of translations,
# and the build that assembles them is `make build`.
set -eu

cd "$(dirname "$0")/.."

fail() {
  printf 'FAIL %s\n' "$1" >&2
  exit 1
}

# 1. Words that must never reach a customer's screen. Only words that are safe
#    to name here: this list is public, so it cannot carry the name of what runs
#    behind the page. Checked against the source and not only the rendered text,
#    because a comment is where they hide.
if grep -rniE 'chatbot|no-code|framework|runtime|self-hosted|open source|sin c[oó]digo|scope' \
  public/; then
  fail "forbidden word in public/"
fi

# 2. The long dash. In prose it reads as copy written by a machine, and this page
#    is written by hand: a comma between clauses, a middle dot between parts of a
#    title.
if grep -rn '—' public/; then
  fail "em dash in public/"
fi

# 3. Unfinished work. The markers are case sensitive on purpose: "todo" is a
#    Spanish word, and a check that fires on it is a check nobody reads.
if grep -rnI -E '\bTODO\b|\bFIXME\b|\bXXX\b' public/; then
  fail "unfinished marker in public/"
fi

if grep -rniI -E 'lorem ipsum|placeholder' public/; then
  fail "placeholder text in public/"
fi

# 4. Every page the site serves exists, and its anchors and internal links
#    resolve. A same-page "#x" looks in that page; a "/#x" that crosses routes
#    looks in the landing page, where those sections live; and a path maps to a
#    file or to a folder with a page of its own.
index=public/index.html
pages="public/index.html public/pricing.html public/seguridad-whatsapp.html \
  public/campanas-masivas.html"
for page in $pages; do
  [ -f "$page" ] || fail "missing $page"

  ids=$(grep -o 'id="[^"]*"' "$page" | sed 's/id="//; s/"//' | sort -u)
  for anchor in $(grep -o 'href="#[^"]*"' "$page" | sed 's/href="#//; s/"//' | sort -u); do
    printf '%s\n' "$ids" | grep -qx "$anchor" || fail "$page: #$anchor has no element"
  done

  for link in $(grep -o 'href="/[^"]*"' "$page" | sed 's/href="//; s/"//' | sort -u); do
    case "$link" in
      /assets/i18n/*) continue ;;   # a language file, checked by check-content.py
    esac
    target=${link%%#*}
    target=${target%%\?*}
    file="public$target"
    [ ! -d "$file" ] || file="$file/index.html"
    [ -f "$file" ] || file="public$target.html"
    [ -f "$file" ] || fail "$page: $link does not exist"
    case "$link" in
      *\#*)
        fragment=${link#*#}
        grep -q "id=\"$fragment\"" "$file" \
          || fail "$page: $link has no element in $file" ;;
    esac
  done
done

# 4b. The waitlist is one block, on the landing page: a dialog, two ways in, a
#     honeypot and the endpoint. An opener without its dialog is a button that
#     does nothing.
[ "$(grep -c 'data-waitlist-open' "$index")" -eq 2 ] \
  || fail "$index: the waitlist does not open from the header and final section"
grep -q 'id="waitlist"' "$index" || fail "$index: no waitlist dialog"
grep -q 'name="website"' "$index" || fail "$index: no honeypot in the waitlist"
grep -q 'action="/api/waitlist"' "$index" \
  || fail "$index: the waitlist form does not post to the endpoint"
[ -f src/waitlist.js ] || fail "missing src/waitlist.js"

# 5. Every language the pages list is a file that is there, and the other way
#    round: a translation nobody offers, or one the page never loads, is a file
#    that will rot.
listed=$(sed -n '/<script type="application\/json" id="languages">/,/<\/script>/p' "$index" \
  | grep -o '"file": *"[^"]*"' | sed 's/.*"\([^"]*\)"$/\1/' | sort)
on_disk=$(ls public/assets/i18n | sort)
[ "$listed" = "$on_disk" ] || fail "language files and the list in $index differ"

printf '%s: %s sections, %s h1, %s plan cards, ' "$index" \
  "$(grep -c '<section' "$index")" "$(grep -c '<h1' "$index")" \
  "$(grep -c '<article class="plan' "$index")"
printf '%s languages\n' "$(grep -c '"code"' "$index")"

printf '%s: %s sections, %s h1, %s plan cards\n' public/pricing.html \
  "$(grep -c '<section' public/pricing.html)" "$(grep -c '<h1' public/pricing.html)" \
  "$(grep -c '<article class="plan' public/pricing.html)"

printf 'OK\n'
