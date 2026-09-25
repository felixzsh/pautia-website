# Pautia — Landing page plan

What this document is: the complete plan for the public landing page of Pautia, the
product this repository sells in front of. It owns the page structure, the copy,
the brand, the technology decision, the three plans, and the gates each part has
to pass. It is not a contract: the copy moves as the product moves, and every
claim it makes is checked against the phase that has to deliver it
(`Claims guardrail`).

The product behind it is still being prepared. This page is therefore written
twice over: what we may say the day we launch, and what may only appear after a
phase ships. Nothing on the page may promise something no phase will build.

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
| Login dialog | `<dialog>` + `showModal()` | ~20 |
| Mobile menu | `<details>` disclosure, no script | 0 |
| Prices monthly/annual | two radios + CSS `content`, no script | 0 |
| FAQ | native `<details>`, no script | 0 |
| Focus trap, `Escape`, focus return | native `<dialog>` | 0 |
| Language auto-detect | `navigator.language`, one-time `location.replace` | ~12 |
| Form pending state | one class on submit | ~8 |

Budget: 100 lines of script, no dependency, no build. Anything above that needs
a conversation before it is written.

### Directory layout

```
public/
  index.html            # Spanish, the default
  en/index.html         # English
  assets/
    styles.css          # tokens + every component
    main.js             # the 100 lines
    logo.svg            # the mark and the wordmark
    favicon.svg
    og.png              # 1200x630 social card (generated later)
  legal/
    privacidad.html     # placeholder shells, filled by legal
    terminos.html
    cookies.html        # says there are no cookies
  sitemap.xml
  robots.txt
  site.webmanifest
Makefile                # serve + check, no dependencies
LANDING.md              # this document
```

`public/` because the backend will eventually embed and serve this directory
from the same origin as the API. Until then it is served by any static server.

### Local development

```
make serve    # python3 -m http.server -d public 8080
make check    # forbidden words, internal links, HTML basics
```

`make check` runs three greps and nothing else: no forbidden word in
`public/`, no `TODO` or `FIXME` in `public/`, and every internal link in
`public/index.html` that points to an `id` or a local file exists. No linter,
no formatter, no CI. Deployment is out of scope for now.

## Brand

**Pautia.** A lighthouse: always on, visible from far away, first to arrive, and
boringly reliable. It says the product's promise without claiming intelligence.

- Positioning: the business that answers its customers at 3am, without hiring
  for the night shift.
- Tagline (ES): `Que tu negocio responda siempre.`
- Tagline (EN): `Your business always answers.`
- Support line (ES): `Un agente de IA en tu WhatsApp de siempre.`
- Name must be checked for availability: `pautia.com`, `pautia.ai`, `pautia.app`,
  `getpautia.com`, and the handle on the networks we would post to. A name we
  cannot get is worth less than a name we can say out loud on a call.

### Voice

- Spanish, informal `tú`, neutral country: no regionalisms, no `vosotros`.
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
| 14 | Login dialog | The only interactive surface | yes |
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

Two columns above `900px`, one below. Left is the copy, right is an
illustration: a conversation mockup built in HTML and CSS, not a screenshot.

- Eyebrow: `Agentes de IA para WhatsApp`
- H1: `Que tu negocio responda siempre, incluso a las 3 de la mañana`
- Sub: `Pautia conecta un agente de inteligencia artificial a tu número de
  WhatsApp. Responde lo que te escriben, agenda citas, confirma pedidos y te
  avisa cuando hace falta que intervengas. Tú sigues al mando.`
- Primary: `Empezar ahora` (opens the dialog)
- Secondary: `Ver cómo funciona` (anchor, no JS)

English: `An AI agent on your existing WhatsApp number. It answers, books,
confirms, and hands you the conversations that need you. You stay in charge.`

The H1 is the only place the product promises availability. It does not promise
intelligence, accuracy, or volume.

### 3. Trust line

Under the CTAs, one line, three items with a check icon each. Draft:

`Sin permanencia · Sin tarjeta de crédito · Tus datos los puedes exportar y
borrar`

