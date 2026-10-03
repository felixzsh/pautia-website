#!/bin/sh
# Landing checks: forbidden words, unfinished markers, anchors, internal files,
# and the language files agreeing with the page. No linter and no dependency, on
# purpose: the page is one file, a stylesheet and a folder of translations, so a
# build would cost more than it catches.
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

# 4. The page exists, and its anchors and internal links resolve.
page=public/index.html
[ -f "$page" ] || fail "missing $page"

ids=$(grep -o 'id="[^"]*"' "$page" | sed 's/id="//; s/"//' | sort -u)
for anchor in $(grep -o 'href="#[^"]*"' "$page" | sed 's/href="#//; s/"//' | sort -u); do
  printf '%s\n' "$ids" | grep -qx "$anchor" || fail "$page: #$anchor has no element"
done

for link in $(grep -o 'href="/[^"]*"' "$page" | sed 's/href="//; s/"//' | sort -u); do
  case "$link" in
    /assets/i18n/*) continue ;;   # a language file, checked by check-content.py
  esac
  [ -e "public$link" ] || fail "$page: $link does not exist"
done

# 4b. The waitlist is one block: a dialog, three ways in, a honeypot and the
#     endpoint. An opener without its dialog is a button that does nothing.
[ "$(grep -c 'data-waitlist-open' "$page")" -eq 3 ] \
  || fail "$page: the waitlist does not open from three places"
grep -q 'id="waitlist"' "$page" || fail "$page: no waitlist dialog"
grep -q 'name="website"' "$page" || fail "$page: no honeypot in the waitlist"
grep -q 'action="/api/waitlist"' "$page" \
  || fail "$page: the waitlist form does not post to the endpoint"
[ -f src/waitlist.js ] || fail "missing src/waitlist.js"

# 5. Every language the page lists is a file that is there, and the other way
#    round: a translation nobody offers, or one the page never loads, is a file
#    that will rot.
listed=$(sed -n '/<script type="application\/json" id="languages">/,/<\/script>/p' "$page" \
  | grep -o '"file": *"[^"]*"' | sed 's/.*"\([^"]*\)"$/\1/' | sort)
on_disk=$(ls public/assets/i18n | sort)
[ "$listed" = "$on_disk" ] || fail "language files and the list in $page differ"

printf '%s: ' "$page"
printf '%s sections, ' "$(grep -c '<section' "$page")"
printf '%s h1, ' "$(grep -c '<h1' "$page")"
printf '%s plan cards, ' "$(grep -c '<article class="plan' "$page")"
printf '%s languages\n' "$(grep -c '"code"' "$page")"

printf 'OK\n'
