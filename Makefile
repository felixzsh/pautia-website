# Pautia landing page. No build step and no dependencies: it is served as it is
# written, and checked with greps. The browser check is a developer tool and
# needs playwright, which the page itself never does.

serve:
	python3 -m http.server -d public 8080

check:
	@sh scripts/check.sh

check-browser:
	@python3 scripts/browser-check.py

og:
	@python3 scripts/og.py

.PHONY: serve check check-browser og
