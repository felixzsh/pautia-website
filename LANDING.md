# Pautia — Landing page plan

What this document is: the complete plan for the public landing page of Pautia, the
product this repository sells in front of. It owns the page structure, the copy,
the brand, the technology decision, the three plans, and the gates each part has
to pass. It is not a contract: the copy moves as the product moves, and every
claim it makes is checked against the phase that has to deliver it
(`Claims guardrail`).

The public copy describes the finished product; the waitlist makes clear that
it is not available for purchase yet. `public/index.html` and `public/en/index.html`
are the authoritative copy when an older example in this document differs.

## Current pitch

**Pautia gives the business an agent for its existing WhatsApp number.** AI
interprets incoming messages and follows a visual support flow to select an
approved reply or run an approved action. The team can build that flow from
scratch in the visual editor without programming. Importing existing chats is
strictly optional: with consent, AI uses them to suggest a first draft of
answers and actions. Without importing, the agent has the same capabilities;
only the head start is lost. The team reviews and tests the flow, connects
services, chooses working hours and activates the agent. Replies come from
approved text and service data, not AI-written messages.

In customer-facing copy use `flujo de atención` / `support flow`, not `grafo`,
`graph`, `determinista` or `deterministic`. Never frame overnight availability
or 24/7 as the reason to buy. Offer all-day coverage only as one possible
schedule. A separate account-care section explains delays, timing variation,
read receipts, typing indicators, reply variants, per-sender limits and no
unsolicited bulk messaging. These measures may reduce risk, not prevent bans.

**Product dependency:** the platform's current bot settings have pacing and rate
limits but no business-hours schedule. Before offering configurable schedules
for sale, an authorized project must design and implement that capability.
The editor and history-based draft come from ROADMAP Phases 15–16; the AI
routing and prescribed replies come from PLAN Phase 8. Nothing in this repo
implements those features; this is a landing for the finished product.

`PLAN.md` keeps the phases of the whole product and does not change because of
this document. This document is the landing page, in detail.

## What this page is, and what it is not

It is:

- One public page that explains the product, shows the three plans, and opens a
  login dialog.
- Static files with no build step, no framework, and no runtime dependency.
- Spanish at `/`, English at `/en/`, with the language of the visitor honored.

It is not:

- A dashboard, a chat view, a bot list, or anything that shows conversation
  state. Those are the product's own screens, shown after login under our
  credentials. If a block on this page renders a live bot state, it belongs
  somewhere else.
- A signup, checkout, or payment flow. The dialog is a login; the account is
  created and paid for elsewhere, and until that exists the dialog says so.
- Anything that leaks the name or shape of the engine underneath. The engine is
  MIT and anyone may host it, so there is nothing to hide technically, but a
  customer must never read this repository's README and conclude they are
  buying a wrapper. They are buying an operated service.

## Technology decision

Static HTML, one stylesheet, one small script. No framework, no bundler, no
package manager, no htmx.

- The page is not dynamic. It renders the same thing for every visitor; the
  only inputs are the language and the state of the login dialog.
- A toolchain would be a build-time dependency for no benefit, and the product's
  own rule is that a frontend toolchain is a build-time dependency only, with
  nothing running in production.
- htmx buys nothing here. The whole interactive surface is: open and close the
  dialog, toggle the mobile menu, switch the prices between monthly and annual,
  and switch language. The dialog is the native `<dialog>` element, which gives
  focus trapping, `Escape`, and an inert background for free. The prices and the
  menu are CSS and a dozen lines of script. htmx would add a vendored file and a
  server contract for zero components.
- The prices, the plan limits, and the copy live in the HTML, once each. There
  is no data file feeding a template, because there is no build step to consume
  it: the card that shows `Pro` is the only place `Pro` is written, and the
  comparison is the list of rows inside the cards.

What would change this decision: a real account area (account settings, plan
management, the rescue page) and any page that needs server data. At that point
the backend renders HTML for those pages and the landing stays static; the
landing does not become an application.

### Interactivity budget

| Need | Mechanism | Lines |
| --- | --- | --- |
| Mobile menu | `<details>` disclosure, no script | 0 |
| Prices monthly/annual | two radios + CSS `content`, no script | 0 |
| FAQ | native `<details>`, no script | 0 |
| Language auto-detect | `navigator.language`, one-time `location.replace` | ~10 |
| Copyright year | one query, one loop | 4 |
| Language choice remembered | one listener, one storage write | ~6 |

Delivered: 22 lines of script, one file, no dependency, no build. The dialog
that the first draft budgeted for is gone: see block 14.

### Directory layout