`Sin tarjeta` and `Sin permanencia` are billing promises. If the commercial
policy does not guarantee them, they are the first copy to change; the
alternative is `Empieza con un plan, cámbialo o cancélalo cuando quieras`, which
still needs the same decision. Do not ship this line without it.

### 4. The problem

Left: H2 and a paragraph. Right: three short cards, each a sentence a customer
would say out loud.

- H2: `Cuando te escriben fuera de horario, ya hablaron con otros tres`
- Body: `La mayoría de las ventas de un negocio no se pierden por precio: se
  pierden porque nadie contestó a tiempo. Hoy tu número solo atiende cuando
  alguien está sentado frente a la pantalla.`
- Card 1: `Escriben a las 23:00 y contestas mañana.` Card 2: `Mientras tanto ya
  escribieron a otros tres negocios.` Card 3: `Y en temporada se te juntan las
  mismas preguntas siempre.`

No statistics. When we have real numbers from the product's own usage, they go
in here as measured facts with the date and the source.

### 5. How it works

Three numbered steps, vertical on mobile, horizontal above `900px`, each with a
line, a title, and a paragraph of at most 40 words.

1. `Conectas tu WhatsApp` — `Escaneas un QR desde tu celular o escribes un
   código de 8 dígitos. Ya está: Pautia responde con el número que ya usabas. No
   necesitas un número nuevo ni cambiar nada.`
2. `Le dices cómo debe comportarse` — `Horarios, catálogo, preguntas
   frecuentes, lo que tiene que hacer y lo que no: lo describes y lo sigue. Si
   cambias un precio o un horario, lo ajustas y sigue funcionando.`
3. `Pautia trabaja y tú tomas el control` — `Te avisa de lo importante. En
   cualquier momento entras tú, respondes a mano, y el agente se calla mientras
   estés ahí.`

Step 2 is the one that depends on the editor. Until the editor ships, the page
can say `lo describes` only if the description happens somewhere real. The
launch-safe phrasing is `lo configuras` and step 2 keeps the same shape; see
`Claims guardrail`.

### 6. Features

Eight cards in a 2x4 grid, each an icon, a title, and two lines. Order is by
what the customer feels first, not by how hard it was to build.

1. `Responde de noche y los fines` — `El número no tiene horario. Atiende
   mientras tú duermes, en días festivos, en tu hora de comida.`
2. `Entiende lo que escriben` — `No necesitas repetir el mismo comando. Entiende
   la intención, aunque la persona escriba mal o abrevie.`
3. `Contesta lo que tú escribiste` — `Por defecto responde con mensajes que tú
   redactaste, con variantes, para que no suene a máquina.`
4. `Tú decides qué puede y qué no` — `Reglas por conversación, por horario, por
   cliente. Nada sale hacia tus clientes sin pasar por ellas.`
5. `Te pasas el control cuando quieres` — `Respondes tú a mano y el agente se
   apaga en esa conversación. Cuando vuelves, sigue como si nada.`
6. `No parece un robot` — `Espera antes de leer, escribe con su ritmo y no
   manda el mismo texto a todo el mundo. Los envíos masivos y no solicitados
   no existen.`
7. `Conecta tus herramientas` — `Agenda, inventario o lo que uses: Pautia consulta
   tus sistemas y responde con lo que le devuelven.`
8. `Queda todo registrado` — `Cada conversación queda en el historial con lo que
   se pidió, lo que se respondió y por qué. Puedes revisarlo, exportarlo y
   borrarlo.`

### 7. The AI, honestly

The section every competitor hides and every serious buyer reads. H2: `La IA
ayuda, no manda`.

- `Por defecto no inventa nada` — `Las respuestas son las que tú escribiste. La
  IA decide cuál usar y a quién, no qué decir.`
- `Si no está seguro, no contesta` — `Cuando la confianza no alcanza, el caso
  pasa a una persona y te avisa. Fallar es una opción válida.`
- `Si activas la redacción con IA, todo pasa por tus reglas` — `Se puede
  activar la generación de respuestas, y aun así cada respuesta se valida con
  tus reglas antes de enviarse.`
- `Puedes desactivarlo` — `Volver al modo de respuestas escritas por ti es un
  ajuste, no una migración.`

Every claim here is checkable against the routing and policy phases. This
section is the reason the page can be read by someone technical and not feel
marketed at.

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

