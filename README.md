# Pautia website

The public website of Pautia: the landing page and the legal pages.

Static files under `public/`, served as they are written. No build step, no
dependencies, no framework. The whole interactive surface is two radio buttons,
two `<details>` elements and a language picker.

```
make serve           # http://127.0.0.1:8080
make check           # links, translations, copy and USD pricing consistency
make check-browser   # playwright: console, overflow, switch, keyboard, language
make og              # redraw the social card after a brand change
```

`make check-browser` is a developer tool and needs playwright and a running
server. The page itself needs neither. Open it with a server, never by
double-clicking `index.html`: the asset paths are absolute, exactly as they are
in production.

The copy is the product. Change a claim, a price or a plan, and `make check` has
to stay green.

## Languages

One page, one URL, every text translated in place. The page is written in the
first language of the list in its head (English), which is also what a visitor
without JavaScript reads. Each other language is one file in
`public/assets/i18n/`, and the picker in the header swaps the text of the page
the visitor is already reading: no navigation, no reload, and the price switch
and the open answers stay as they were.

**To add a language:** write `public/assets/i18n/<code>.json` with the same keys
as `es.json`, and add it to the list in the head of `index.html`. Nothing else.
A key the new file leaves out keeps the English, so a half-finished translation
degrades instead of breaking, and `make check` tells you which keys are missing.

To translate a new string that appears in the page, give its element a
`data-i18n="<key>"` and add the key to every language file. The element must hold
the text and nothing else: a swap replaces its content, so markup inside a keyed
element would be lost, and `make check` fails if you do it.