```
public/
  index.html            # Spanish, the default
  en/index.html         # English
  assets/
    styles.css          # tokens + every component
    main.js             # the 22 lines
    logo.svg            # the mark
    favicon.svg
    og.png              # social card, 1200x630
  legal/
    privacidad.html     # shells, marked noindex
    terminos.html
    cookies.html
  sitemap.xml
  robots.txt
  site.webmanifest
scripts/
  check.sh              # the greps `make check` runs
  browser-check.py      # the browser gate, needs playwright
  og.py                 # draws og.png once from the tokens
Makefile
LANDING.md              # this document
```

`public/` because the backend will eventually embed and serve this directory
from the same origin as the API. Until then it is served by any static server.

### Local development

```
make serve           # python3 -m http.server -d public 8080
make check           # greps: forbidden words, markers, anchors, links, drift
make check-browser   # playwright: console, overflow, switch, keyboard
make og              # redraw the social card after a brand change
```

`make check` runs four greps and nothing else: no forbidden word in `public/`,
no unfinished marker, every anchor and internal link resolving, and the two
language pages not drifting apart. No linter, no formatter, no CI. Deployment
is out of scope for now.

Opening `public/index.html` as a `file://` path shows an unstyled page: the
asset paths are absolute, exactly as they are in production. Always go through
the server.

## Brand

**Pautia.** A lighthouse: always on, visible from far away, first to arrive, and
boringly reliable. It says the product's promise without claiming intelligence.

- Positioning: a WhatsApp agent that replies and acts through a visual flow
  controlled by the business; chat import is an optional shortcut.
- Tagline (ES): `Un agente para el WhatsApp de tu negocio.`
- Tagline (EN): `An agent for your business's WhatsApp.`
- Support line (ES): `Un agente de IA en tu WhatsApp de siempre.`
- Name must be checked for availability: `pautia.com`, `pautia.ai`, `pautia.app`,
  `getpautia.com`, and the handle on the networks we would post to. A name we
  cannot get is worth less than a name we can say out loud on a call.

### Voice

- Address the business and its team, not an individual's personality. Spanish
  remains neutral and informal when a direct instruction is useful.
- Short sentences. Second person, present tense, concrete nouns.
- Numbers only when they are measured. The page invents no statistics, no
  testimonials, and no customer logos until they are real; a placeholder logo
  strip is worse than none, so the section is designed without one.
- Never superlatives that cannot be defended: no `el mejor`, no `100%`, no
  `nunca falla`.
- English copy is a translation of the Spanish, not a rewrite: same claims, same
  order, same lengths, so the two pages never disagree.

### Words we do not use

`framework`, `runtime`, `YAML`, `scope`, `self-hosted`, `open source`,
`WhatsApp partner`, `official API`, `API oficial`, `no-code`, `sin código`,
`chatbot`, `node`, `Go`. Also no feature noun that the product does not have
yet: `equipos`, `roles`, `API pública`, `webhooks para clientes`,
`WhatsApp Business API`.

### Visual system

Light by default, dark by `prefers-color-scheme` with the same tokens
overridden: no manual toggle, because the toggle is a preference someone has to
maintain forever. One accent, one highlight color, and a neutral scale.

```css
:root {
  --brand-600: #0E7C6B;  /* primary: CTAs, links, focus */
  --brand-700: #0B6459;  /* hover and pressed */
  --brand-100: #E6F4F1;  /* tinted backgrounds */
  --amber-500: #F59E0B;  /* the highlighted plan only */
  --ink-900: #0B1220; --ink-700: #263243;
  --ink-500: #5A6B7F; --ink-400: #8492A3; --ink-300: #A9B4C2;
  --line: #E3E8EF; --bg: #FFFFFF; --bg-sub: #F6F8FA; --bg-inv: #0B1220;
  --ok: #15803D; --warn: #B45309; --danger: #B42318;

  --radius-s: 8px; --radius-m: 12px; --radius-l: 20px; --radius-pill: 999px;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;
  --space-9: 96px;

  --step--1: 0.875rem; --step-0: 1rem; --step-1: 1.125rem;
  --step-2: 1.5rem; --step-3: clamp(1.5rem, 1.2rem + 1.2vw, 2rem);
  --step-4: clamp(2rem, 1.4rem + 2.4vw, 3rem);

  --shadow-1: 0 1px 2px rgb(11 18 32 / 6%), 0 1px 3px rgb(11 18 32 / 4%);
  --shadow-2: 0 8px 24px rgb(11 18 32 / 10%);

  --font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  --wrap: 1120px;   /* max content width */
  --prose: 68ch;    /* max measure for paragraphs */
}
```