The monthly/annual switch is two radios above the cards, styled as a
segmented control, with `aria-pressed` and the price text swapped in CSS through
`content` on a class, so it works with the script disabled and the annual price
is in the HTML for the crawler either way. `Paid annually` shows the effective
monthly price and the total charged once.

Below the cards, one line: `Los límites se cuentan por mes, se renuevan el día
que contratas y los ves en tu panel.` Plus the honest note about what a limit
does when it is reached: the bot pauses rather than dropping messages, and the
page must say the customer is notified, never that messages are lost silently.

### 10. FAQ

Nine questions in `<details>`, one summary per question, the answer below.
Native element: no script, works on the server, keyboard accessible, and the
answer is in the HTML for the crawler.

1. `¿Necesito un número de WhatsApp nuevo?` — No: conectas el que ya usas, sea
   personal o de empresa, y puedes conectar más de uno.
2. `¿Qué pasa si mi cuenta pide una verificación extra?` — Algunas cuentas de
   WhatsApp exigen una confirmación en el teléfono cada vez que se conecta un
   equipo nuevo. Cuando eso pasa te lo decimos y te acompañamos; algunas
   cuentas no se pueden automatizar y preferimos decirlo antes de cobrarte.
3. `¿La IA puede mandar lo que quiera?` — No. Las respuestas son las que tú
   escribiste, más las reglas que tú defines. Nunca iniciamos una conversación
   que el cliente no empezó.
4. `¿Puedo revisar lo que respondió?` — Sí. Cada conversación queda registrada
   con lo que se pidió, qué se respondió y por qué, y puedes exportarla y
   borrarla.
5. `¿Puedo cambiar precios u horarios sin que se caiga nada?` — Sí. Los cambios
   se aplican sin reiniciar el servicio, salvo algunos ajustes generales, que
   te avisamos antes de hacerlos.
6. `¿Qué pasa con mis datos?` — `Cada cuenta vive aislada de las demás. Puedes
   exportar lo tuyo y borrarlo cuando quieras. No usamos cookies ni rastreadores
   en esta página.` Plus `[where the data lives]`, which is a decision, not copy.
7. `¿Necesito saber programar?` — No. Todo se configura desde la web, con
   pasos que puedes leer y cambiar tú mismo.  (Depends on the editor; see
   `Claims guardrail`.)
8. `¿Y si mi número es baneado por WhatsApp?` — Ninguna herramienta puede
   prometer que eso no pase, y esta tampoco. Lo que sí hacemos: no mandamos
   mensajes masivos, no iniciamos conversaciones no solicitadas, y limitamos el
   ritmo de envío para que tu cuenta se comporte como la de una persona. Si
   ocurre, lo vemos juntos y cambiamos de número o de vía.
9. `¿Puedo cancelar?` — Sí, sin permanencia. (Commercial policy to confirm.)

### 11. Privacy and data

Four items, no legalese, each one a fact we can prove.

- `Aislamiento` — `Cada cuenta vive en su propio espacio, aislada de las demás.`
- `Exportar` — `Lo tuyo es tuyo: lo puedes exportar cuando quieras.`
- `Borrar` — `Borrar tu cuenta y tus conversaciones es una operación, no una
  tarea de soporte.`
- `Cero cookies` — `Esta página no usa cookies ni rastreadores.`

The footer links `Privacidad`, `Términos` and `Cookies` to shells in
`/legal`. Until legal writes them, the shells carry the same four items and a
`En preparación` line; a legal page that says nothing beats a legal page that
says something wrong.

### 12. Final CTA

Full-width band, inverted background, H2 `Empieza hoy a contestar a todos`, one
line, one button. The last one on the page, so it repeats the hero promise and
not the feature list.

### 13. Footer

Four columns: product, resources, legal, and a bottom row with the mark, `© 2026
Pautia`, the language switcher, and the region of operation. Social links only for
accounts that exist; no dead icons. `[estado]` and `[ayuda]` are placeholders in
the plan and must be either real URLs or absent from the first version.

### 14. Login dialog

Native `<dialog>`, opened by every `Empezar` and `Iniciar sesión`. One form,
two fields, no signup.

