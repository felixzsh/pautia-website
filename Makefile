# Pautia website. The pages live in site/, where a page includes the shared
# header, footer and plan cards. `make build` writes them to public/, which is
# what gets served and deployed. public/ is committed so a deploy needs no build,
# and `make check` fails if the two have drifted.

install:
	npm install

build:
	npm run build --silent

serve: build
	python3 scripts/serve.py 8080

check: build
	@git diff --quiet HEAD -- public/index.html public/pricing.html \
	  || { echo "public HTML is out of date: commit make build" >&2; exit 1; }
	@sh scripts/check.sh
	@python3 scripts/check-content.py
	@node scripts/check-waitlist.mjs

check-browser:
	@python3 scripts/browser-check.py
	@python3 scripts/check-waitlist-browser.py

# The Worker that hands the pages over in the right language and money, with the
# site as static assets. Needs network: npx fetches wrangler.
edge:
	@npx --yes wrangler@latest dev --port 8789 --ip 127.0.0.1

i18n:
	@python3 scripts/i18n.py

# make default-lang lang=en — the site in another language, and that
# language the one it is written in. Regenerates and checks after.
default-lang:
	@python3 scripts/default-lang.py $(lang)
	@$(MAKE) -s build
	@$(MAKE) -s i18n
	@$(MAKE) -s check

og:
	@python3 scripts/og.py

# Try the waitlist against the real list, with the two secrets in .env. Sends
# one real confirmation email and leaves one contact in Brevo.
# make test-waitlist email=tu@correo.com
test-waitlist:
	@node --env-file=.env scripts/test-waitlist.mjs $(email)

.PHONY: install build serve check check-browser edge i18n default-lang og test-waitlist