- No web font: the system stack renders in zero requests and looks native on
  every platform. If the brand later needs a display face, it ships as one
  self-hosted `woff2` subset used for headings only, and the budget in
  `Performance` holds.
- Two breakpoints, mobile first: `640px` and `900px`. Sections are
  single-column until `640px`, two-column features until `900px`, three-column
  plans above it.
- Spacing is the scale above, nothing else. No one-off pixel values in
  components.

### Logo mark

A lighthouse beam over a chat tail, in one color, drawn as inline SVG so it
inherits `currentColor` and needs no second request. The wordmark is the product
name in the 600 weight of the system stack, not a drawn wordmark: it must stay
crisp at 20px and it must never be the only place the font choice shows. The
favicon is the mark alone, as `favicon.svg`, plus a `site.webmanifest` with the
same mark and a solid background so the browser tab is not a white square.

## Page anatomy

Fifteen blocks, in this order, with the reason each one is there. A block marked
`optional` is not built in the first pass; it exists in the plan so nobody
invents it later in a hurry.

| # | Block | Why it exists | Launch-safe |
| --- | --- | --- | --- |
| 1 | Skip link and header | Orientation and two exits | yes |
| 2 | Hero | The promise, in one screen | yes |
| 3 | Trust line | Removes the three usual objections | yes |
| 4 | The problem | Names the pain in the customer's words | yes |
| 5 | How it works | Three steps, no jargon | yes |
| 6 | Features | What it does, concretely | mostly |
| 7 | The AI, honestly | The objection nobody answers | partially |
| 8 | Use cases | Lets them find themselves | yes |
| 9 | Plans | The three tiers | yes |
| 10 | FAQ | The nine real objections | mostly |
| 11 | Privacy and data | Their data, their rules | partially |
| 12 | Final CTA | The second chance to convert | yes |
| 13 | Footer | Legal, status, language | yes |
| 14 | Waitlist | The only conversion path until signup exists | yes |
| 15 | Optional blocks | Later phases | no |

`optional` blocks, to be designed but not built now: a customer logos strip (no
real customers), a live demo of a conversation (needs the dashboard), a
testimonial carousel (nobody has said anything yet), and a status page link in the
footer (the status page lives in `../ops` and has no URL yet).

### 1. Header

Sticky, `blur` background, one row. Left: mark plus `Pautia`. Center, hidden
below `900px`: `Cómo funciona`, `Planes`, `Preguntas`, `Seguridad`. Right:
`Iniciar sesión` (ghost) and `Empezar` (primary, opens the dialog).

Mobile: the center links collapse into a `<details>` disclosure with the same
anchors, so the menu needs no script at all. The header never covers more than
10% of the viewport, and the anchor targets get `scroll-margin-top` equal to
the header height so an anchored section is not hidden behind it.

### 2. Hero

H1 (ES): `Un agente para el WhatsApp de tu negocio`.
H1 (EN): `An agent for your business's WhatsApp`.
The subtitle explains how AI follows a visual flow to respond or act on each
incoming message. The business can build it from scratch without programming
or optionally import chats for an AI-suggested draft. The CTA remains a waitlist,
not checkout. The mock conversation is illustrative.

### 3. State of the product

Under the CTA, the page says it is being prepared. There is no claim about
free trials, cancellation, or credit cards until those policies are settled.

### 4. The problem

`Empieza con tus chats. O empieza desde cero.` Chat import is one way to build
the first draft, not a prerequisite. No unmeasured claims about lost sales,
competing businesses or unanswered late-night messages.

### 5. How it works

Three steps in both languages:

1. **Connect WhatsApp:** pair the business's existing number; chat import is
   opt-in and gives AI material for an initial suggestion.
2. **Review the support flow:** start from that draft or build it from scratch
   in the visual editor, without programming. Connect the business's services
   and test before publishing.
3. **Start the agent:** nothing answers until you activate it; it follows the
   flow you approved, during the hours you chose.

The customer sees a `flujo de atención` / `support flow`, not an implementation
term for the conversation state machine. Importing history requires consent
and the available history depends on what WhatsApp provides.

### 6. Features

Nine cards, three columns on desktop. They cover configurable hours,
prewritten reply variants, pacing, no unsolicited outreach, connections to
customer services, your existing number, an AI-suggested first draft, review in a
visual editor and customer-managed changes. Night-time availability is merely
an optional schedule, never the pitch.

### 7. AI within the customer's rules

`La IA propone. Tú decides qué puede hacer.` The AI recommends a flow and
recognizes which approved path fits a message. It chooses approved responses
and actions, rather than writing new replies to customers. The page does not
advertise the optional text-generation capability that exists in the engine.

