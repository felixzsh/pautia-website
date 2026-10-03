# Pautia landing page. No build step and no dependencies: it is served as it is
# written, and checked with greps. The browser check is a developer tool and
# needs playwright, which the page itself never does.

serve:
	python3 -m http.server -d public 8080

check:
	@sh scripts/check.sh
	@python3 scripts/check-content.py

check-browser:
	@python3 scripts/browser-check.py

# The Worker that hands the page over in the right language and money, with the
# site as static assets. Needs network: npx fetches wrangler.
edge:
	@npx --yes wrangler@latest dev --port 8789 --ip 127.0.0.1

i18n:
	@python3 scripts/i18n.py

# make default-lang lang=en — the page in another language, and that
# language the one it is written in. Regenerates and checks after.
default-lang:
	@python3 scripts/default-lang.py $(lang)
	@$(MAKE) -s i18n
	@$(MAKE) -s check

og:
	@python3 scripts/og.py

# Try the waitlist against the real list, with the two secrets in .env. Sends
# one real confirmation email and leaves one contact in Brevo.
# make test-waitlist email=tu@correo.com
test-waitlist:
	@node --env-file=.env scripts/test-waitlist.mjs $(email)

.PHONY: serve check check-browser edge i18n default-lang og test-waitlist
