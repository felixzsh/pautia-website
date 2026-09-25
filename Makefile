# Pautia landing page. No build step and no dependencies: it is served as it is
# written, and checked with greps.

serve:
	python3 -m http.server -d public 8080

check:
	@sh scripts/check.sh

.PHONY: serve check