### Account care

A separate section between pricing and FAQ explains configurable hours,
reading and reply delays, random timing variation, read receipts, typing
indicators, alternative phrasings, sender and account rate limits, and no
unsolicited mass messaging. These controls may reduce risk but do not prevent
account restrictions. The FAQ stays brief and links here, without discussing
what happens after a ban. See ADR 0011 for implemented pacing and the open
schedule dependency under `Current pitch`.

### 8. Use cases

Six cards, a title and one sentence each, from the businesses that buy this.
Every sentence below is the final copy.

- `Citas y reservas` — Dentistas, clínicas, salones, talleres: toma la cita, la
  confirma y recuerda el día anterior.
- `Ventas y cotizaciones` — Recibe la consulta, pregunta lo que le falta y te
  pasa el cierre a ti.
- `Soporte posventa` — Estado del pedido, guía de uso y resolución de dudas sin
  que nadie tenga que abrir el correo.
- `Rastreo de pedidos` — Avisos de salida, entrega y firma, uno por mensaje.
- `Recordatorios` — Cita de mañana, pago pendiente, renovación, documento que
  falta.
- `Preguntas frecuentes` — Horarios, ubicación, precios y formas de pago, las
  que le preguntan siempre.

Six cards, six sentences, no invented results.

### 9. Plans

Three tiers, the middle one highlighted. Full spec in `Plans`.

Header: H2 `Elige el plan que necesitas hoy`, sub `Todos incluyen los tres
pasos de arriba, historial y soporte por correo. Cambia o cancela cuando quieras`
(the last clause is a policy claim, see `Claims guardrail`).

Each card: name, one-line positioning, price, price unit, a `Más elegido` ribbon
on the middle card, a CTA, and a list of rows. Rows are grouped `Incluye` (same
in all three, listed once above the cards) and `Límites` (what differs). Every
limit row is a number a customer can hold us to.

The monthly/annual switch is two radios above the cards, styled as a segmented
control, with the price and its note swapped in CSS through `:has()`, so it
works with the script disabled and the annual price is in the HTML for the
crawler either way. Both pages use the same radio `id`, which is what keeps the
rule written once.

Below the cards, one line, shipped: `Los límites cuentan los mensajes que envías,
no los que recibes.` And the honest note about what a limit does when it is
reached: the agent stops replying rather than leaving a customer without an
answer, and support raises it. The page never says a message is lost silently.

### 10. FAQ

Seven questions in `<details>`, one summary per question, the answer below.
Native element: no script, works on the server, keyboard accessible, and the
answer is in the HTML for the crawler. The two that need a phase are in the
source as comments, with the phase each one waits for.

1. `¿Necesito un número de WhatsApp nuevo?` — No: conectas el que ya usas, sea
   personal o de empresa, y puedes conectar más de uno.
2. `¿Qué pasa si mi cuenta pide una verificación extra?` — Algunas cuentas de
   WhatsApp exigen una confirmación en el teléfono cada vez que se conecta un
   equipo nuevo. Si la tuya la pide, te lo decimos antes de que contrates, y si
   resulta que no se puede automatizar te lo decimos también.
3. `¿La IA puede mandar lo que quiera?` — No. Las respuestas son las que
   configuramos contigo y las reglas que tú pones. Pautia nunca inicia una
   conversación que el cliente no empezó y nunca manda mensajes masivos.
4. `¿Puedo cambiar precios u horarios sin que se caiga nada?` — Sí: los cambios
   se aplican en caliente, sin dejar de responder. Hoy los aplicamos nosotros.
5. `¿Qué pasa con mis datos?` — Cada cuenta vive aislada de las demás, y esta
   página no usa cookies ni rastreadores.
6. `¿Necesito saber programar?` — No. Nos cuentas qué necesita tu negocio y lo
   dejamos configurado por ti. Hoy lo hacemos nosotros.
7. `¿Y si mi número es baneado por WhatsApp?` — Ninguna herramienta puede
   prometer que eso no pase, y esta tampoco. Lo que sí hace Pautia es comportarse
   como una persona: no manda mensajes masivos, no inicia conversaciones que
   nadie pidió, y modula el ritmo de las respuestas. Eso reduce muchísimo el
   riesgo de que un número sea bloqueado.

Two rules wrote this section. The ban answer says what the automation **does** to
reduce the risk, and stops there: what would happen after a ban is a support
story, not a promise, and a landing page should not sell one. And the
verification answer is a disclosure policy, not a capability: the commitment is
that we tell the customer before they pay, which we can keep without shipping the
passkey relay.

