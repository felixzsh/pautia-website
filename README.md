# Pautia website

The public website of Pautia: the landing page, in Spanish and English, and the
legal pages.

Static files under `public/`, served as they are written. No build step, no
dependencies, no framework. The whole interactive surface is two radio buttons,
two `<details>` elements and one short language redirect.

```
make serve           # http://127.0.0.1:8080, Spanish; /en/ for English
make check           # links, language drift, copy and USD pricing consistency
make check-browser   # playwright: console, overflow, switch, keyboard
make og              # redraw the social card after a brand change
```

`make check-browser` is a developer tool and needs playwright and a running
server. The page itself needs neither. Open it with a server, never by
double-clicking `index.html`: the asset paths are absolute, exactly as they are
in production.

The copy is the product. Change a claim, a price or a plan, and `make check` has
to stay green.
