.PHONY: help install demo dark convert

help:
	@echo "Markdown to Image - Quick Commands"
	@echo ""
	@echo "  make install    - Link globally (use md2img anywhere)"
	@echo "  make demo       - Generate sample output.png"
	@echo "  make dark       - Generate dark theme sample"
	@echo "  make convert    - Convert file (make convert FILE=readme.md)"

install:
	bun link
	@echo "✓ Installed. Use: md2img <file.md>"

demo:
	bun src/cli/index.ts -o output.png
	@echo "✓ Generated: output.png"

dark:
	bun src/cli/index.ts -t dark -o output-dark.png
	@echo "✓ Generated: output-dark.png"

convert:
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make convert FILE=xxx.md"; \
		exit 1; \
	fi
	bun src/cli/index.ts $(FILE) -o $(shell basename $(FILE) .md).png
	@echo "✓ Generated: $(shell basename $(FILE) .md).png"
