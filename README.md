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
# Install
bun install

# Method 1: Direct script (easiest)
./md2img input.md -o output.png

# Method 2: Global install
bun link
md2img input.md -o output.png

# Method 3: Make commands
make demo           # Generate sample
make convert FILE=readme.md   # Convert file

# Web UI
bun dev
```

That's it. Open `output.png` or visit `http://localhost:3000`.

## Usage

### CLI

```bash
# Use built-in sample (3 pages)
./md2img

# Your own file
./md2img README.md -o readme.png

# Dark theme, JPG format
./md2img doc.md -t dark -F jpg -o doc.jpg

# After "bun link", use anywhere
md2img file.md
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