- Title: `Entra a Pautia`
- Fields: `correo` (`type=email`, `autocomplete=username`) and `contraseña`
  (`type=password`, `autocomplete=current-password`).
- Submit: `Entrar`, full width, primary.
- Below: `¿Olvidaste tu contraseña?`, a link to the page that will exist.
- Secondary line: `¿Todavía no tienes cuenta? Habla con nosotros`, a `mailto:`
  to an address that exists on day one. It is the only acquisition path we have
  while there is no signup, so it must not be a dead end.
- Close: the native `×`, clicking the backdrop, and `Escape`.

State machine, four states, no more:

| State | What the user sees |
| --- | --- |
| `idle` | The form, enabled |
| `pending` | Button disabled, `Entrando…` |
| `error` | One line above the fields, `aria-live=polite`, focus moves to it |
| `unavailable` | `Estamos terminando la plataforma. Escríbenos y te avisamos.` |

`unavailable` is the state the dialog is in on the day this page is published:
the form posts to `/api/auth/login`, which does not exist yet, so the script
sees no backend and renders `unavailable` instead of a 404. The `action` and
`method` are still correct in the HTML, so the day the backend exists, the
no-script path works with no change here.

The second factor, which the product's account flow has, is a state of this same
dialog, not a new page: after a correct password, the dialog asks for the code.
It is drawn in the design and not implemented yet, so nobody builds it early by
accident.

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

Stated once, above the three cards, so it is not repeated nine times. Every
item here is launch-safe, which is why this list is short:

- Conectas el número de WhatsApp que ya usas, con QR o código.
- Respuestas 24/7, con el ritmo y los límites de tu plan.
- Tus reglas: qué contesta, qué no, y a quién.
- Aislamiento entre cuentas, y exportación de tus datos.
- Soporte por correo, en español.

### What differs

| | Básico | Pro | Negocio |
| --- | --- | --- | --- |
| Position | `Para empezar a contestar` | `Para negocios con clientes` | `Para varios locales` |
| Números de WhatsApp | 1 | 3 | 10 |
| Espacios de trabajo | 1 | 3 | 10 |
| Conversaciones al mes | 1,000 | 5,000 | 25,000 |
| Historial | 30 días | 90 días | 365 días |
| Agendamiento y catálogo | — | sí | sí |
| Integraciones con tus sistemas | — | sí | sí |
| Control humano por conversación | sí | sí | sí |
| Onboarding asistido | — | — | sí |
| Soporte | correo | prioritario | prioritario + llamada |

A row that is not launch-safe is marked with `data-block` on its own `<li>`, so
the card renders without it. That is how `Historial`, `Integraciones` and
`Onboarding asistido` ship disabled on day one and switch on one attribute at a
time, without the plan table and the card ever disagreeing.

A price is written in exactly two kinds of place: once per card, and once in the
structured data for search engines. Changing the price of one plan is four
edits, and `make check` cannot catch a fifth: the check exists, the discipline
is the author's.

### Prices

Placeholders, to be replaced by the commercial decision. The annual price is
the monthly one times ten, which is the standard framing of two months free, and
the switch shows both.

| | Básico | Pro | Negocio |
| --- | --- | --- | --- |
| Mensual | `XX €` / `XX $` | `XX` | `XX` |
| Anual (mensual equivalente) | `XX` | `XX` | `XX` |
| Anual (total una vez) | `XXX` | `XXX` | `XXX` |

Open, and it changes the page: currency, whether taxes are included in the
displayed price, the exchange rate for a second currency, and whether the annual
discount is ten months or a fixed percentage.

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

Every block of copy is a promise. This table is the check: what the claim needs
in order to be true, and whether the page may say it on day one. A block whose
row says `no` ships with the block disabled (`data-block="..."` on the section,
one attribute, so enabling it later is not a rewrite).