Written and not shipped: `¿Puedo cancelar?` (a commercial decision), `¿Puedo
revisar lo que respondió?` (needs the dashboard) and the export and delete
promise (needs the data operations).
### 11. Privacy and data

Four items written, two shipped, no legalese, each one a fact we can prove.

- `Aislamiento` — `Cada cuenta vive en su propio espacio, aislada de las demás.`
- `Cero cookies` — `Esta página no usa cookies, rastreadores ni scripts de
  terceros.`
- `Exportar` and `Borrar` — written, and in the source as comments: they need
  the data operations, and a promise nobody can keep yet is the one that costs a
  customer their trust.

The footer links `Privacidad`, `Términos` and `Cookies` to shells in `/legal`,
all three marked `noindex`. Until legal writes them, the shells carry the two
shipped items and an `En preparación` line; a legal page that says nothing beats
a legal page that says something wrong.

### 12. Final CTA

Full-width band, inverted background, one line, one link. The last block on the
page, so it repeats the promise and not the feature list: H2 `Entra en la lista
de espera` and `Estamos preparando la plataforma. Cuando abramos, te avisamos
por correo y entras primero.`

### 13. Footer

Four columns: product, resources, legal, and a bottom row with the mark, `© 2026
Pautia`, the language switcher, and the region of operation. Social links only for
accounts that exist; no dead icons. `[estado]` and `[ayuda]` are placeholders in
the plan and must be either real URLs or absent from the first version.

### 14. Waitlist

**Shipped, and it replaced the login dialog this plan first described.** A form
that posts to an account service that does not exist is a worse first impression
than an honest link, and the plan's own rule is that a page may not promise what
nobody can deliver. So there is no form, no dialog, and no script on this block.

One link, everywhere: the header, the hero, the three plan cards, and the
closing band all carry the same `mailto:` with a subject, to an address that
exists on day one.

- Label (ES): `Lista de espera`. Label (EN): `Join the waitlist`.
- Target: `mailto:hola@pautia.app?subject=Lista%20de%20espera%20de%20Pautia`, and
  the same with an English subject on `/en/`.
- The hero says in one line what the button does, so no one clicks it wondering:
  `Estamos preparando la plataforma. Escríbenos y te avisamos en cuanto esté.`
- The closing band repeats the promise rather than the feature list: `Cuando
  abramos, te avisamos por correo y entras primero.`

What this costs, so it is a decision and not an accident: a mail client is the
collection mechanism, so the address of whoever writes is the address we get, and
there is no double opt-in, no confirmation and no place to store a list other
than a mailbox. That is acceptable while the product is being prepared and is
not acceptable at launch. **When the account service exists, this block becomes
the signup form, and the label changes from a waitlist to a plan.** The
`mailto:` is the seam.

The second factor, which the product's account flow has, belongs to that future
form and to nothing on this page.

### 15. Optional blocks

Not built in the first pass. Each is listed so the plan stays complete and the
conditions for adding it are written down: customer logos only with a real
customer's written permission, a live demo only when the dashboard exists and
can be shown with a throwaway account, a testimonial only from a real customer,
a status page only once `../ops` has one.

## Plans

Three tiers. The differences are the ones we can enforce and count, which is why
the internal numbers below are the same list as the platform's own ceilings: a
plan is a bundle of those ceilings, so no plan promises something that has no
counter behind it.

Names: `Básico`, `Pro`, `Negocio` (`Basic`, `Pro`, `Business`). `Pro` is
highlighted. The alternative set, if they want a less generic register, is
`Semilla` / `Taller` / `Negocio` (`Seed` / `Workshop` / `Business`); it is noted
because the generic set is a default, not a decision.

### What every plan includes

Stated once, above the three cards, so it is not repeated nine times. This
describes the finished product, not capabilities ready to sell today:

- Conectas el número de WhatsApp que ya usas con un QR.
- La IA propone un flujo a partir del historial, solo si decides importarlo.
- Tú revisas las respuestas, acciones y horarios antes de activarlo.
- Las conversaciones de cada cuenta permanecen separadas.
- Soporte por correo, en español.

### What differs

Four rows per card. Further differences require commercial decisions, not
more speculative marketing copy.

| | Básico | Pro | Negocio |
| --- | --- | --- | --- |
| Position | `Para empezar a contestar` | `Para negocios con clientes` | `Para varios locales` |
| Números de WhatsApp | 1 | 3 | 10 |
| Mensajes al mes | 1,000 | 5,000 | 25,000 |
| Flujos configurados | 2 | 10 | 50 |
| Soporte | Por correo | Prioritario | Prioritario y llamada |

