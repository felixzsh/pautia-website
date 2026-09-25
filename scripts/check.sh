#!/bin/sh
# Landing checks: forbidden words, unfinished markers, anchors, internal files,
# and the two language pages drifting apart. No linter and no dependency, on
# purpose: the page is three files and a stylesheet, so a build would cost more
# than it catches.
set -eu

cd "$(dirname "$0")/.."

fail() {
  printf 'FAIL %s\n' "$1" >&2
  exit 1
}

# 1. Words that must never reach a customer's screen. Checked against the source
#    and not only the rendered text, because a comment is where they hide.
if grep -rniE \
  'whatsmeow|yaml|chatbot|no-code|framework|runtime|self-hosted|open source|sin c[oó]digo|scope' \
  public/; then
  fail "forbidden word in public/"
fi

# 2. Unfinished work. The markers are case sensitive on purpose: "todo" is a
#    Spanish word, and a check that fires on it is a check nobody reads.
if grep -rnE '\bTODO\b|\bFIXME\b|\bXXX\b' public/; then
  fail "unfinished marker in public/"
fi

if grep -rniE 'lorem ipsum|placeholder' public/; then
  fail "placeholder text in public/"
fi

# 3. Every page exists, and its anchors and internal links resolve.
for page in public/index.html public/en/index.html; do
  [ -f "$page" ] || fail "missing $page"

  ids=$(grep -o 'id="[^"]*"' "$page" | sed 's/id="//; s/"//' | sort -u)
  for anchor in $(grep -o 'href="#[^"]*"' "$page" | sed 's/href="#//; s/"//' | sort -u); do
    printf '%s\n' "$ids" | grep -qx "$anchor" || fail "$page: #$anchor has no element"
  done

  for link in $(grep -o 'href="/[^"]*"' "$page" | sed 's/href="//; s/"//' | sort -u); do
    [ -e "public$link" ] || fail "$page: $link does not exist"
  done
done

# 4. The English page is the Spanish page, not a shorter one.
for page in public/index.html public/en/index.html; do
  printf '%s: ' "$page"
  printf '%s sections, ' "$(grep -c '<section' "$page")"
  printf '%s h1, ' "$(grep -c '<h1' "$page")"
  printf '%s plan cards\n' "$(grep -c '<article class="plan' "$page")"
done

es_sections=$(grep -c '<section' public/index.html)
en_sections=$(grep -c '<section' public/en/index.html)
es_cards=$(grep -c '<article class="plan' public/index.html)
en_cards=$(grep -c '<article class="plan' public/en/index.html)
[ "$es_sections" = "$en_sections" ] || fail "section count differs between languages"
[ "$es_cards" = "$en_cards" ] || fail "plan card count differs between languages"

printf 'OK\n'