| Block | Claim (ES) | Needs | Day one |
| --- | --- | --- | --- |
| 2 Hero | Responde de noche, siempre, en varios números | fleet, outbox, pacing | yes |
| 6 Feature 6 | No parece un robot: sin duplicados, sin spam | pacing policy, no unsolicited | yes |
| 6 Feature 7 | Conecta tus sistemas | request steps, templates | yes |
| 6 Feature 3 | Contesta con lo que escribiste, con variantes | prescribed replies | yes |
| 6 Feature 2 | Entiende intención, no comandos exactos | confidence routing | no |
| 7 | Si no está seguro, pasa a una persona | thresholds, escalation | no |
| 7 | La IA decide y registra el porqué | per-message logging | no |
| 6 Feature 4 | Reglas por conversación, horario y cliente | guards, filters | yes |
| 6 Feature 5 | Tomas el control de la conversación | manual takeover | no |
| 5 Step 2 | Lo describes y lo cambias sin escribir YAML | editor, publishing | no |
| 6 Feature 8 | Historial con lo que se pidió y por qué | live API, dashboard | no |
| 11 Privacy | Aislamiento entre cuentas | scope isolation | yes |
| 11 Privacy | Exportar lo tuyo | data operations | no |
| 11 Privacy | Borrar cuenta y conversaciones | data operations | no |
| 11 Privacy | Sin cookies ni rastreadores | nothing, true by construction | yes |
| 9 Plans | Contadores de uso para facturar | usage webhooks | no |
| 9 Plans | Retención en días por plan | retention policy | no |
| 5 Step 3 | Te avisamos cuando necesitas intervenir | notification channel | no |
| 10 FAQ 2 | Acompañamos la verificación del teléfono | passkey relay, helpers | no |
| 10 FAQ 7 | Todo se configura desde la web | editor, publishing | no |
| 15 | Tiendas de plantillas, segundo canal | later phases | no |

Three rules that follow:

1. **The headline claims are launch-safe.** H1, sub, and the three-step section
   use only what exists. The attractive claims live in blocks marked `no`, so
   turning the product on is turning a switch on.
2. **No claim without a counter or a log line behind it.** If nobody can see
   it, we cannot support it.
3. **Every `no` has a phase. When it ships, the row becomes `yes` in the same
   commit that turns the block on.** A page that is wrong in the optimistic
   direction is worse than a page that is short.

The page is written in Spanish, so the claim column is quoted in Spanish; `Needs`
names the phase that has to deliver it, in this repository's own vocabulary.

## SEO and metadata

- `lang` on each page: `es` and `en`, never a single document with two languages.
- Title (ES): `Pautia — Agentes de IA para tu WhatsApp` (37 characters).
- Description (ES): `Un agente de IA en tu WhatsApp de siempre. Responde lo que
  te escriben, agenda, confirma y te avisa cuando hace falta.` (118 characters,
  inside the limit). The English one is a translation of the same two sentences,
  measured the same way.
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

| Metric | Budget |
| --- | --- |
| HTML (per page) | ≤ 40 KB |
| CSS | ≤ 20 KB, one file, no build |
| JS | ≤ 8 KB, ≤ 100 lines, no dependency |
| Requests | 3 (HTML, CSS, JS) plus the favicon |
| Fonts | 0 external |
| LCP | < 1.5 s on a mid-range phone, 4G |
| CLS | 0, the mockup reserves its space |

- No web font, no icon library: icons are inline SVG, three of them, drawn once
  as `<symbol>` and referenced. An icon font for six glyphs is absurd.
- Images: none in the first version. The hero illustration is HTML and CSS, so
  it is also selectable text and it costs no bytes.
- `content-visibility: auto` on the sections below the fold is the one
  optimization worth adding, once the page is slow enough to need it.
- The landing is not a PWA: no service worker, no manifest beyond the icons. It
  is one page that must load fast, not an app that must work offline.

## Accessibility

Not a phase, a gate on every phase.

- Landmarks and headings: one `h1`, no level skipped, `header`/`nav`/`main`/
  `footer`, and the section `h2`s in order.
- Skip link as the first focusable element, visible on focus.
- Every input has a `label`; errors are text, associated, and announced with
  `aria-live`.
- The dialog is `<dialog>` with `showModal()`: focus trapped, `Escape` closes,
  background inert, and focus returns to the button that opened it.
- Focus is always visible, using a 2px brand ring with an offset, never removed.
- Contrast ≥ 4.5:1 for text and ≥ 3:1 for borders and icons, checked on both the
  light and the dark palette, including the highlighted plan card.