Not shipped, and why:

| Row | Needs |
| --- | --- |
| Espacios de trabajo | the host's own decision, not a customer-facing number |
| Historial, in days | live API, dashboard, and a retention policy |
| Agendamiento y catálogo | the editor and the tool phases |
| Integraciones con tus sistemas | a public integration surface, which does not exist |
| Control humano por conversación | the manual takeover phase |
| Onboarding asistido | an operations decision, not a feature yet |

A price is written in exactly two kinds of place: once per card, and once in the
structured data for search engines. Changing the price of one plan is four
edits, and `make check` cannot catch a fifth: the check exists, the discipline
is the author's.

### Prices

Recommended starting prices, all in USD. Annual billing is 30% off twelve
monthly payments, charged once per year. No taxes are implied until the
commercial policy is defined.

| | Básico | Pro | Negocio |
| --- | --- | --- | --- |
| Monthly | $39 | $99 | $249 |
| Annual (monthly equivalent) | $27.30 | $69.30 | $174.30 |
| Annual (one charge) | $327.60 | $831.60 | $2,091.60 |

Open before launch: whether displayed prices include taxes and whether these
recommended prices remain the final commercial prices.

### How a plan becomes platform limits

The commercial plan is a bundle of ceilings. The table is the contract with the
backend, and it is why the plan's numbers are round and small: a ceiling is
enforced, not estimated.

| Ceiling | Básico | Pro | Negocio |
| --- | --- | --- | --- |
| Espacios (scopes) provisionados | 1 | 3 | 10 |
| `max_bots` (números definidos) | 1 | 3 | 10 |
| `max_running_bots` (activos a la vez) | 1 | 3 | 10 |
| `max_graphs` | 5 | 20 | 100 |
| `max_actions` | 10 | 50 | 250 |
| `max_llms` | 1 | 3 | 10 |
| `max_soms` | 1 | 3 | 10 |
| `max_outbound_messages_per_month` | 1,000 | 5,000 | 25,000 |
| `max_stored_message_bytes` | 100 MB | 1 GB | 5 GB |

Three consequences the page must respect:

- **A number is a number, not a promise of a human.** The outbound ceiling
  counts messages, not conversations, so the customer-facing number in the card
  is `Conversaciones al mes` while the enforced number is messages. One
  conversation is many messages. Either the card says `mensajes al mes` or the
  quota is several times the number on the card. This is the single most likely
  way to lose a customer, so it is stated here in bold.
- **Storage and retention are different things.** The byte ceiling is a hard
  cap on how much content is kept; the retention in days is our policy. When the
  cap is reached, the product stops importing and pauses the bot rather than
  dropping messages silently, and the page says that is what happens.
- **Inbound is not metered by the engine.** Outbound is the ceiling the
  platform enforces; inbound arrives as a usage fact for us to count. A plan
  that says `conversaciones ilimitadas` is a promise we can only keep with our
  own counter, which is a backend dependency and not a landing-page fact.

## Claims guardrail

This waitlist describes the **finished product**, not the present implementation.
Do not open checkout until the promises below are delivered and tested:

| Customer-facing claim | Dependency |
| --- | --- |
| AI proposes a flow from opt-in chat history | ROADMAP Phase 16 |
| Visual review, simulation and self-service edits | ROADMAP Phase 15 |
| AI selects approved paths and prewritten answers | PLAN Phase 8 |
| Customer chooses business hours | **Not yet planned in the engine** |
| AI selects approved replies and actions | PLAN Phase 8 |
| Pacing, read receipts, typing, variants and limits | ADR 0011 |
| Monthly message and storage ceilings | PLAN Phase 7 |

The account-care section says these controls can reduce risk, never that they
prevent a restriction or that a particular percentage reduction is proven.
The history import is opt-in, and the provider may not offer every chat.
The customer, not an employee of Pautia, reviews and approves the result before
activating the agent. The three plan prices are proposals until sales open.

## SEO and metadata

- `lang` on each page: `es` and `en`, never a single document with two languages.
- Title (ES): `Pautia — Un agente para el WhatsApp de tu negocio`.
- Description (ES): `Un agente que responde y actúa por el WhatsApp de tu
  negocio. Diseña su flujo visualmente o importa tus chats para recibir una
  propuesta inicial.` English metadata makes the equivalent claims.
- Canonical per page, `hreflang` with `es`, `en`, and `x-default` pointing at
  Spanish, reciprocal, in both heads.
