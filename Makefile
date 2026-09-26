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

.PHONY: serve check check-browser i18n default-lang og
