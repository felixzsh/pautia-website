# Pautia website

The public website of Pautia: the landing page, the pricing route and the legal
pages.

The pages live in `site/`, where a page is a document that includes the shared
header, footer and plan cards, so those are written once. `make build` (Eleventy)
writes them to `public/`, which is what gets served and deployed; that output is
committed, the same way the dictionary of the page's own language is. The whole
interactive surface is two radio buttons, two `<details>` elements, a language
picker, and an inline journey that joins the waitlist.

## Website versus product application

This repository currently implements the public website, not the authenticated
product. Pautia owns its future application experience: dashboard, onboarding,
conversation views, and flow authoring. Login should open that application, not
hand the client to a third-party operator interface.

Application sessions and authorization belong to the product backend. Browsers
must not receive infrastructure administrator or integration credentials. The
static landing does not become an application merely because product screens
are planned; application repository location and stack remain TBD.

Commercial limits, counting periods, and enforcement guarantees are also TBD.
Published plan numbers do not prove implementation; verify the promises before
opening sales. This documentation change does not alter public copy or pricing.

Implementation details and private product decisions stay outside this public
repository. No runtime integration or dashboard is implemented by these pages.

```
make install         # npm install, the build tool (Eleventy)
make build           # write site/ to public/, and commit the output
make serve           # build, then http://127.0.0.1:8080 with /pricing working
make edge            # the same, behind the Worker that translates at the edge
make check           # output committed, links, translations, copy, USD pricing
make check-browser   # playwright: console, overflow, switch, keyboard, language
make i18n            # rewrite the dictionary of the default language
make default-lang lang=en   # write the site in another language
make og              # redraw the social card after a brand change
make test-waitlist email=tu@correo.com   # the real Brevo sign-up, four cases
```

`make check-browser` is a developer tool and needs playwright and a running
server. The page itself needs neither. Open it with `make serve`, never by
double-clicking `index.html`: the asset paths are absolute, exactly as they are
in production. Edit the pages in `site/`, never the generated `public/*.html`:
`make check` fails when the two have drifted.

The copy is the product. Change a claim, a price or a plan, and `make check` has
to stay green.

## Routes and shared pieces

Two routes are built today: `/` is the landing page, and `/pricing` is the full
plan table. The header, the footer, the icon set, the plan cards and the builder
are `site/_includes/*.njk`; a page pulls them in with `{% include %}`. The landing
page keeps the three priced plans and links to `/pricing`, where the Enterprise
card and the plan builder live, so the landing page stays short.

`public/index.html` and `public/pricing.html` are the build's output and are
committed: a deploy needs no build, and `make check` fails if they no longer
match `site/`. A new route is a template in `site/`, plus an entry in
`TRANSLATED` in `src/worker.js` and in `run_worker_first` in `wrangler.jsonc` if
the edge should hand it over in the visitor's language too.

## How it is served

`pautia.app` is a Worker with the site as static assets (`wrangler.jsonc`): the
pages are the built files, and a hundred lines of `src/worker.js` stand in front
of the translated pages (`/` and `/pricing`) to hand them over in the language
and the money the visit asks for. Everything else — the stylesheet, the
dictionaries, the legal pages — is served straight from the assets and never
reaches that code.

The language follows the cookie the visitor set, then the browser's
`Accept-Language`, then English when the browser asked for none of the six;
crawlers always get the page's own Spanish, which is what gets indexed. The
country only picks the money.

`make serve` serves the files as they are, which is what localhost should be:
Spanish and dollars. `make edge` runs the same thing behind the Worker, so the
translation and the country can be exercised before pushing.

One path is not a file: `POST /api/waitlist`, which the dialog calls and
`src/waitlist.js` answers. It is the only piece that knows the mailing list, and
the only reason the page has a backend at all.

## The waitlist

The three calls to action (header, hero, closing band) open a four-step journey
in the final section: three questions and an address. Answers are native radio
cards, with Other revealing a text input capped at 100 characters. Back keeps
answers; a failed submission can be retried without starting over. The buttons
keep a `mailto:` href, so a visitor without
JavaScript still has a way in, and one whose request fails is told so instead of
being left guessing.