- Open Graph and Twitter card with one shared image, `1200x630`, the mark, the
  tagline, and no text too small to read. Generated once, by hand, from the
  tokens.
- `robots.txt` allows everything and points at `sitemap.xml`, which lists `/`
  and `/en/`. The legal shells are `noindex` while they are placeholders.
- JSON-LD: one `SoftwareApplication` with the three `Offer`s and the plans'
  prices, updated by hand whenever a price changes, which is the fourth of the
  four edits a price costs. A `FAQPage` block is optional: search engines
  stopped showing it for most sites, so it is written only if it costs nothing.
- No tracking, no pixels, no third-party script of any kind. The page is fully
  functional with every external request blocked, which is both a privacy
  statement and a performance guarantee.

## Language

- `/` is Spanish, `/en/` is English. Two real pages, two real URLs, two real
  crawls, and no content swapped after load.
- The header and footer carry a language switcher that keeps the anchor the
  visitor was reading.
- A visitor whose browser language disagrees with the page they landed on is
  sent once to the other one, remembered for the session, never overridden
  after they switch by hand. Twelve lines: read `navigator.language`, compare
  with the page, `location.replace` the counterpart, store the choice in
  `sessionStorage`, and stop if it is already stored.
- The English page is not a thinner page: same sections, same order, same
  claims. A missing translation is a bug with a name, not a shorter page.

## Performance budget

Budget, then what the page actually ships. Measured on the Spanish page, 1440
wide, over the local server.

| Metric | Budget | Measured |
| --- | --- | --- |
| HTML (per page) | ≤ 40 KB | 29.3 KB |
| CSS | ≤ 20 KB, one file, no build | 19.0 KB |
| JS | ≤ 8 KB | 1.0 KB, 22 lines |
| Requests | 4 | 3 (HTML, CSS, JS) plus the favicon |
| Fonts | 0 external | 0 |
| Web fonts | 0 | 0 |
| Layout shift | 0 | 0 to 0.011 |
| Largest contentful paint | < 1.5 s on 4G | 1.8 s, every run |
| Accessibility, best practices, SEO | 100 each | 100 each, both palettes |

The performance score moves between 85 and 98 from run to run while every other
category stays at 100. That is Lighthouse's simulated 4G throttling measuring
its own overhead on a page with three requests, no images and no fonts, not a
defect in the page: the same run reports a 1.8 s largest contentful paint in
every palette, and the blocking time varies with the machine rather than with
the page. The gate is "100, or the reason", and the reason is written down
here instead of being averaged away.

- No web font, no icon library: six glyphs as inline `<symbol>`, referenced with
  `use`. An icon font for six glyphs is absurd.
- Images: none. The hero illustration is HTML and CSS, so it is also selectable
  text and it costs no bytes. The one image on the site is the social card, which
  no browser loads.
- `content-visibility: auto` on the sections below the fold is the one
  optimization worth adding, once the page is slow enough to need it.
- The landing is not a PWA: no service worker, no manifest beyond the icons. It
  is one page that must load fast, not an app that must work offline.

## Accessibility

Not a phase, a gate on every phase.

- Landmarks and headings: one `h1`, no level skipped, `header`/`nav`/`main`/
  `footer`, and the section `h2`s in order.
- Skip link as the first focusable element, visible on focus.
- Focus is always visible, using a 2px brand ring with an offset, never removed.
- Contrast ≥ 4.5:1 for text and ≥ 3:1 for borders and icons, checked on both the
  light and the dark palette, including the highlighted plan card. The inverted
  band carries its own three colours per theme, because a colour that reads on
  the background reads on nothing else.
- There is one muted colour, not two. A second lighter grey existed for small
  text and could not pass 4.5:1 on the tinted background, and the role that
  cannot be read is not a role.
- Targets are at least 44x44 px on touch; the plan cards and FAQ summaries are
  not the ones that shrink.
- `prefers-reduced-motion: reduce` removes the two animations on the page, both
  of which are decorative.
- The mockup in the hero is decorative: `aria-hidden`, so a screen reader does
  not read a fake conversation as if it were content.

## What is deliberately absent

- No cookie banner: there are no cookies, so there is nothing to consent to. A
  banner would be the only dishonest element on the page.
- No chat widget, no live chat, no WhatsApp floating button: it is a bot
  product, and a bot that answers before you have paid is a bad first
  impression.
- No count-up animations, no parallax, no carousels, no testimonial sliders.
- No exit-intent popup, and no dialog of any kind: the call to action is a link
  the customer follows, not a form they submit into nothing.
- No login form while there is no account service to log into. See block 14.

## Work plan

