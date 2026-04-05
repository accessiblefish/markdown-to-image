# Markdown to Image

Convert Markdown to beautiful images. No browser required.

**Web UI + CLI** · **Three themes** · **Code highlighting** · **Multi-page export**

![Bun](https://img.shields.io/badge/Bun-1.0%2B-black?logo=bun)

<table>
  <tr>
    <td width="33%"><img src="./docs/page-1.png" /></td>
    <td width="33%"><img src="./docs/page-2.png" /></td>
    <td width="33%"><img src="./docs/page-3.png" /></td>
  </tr>
</table>


## Quick Start

```bash
# 1. Install
bun install

# 2. CLI - Convert your markdown
bun src/cli/index.ts input.md -o output.png

# 3. Or run Web UI
bun dev
```

That's it. Open `output.png` or visit `http://localhost:3000`.

## Usage

### CLI

```bash
# Use built-in sample
bun src/cli/index.ts -o output.png

# Your own file
bun src/cli/index.ts README.md -o readme.png

# Dark theme, JPG format
bun src/cli/index.ts doc.md -t dark -F jpg -o doc.jpg
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `-o, --output` | Output path | `markdown-to-image.png` |
| `-t, --theme` | light / dark / sepia | light |
| `-W, --width` | Page width (px) | 1080 |
| `-H, --height` | Page height (px) | 1440 |
| `-f, --font-size` | Base font size | 34 |
| `-F, --format` | png / jpg / webp | png |

Global install: `bun link` then `md2img file.md`

### Web UI

```bash
bun dev        # Development
bun run build  # Production build
```

---

## Features

- ✨ **Clean typography** - Powered by [Pretext](https://github.com/chenglou/pretext) layout engine
- 🎨 **Three themes** - Light, Dark, Sepia
- 💻 **Code blocks** - Syntax highlighting
- ☑️ **Task lists** - Checkboxes render correctly
- 📊 **Tables** - Full markdown table support
- 📄 **Multi-page** - Automatic pagination for long content
- 🖥️ **Web + CLI** - Use in browser or command line

## Tech Stack

- **Runtime:** [Bun](https://bun.sh) 1.0+
- **Layout:** Pretext
- **Parser:** micromark + GFM
- **Canvas:** skia-canvas
- **Build:** Vite

## Project Structure

```
src/
├── cli/           # CLI tool
├── shared/        # Core renderer (used by Web & CLI)
├── config/sample.ts   # Default markdown content
└── (web files)
```

## License

MIT