- Nothing is conveyed by color alone: the plan comparison uses a check and a
  dash with visually hidden words, so a screen reader says `incluido`.
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
- No exit-intent popup. One dialog, opened by the customer.
- No email capture before there is an email to send: `Empezar ahora` opens the
  dialog, and the dialog has the `mailto:`.

## Work plan

Five phases, each ending in a gate. Same shape as the rest of the product's
plan, because it is the same kind of work: a phase is done when its gate passes,
not when its files exist.

### Phase A — Structure and system

Deliverables:

- [ ] `public/` layout, `Makefile` with `serve` and `check`.
- [ ] Tokens in `assets/styles.css`, light and dark, no component yet.
- [ ] Header, footer, and the two buttons, real anchors.
- [ ] Logo mark, favicon, manifest.
- [ ] `make check` passing: no forbidden word, no `TODO`, links resolve.

Gate: the page opens from `make serve` at 320px and at 1440px, the header works
with the keyboard only, and nothing is a placeholder box.

### Phase B — The message

Deliverables:

- [ ] Hero, trust line, problem, and the three steps, in Spanish.
- [ ] Features, the honest AI section, and the use cases.
- [ ] The claims table reviewed row by row, and each `no` block marked with
  `data-block` and disabled.
- [ ] English translation of everything above, in `/en/`.

Gate: a person who does not know the product explains it in their own words
after one read, and no sentence on the page fails its row in the claims table.

### Phase C — Plans and dialog

Deliverables:

- [ ] The three cards, the shared `Incluye` block, the rows that differ, and
  the monthly/annual switch working with the script disabled.
- [ ] Prices in one place per card, and the offer markup in step with them.
- [ ] The login dialog: four states, keyboard and focus behavior, `mailto:`
  present.
- [ ] The comparison is only ever the rows inside the cards; no second table
  that can disagree with the first.

Gate: keyboard only, from page load to sending the form, with the dialog
trapping and returning focus, and the prices readable with the script blocked.

### Phase D — Language, metadata, polish

Deliverables:

- [ ] Switcher, one-time auto-detect, `x-default`, reciprocal `hreflang`.
- [ ] Titles, descriptions, canonical, Open Graph image, `robots.txt`,
  `sitemap.xml`, JSON-LD updated with the prices.
- [ ] Legal shells marked `noindex`.
- [ ] Dark mode, `prefers-reduced-motion`, the focus ring, and the contrast
  check on both palettes.

Gate: both pages are complete and equivalent, no `noindex` on anything public,
and no dead link anywhere.

### Phase E — Verification

Deliverables:

- [ ] Lighthouse, locally, on both pages: 100, 100, 100, 100 or the reason for
  each point lost, written down.
- [ ] Screen-reader pass on the hero, the plan cards, the FAQ, and the dialog.
- [ ] Keyboard-only pass over the whole page.
- [ ] Every claim in the table re-checked against the product, row by row, with
  the date.
- [ ] `make check` green and the forbidden-word list applied by hand to the
  rendered text, not only to the source.

Gate: the page ships with a written record of what was verified and when.

### Later, not now

- Deployment, domain, and DNS.
- The legal pages with real text.
- Analytics, if we ever want them, and the consent they would need.
- A blog, a changelog, a comparison page against other tools, and a landing
  page per use case: each of these is a separate decision with a separate cost,
  and none of them is a prerequisite for launching.

## Open decisions

- Prices, currency, taxes in the displayed price, and the annual discount.
- Whether there is a free trial, and what its limits are; the page currently has
  no free plan because a trial needs a tenant provisioned before any money
  exists.
- Whether the login dialog also creates accounts. The copy assumes it does not,
  and that the `mailto:` is the way in until signup exists.
- The domain, the handles, and the legal entity behind them.
- Where the data physically lives, which the privacy block must state.
- The retention policy in days that each plan promises, and how it interacts with
  the storage ceiling.
- Whether the second factor is a code, an app, or a link; the dialog reserves the
  state but not the mechanism.
- Confirmation of the commercial promises in the trust line and in FAQ 9.
- Whether the use-case cards become their own pages, and with which URLs.