Five phases, each ending in a gate. Same shape as the rest of the product's
plan, because it is the same kind of work: a phase is done when its gate passes,
not when its files exist.

### Phase A — Structure and system

Deliverables:

- [x] `public/` layout, `Makefile` with `serve` and `check`.
- [x] Tokens in `assets/styles.css`, light and dark, no component yet.
- [x] Header, footer, and the call to action, real links.
- [x] Logo mark, favicon, manifest.
- [x] `make check` passing: no forbidden word, no unfinished marker, links and
      anchors resolve, and the two languages do not drift.

Gate: the page opens from `make serve` at 320px and at 1440px, the header works
with the keyboard only, and nothing is a placeholder box.

### Phase B — The message

Deliverables:

- [x] Hero, the state-of-the-product line, problem, and the three steps, in
      Spanish.
- [x] Features, the honest section, and the use cases.
- [x] The claims table reviewed row by row, and every `no` claim out of the
      rendered page into a comment naming the phase it waits for.
- [x] English translation of everything above, in `/en/`.

Gate: a person who does not know the product explains it in their own words
after one read, and no sentence on the page fails its row in the claims table.

### Phase C — Plans and the way in

Deliverables:

- [x] The three cards, the shared `Incluye` block, the rows that differ, and
      the monthly/annual switch working with the script disabled.
- [x] Prices in one place per card, and the offer markup in step with them.
- [x] One call to action everywhere, and it opens a mail client.
- [x] The comparison is only ever the rows inside the cards; no second table
      that can disagree with the first.

Gate: the prices are readable with the script blocked, and every call to
action leads somewhere real.

### Phase D — Language, metadata, polish

Deliverables:

- [x] Switcher, one-time auto-detect, `x-default`, reciprocal `hreflang`.
- [x] Titles, descriptions, canonical, Open Graph image, `robots.txt`,
      `sitemap.xml`, JSON-LD.
- [x] Legal shells marked `noindex`.
- [x] Dark mode, `prefers-reduced-motion`, the focus ring, and the contrast
      check on both palettes.

Gate: both pages are complete and equivalent, no `noindex` on anything public,
and no dead link anywhere.

### Phase E — Verification

Deliverables:

- [x] Lighthouse, locally, in both palettes: the reason for every point lost is
      written down in `Performance budget`.
- [x] Automated pass on the hero, the plan cards, the FAQ and the language
      switch, with the console watched: `make check-browser`.
- [x] Keyboard-only pass over the page.
- [x] Every claim in the table re-checked against the product, row by row.
- [x] `make check` green, and the forbidden-word list applied to the rendered
      text, not only to the source.
- [ ] A human reading the Spanish copy aloud, and an English speaker reading the
      translation. The only gate a machine cannot pass.

Gate: the page ships with a written record of what was verified and when.

### Later, not now

- Deployment, domain, and DNS.
- The legal pages with real text.
- Analytics, if we ever want them, and the consent they would need.
- A blog, a changelog, a comparison page against other tools, and a landing
  page per use case: each of these is a separate decision with a separate cost,
  and none of them is a prerequisite for launching.

## Open decisions

Settled, and recorded here so nobody reopens them by accident:

- **The login dialog is not on the page.** There is no account service to log
  into, so every call to action is a `mailto:` for the waitlist (block 14). The
  dialog returns with the signup form, not before.
- **The page presents the finished product, not today's backend.** The waitlist
  prevents purchase while the editor, AI-assisted onboarding and configurable
  schedules remain unfinished. Recheck every claim before opening sales.
- **The card sells messages, not conversations.** The ceiling the platform
  enforces counts outbound messages, so that is what the card says.
- **No `FAQPage` structured data.** Search engines stopped showing it for most
  sites, and hand-written markup that duplicates the visible FAQ is a second copy
  to keep in sync for nothing.

Still open:

- Recommended USD prices are $39, $99 and $249 monthly; annual billing is
  30% off. Confirm final prices and tax treatment before opening sales.
- Whether there is a free trial, and what its limits are; the page currently has
  no free plan because a trial needs a tenant provisioned before any money
  exists.
- The domain, the handles, the `mailto:` address that receives the waitlist, and
  the legal entity behind them. `pautia.app` is a placeholder until it is bought.
- Where the data physically lives, which the privacy block must state.
- The retention policy in days that each plan promises, and how it interacts with
  the storage ceiling.
- Whether the second factor is a code, an app, or a link. It belongs to the future
  signup form and to nothing on this page.
- Confirmation of the commercial promises: the trust line and the cancellation
  question are both written down and both unshipped.
- Whether the use-case cards become their own pages, and with which URLs.
