# Pautia website

The public face of the product: landing page, signup, and login. Its login hands
the browser a scoped session on the platform, and lets the platform show the
dashboard.

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

Planning. No code yet.
