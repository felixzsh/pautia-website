# Pautia website

The public website of Pautia: the landing page and the legal pages.

Static files under `public/`, served as they are written. No build step, no
dependencies, no framework. The whole interactive surface is two radio buttons,
two `<details>` elements and a language picker.

```
make serve           # http://127.0.0.1:8080, the files as they are
make edge            # the same, behind the Worker that translates at the edge
make check           # links, translations, copy and USD pricing consistency
make check-browser   # playwright: console, overflow, switch, keyboard, language
make i18n            # rewrite the dictionary of the default language
make default-lang lang=en   # write the page in another language
make og              # redraw the social card after a brand change
```

`make check-browser` is a developer tool and needs playwright and a running
server. The page itself needs neither. Open it with a server, never by
double-clicking `index.html`: the asset paths are absolute, exactly as they are
in production.

The copy is the product. Change a claim, a price or a plan, and `make check` has
to stay green.

## How it is served

`pautia.app` is a Worker with the site as static assets (`wrangler.jsonc`): the
pages are these files, unchanged, and a hundred lines of `src/worker.js` stand in
front of the landing page to hand it over in the language and the money the visit
asks for. Everything else — the stylesheet, the dictionaries, the legal pages —
is served straight from the assets and never reaches that code.

The language follows the cookie the visitor set, then the browser's
`Accept-Language`, then English when the browser asked for none of the seven;
crawlers always get the page's own Spanish, which is what gets indexed. The
country only picks the money.

`make serve` serves the files as they are, which is what localhost should be:
Spanish and dollars. `make edge` runs the same thing behind the Worker, so the
translation and the country can be exercised before pushing.

## Languages

One page, one URL, every text translated in place. The page is written in one
language, and that language is the default, because the default is not a setting:
it is the markup, so a visitor without JavaScript reads it and a crawler indexes
it, with no fetch and no flash of the wrong language. Today the page is written in
Spanish. Every other language is a file in `public/assets/i18n/`, and the picker
in the header swaps the text of the page the visitor is already reading: no
navigation, no reload, and the price switch and the open answers stay as they
were. Today the picker offers English, French, German, Hindi, Italian and
Portuguese.

What the visitor picks — the language and the money — is remembered in a single
cookie, because that is the one store the edge can read: the page arrives already
in that language and money, and clearing your cookies really does forget it.

`make i18n` writes the dictionary of the default language from the page itself,
the same way `og.png` is drawn by `make og`, so the two copies of the same text
cannot drift: change the Spanish in `index.html`, run `make i18n`, and
`make check` fails until you do. The other languages are written by hand, because
a translation cannot be generated.

**To write the page in another language:** `make default-lang lang=en`. One
command, because it is not a flag: the default language is every keyed text
sitting in the markup, and that is exactly what the command moves between the
dictionaries, together with `<html lang>`, the structured data and the order of
the list in the head. It regenerates and checks afterwards, and running it with
the language the page already has changes nothing.

**To add a language:** write `public/assets/i18n/<code>.json` with the same keys
as the default language's file, add it to the list in the head of `index.html`,
and register it in `src/worker.js`, where `SHIPPED` and `DICTIONARIES` name the
languages the edge can hand over before the page runs. A key the new file leaves
out keeps the text already in the markup, so a half-finished translation
degrades instead of breaking, and `make check` tells you which keys are missing.
A language that writes numbers its own way belongs in `NUMBER_STYLE` in
`main.js`, which gives the thousands and decimal separators; a language it does
not name gets the English order.

To translate a new string that appears in the page, give its element a
`data-i18n="<key>"` and add the key to every language file. The element must hold
the text and nothing else: a swap replaces its content, so markup inside a keyed
element would be lost, and `make check` fails if you do it.
