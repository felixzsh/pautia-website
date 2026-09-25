# Pautia website

The public face of the product: landing page, signup, and login. Its login hands
the browser a scoped session on the platform, and lets the platform show the
dashboard.

The landing page is built. `LANDING.md` is its plan, and the page follows it:
the structure, the copy, the three plans, and the claims each block is allowed
to make. Read that before changing anything a customer sees.

## The landing page

Static files under `public/`, with no build step, no dependencies and no
framework. The whole interactive surface is two radio buttons, two `<details>`
elements and one short language redirect.

```
make serve           # http://127.0.0.1:8080, Spanish; /en/ for English
make check           # greps: forbidden words, markers, links, language drift
make check-browser   # playwright: console, overflow, switch, keyboard
make og              # redraw the social card after a brand change
```

`make check-browser` is a developer tool and needs playwright and a running
server. The page itself needs neither.

Three rules the page is built on, and the reason it is not a mockup:

- **No claim without a counter behind it.** Every promise the page makes is
  listed in `LANDING.md` under `Claims guardrail` with the phase that has to
  deliver it. A claim that needs a phase nobody has finished is in the source
  as a comment, not in the rendered page.
- **No fabricated proof.** No invented statistics, no testimonials, no customer
  logos, and a brand-independent page: this repository may mention the platform, and
  nothing a customer reads does.
- **The way in is honest.** There is no account service yet, so there is no
  login form. Every call to action is one link to the waitlist. When signup
  exists, that link becomes the form.

Open with a server, never by double-clicking `index.html`: the asset paths are
absolute, exactly as they are in production.

## Scope

- Landing page and pricing.
- Signup, and login with the second factor the backend offers.
- The redirect: the browser leaves here and lands on the scoped the platform
  dashboard. We never proxy it.
- Plan and billing page: read-only, for the client's own account.
- Rescue page: the instructions a pending-passkey notification links to.

## Not here, ever

- **No dashboard.** No bot list, no chats, no sessions, no live view: all of that
  is the platform's dashboard, shown under our token. If a screen shows bot or
  conversation state, it does not belong in this repository.
- No issuer key, no client secrets: only the backend holds those.
- No calls to the platform's admin surface from the browser.

## Boundary

This repository may mention the platform. the platform never knows about it.

## Depends on

The backend (`the backend repository`) for accounts, plans, and the token handoff. If a
screen needs data, the backend provides it; this repository only renders.

## Spikes

None of its own. Its only unknown is the login redirect, and that is measured in
the contract spike owned by `the backend repository/spikes`.

## Status

The landing page is built and verified locally. Nothing is deployed: no domain,
no DNS, and the legal pages are `noindex` shells.