```
journey →  POST /api/waitlist  →  Brevo:
                                   a contact with the three answers as attributes
                                   a confirmation email to the visitor
```

Brevo is both the store and the sender, so this project keeps no database of its
own: the list is exported from Brevo. The `from` is `info@pautia.app`, which
forwards to a person through Cloudflare Email Routing, so a reply is read even
though the Worker sends. The confirmation is transactional mail, of which 300 a
day are free.

Two environment variables, in `.env` for local work and as secrets on the Worker
in production: `BREVO_API_KEY` and `BREVO_LIST_ID`. Both are Worker secrets,
including the list ID, so Wrangler preserves them across Git deployments.
Do not configure them only as build variables or plain-text dashboard variables:
the former are not available at runtime and the latter can be replaced on deploy.
Never commit `.env` or the API key. Rotating the key also requires updating the
Worker secret; changing the local `.env` alone does not update production.
The three attributes the
answers are stored in (`RUBRO`, `OBJETIVO`, `ATENCION_ACTUAL`) have to exist in
the Brevo account first, letter for letter: an attribute the account does not
have would take the whole contact down with it, so the endpoint keeps the address
and drops the answers if Brevo refuses them. A honeypot field no person can see
stops the bots that fill in everything; a real flood is a Cloudflare rule in
front of the route.

`make test-waitlist email=tu@correo.com` calls the endpoint itself, with the same
secrets, and checks four cases: a wrong method, an address that is not one, the
honeypot, and a real sign-up. It creates one contact in Brevo and sends one real
email, so the address stays in the list until it is deleted.

## Languages

One site, one URL per page, every text translated in place. The pages are written
in one language, and that language is the default, because the default is not a
setting: it is the templates, so a visitor without JavaScript reads it and a
crawler indexes it, with no fetch and no flash of the wrong language. Today the
site is written in Spanish. Every other language is a file in
`public/assets/i18n/`, and the picker in the header swaps the text of the page
the visitor is already reading: no navigation, no reload, and the price switch
and the open answers stay as they were. Today the picker offers English, French,
German, Italian and Portuguese.

What the visitor picks — the language and the money — is remembered in a single
cookie, because that is the one store the edge can read: the page arrives already
in that language and money, and clearing your cookies really does forget it.

**The four extra languages are for reading the page, not for talking to us.**
Pautia is sold and supported in Spanish and English only, and that is the rule
every piece of contact follows: the confirmation email is written in those two
(Spanish for the page's own language, English for everything else), the options
of the waitlist are stored as they were labelled, and whoever answers the mailbox
behind the form answers in those two. A visitor who reads the page in Portuguese,
French, German or Italian is being helped to understand it and nothing more. A
new language is worth adding when a market is worth opening, never because the
picker looks better with it.

`make i18n` writes the dictionary of the default language from the built pages
together, the same way `og.png` is drawn by `make og`, so the two copies of the
same text cannot drift: change the Spanish in `site/`, run `make build`, run
`make i18n`, and `make check` fails until you do. The other languages are written
by hand, because a translation cannot be generated.

**To write the site in another language:** `make default-lang lang=en`. One
command, because it is not a flag: the default language is every keyed text
sitting in the templates, and that is exactly what the command moves between the
dictionaries, together with `<html lang>`, the structured data and the order of
the list in the head. It regenerates and checks afterwards, and running it with
the language the site already has changes nothing.

**To add a language:** write `public/assets/i18n/<code>.json` with the same keys
as the default language's file, add it to the list in the head of every page in
`site/`, and register it in `src/worker.js`, where `SHIPPED` and `DICTIONARIES`
name the languages the edge can hand over before the page runs. A key the new
file leaves out keeps the text already in the markup, so a half-finished
translation degrades instead of breaking, and `make check` tells you which keys
are missing. A language that writes numbers its own way belongs in `NUMBER_STYLE`
in `main.js`, which gives the thousands and decimal separators; a language it
does not name gets the English order.

To translate a new string that appears in a page, give its element a
`data-i18n="<key>"` and add the key to every language file. The element must hold
the text and nothing else: a swap replaces its content, so markup inside a keyed
element would be lost, and `make check` fails if you do it.
