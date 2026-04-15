# Markdown to Image

Convert Markdown to beautiful, social-media-ready images. No browser required.

**Web UI + CLI** · **2 Reading Themes** · **Typography-First** · **Multi-page Export**

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
./md2img input.md              # Auto-named: input.png
./md2img input.md -o out.png   # Custom name

# Method 2: Global install
bun link
md2img input.md

# Method 3: Make commands
make demo                      # Generate sample
make convert FILE=readme.md    # Convert file

# Web UI
bun dev
```

That's it. Open `output.png` or visit `http://localhost:3000`.

## Usage

### CLI

```bash
# Use built-in sample (auto-named: markdown-to-image.png)
./md2img

# Your own file (auto-named: README.png)
./md2img README.md

# Custom output name
./md2img doc.md -o my-doc.png

# Editorial theme (default), JPG format
./md2img doc.md -F jpg

# Other theme
./md2img doc.md -t mint        # Quiet blog-inspired mint

# After "bun link", use anywhere
md2img file.md
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `-o, --output` | Output path (optional) | Based on input filename |
| `-t, --theme` | editorial / mint | editorial |
| `-W, --width` | Page width (px) | 1080 |
| `-H, --height` | Page height (px) | 1440 |
| `-f, --font-size` | Base font size | 30 |
| `-F, --format` | png / jpg / webp | png |

Global install: `bun link` then `md2img file.md`

### Web UI

```bash
bun dev        # Development
bun run build  # Production build
```

---

## Advanced Usage

### Manual Line Breaks in H1

Control exactly where your title breaks:

```markdown
# Harness Engineering<br>系列圆桌

# 第一行标题
第二行标题

# Multi-word<br>Line Break
```

Both `<br>` and actual newlines work. This ensures word groups stay together.

### Theme-Specific Backgrounds

The **Editorial** theme includes a data stream background pattern (vertical mono text). The content area uses a semi-transparent overlay to ensure readability while maintaining the aesthetic.

---

## Themes

### 1. Editorial (Default)
Inspired by editorial design and magazines. Cream background with data stream pattern.
- **Best for:** Long-form articles, essays, professional content
- **Colors:** Warm cream (#F5F0E8) with terracotta accents
- **Font pairing:** Source Han Serif (body) + Source Han Sans (headings)

### 2. Mint
Inspired by calm personal blog templates with a quiet mint-tinted reading surface.
- **Best for:** Blog posts, essays, notes, personal publishing
- **Colors:** Soft mint gray, muted green accents, low-noise page background
- **Feel:** Clean, restrained, and optimized for reading comfort

---

## Features

### Typography
- ✨ **Editorial typography** - Source Han Serif for body, Source Han Sans for headings
- 📐 **Pretext layout engine** - Perfect line breaking for CJK and English text
- 🎯 **H1 titles** - Dedicated full page, centered, with manual line-break support

### Code & Inline Elements
- 💻 **Code blocks** - Syntax highlighting with macOS-style window buttons
- `inline code` - Styled with background, padding, and rounded corners
- 🔗 **Smart links** - Proper spacing and styling

### Visual Design
- 🎨 **Data stream background** - Editorial theme features animated code-rain pattern
- 📐 **Content overlay** - Ensures text readability over decorative backgrounds
- 🖼️ **Decorative elements** - Minimal background treatment with restrained theme accents

### Content Support
- ☑️ **Task lists** - Styled checkboxes
- 📊 **Tables** - Full markdown table support
- 💬 **Blockquotes** - Card-style with decorative quote marks
- 📄 **Multi-page** - Automatic pagination for long content

---

## Tech Stack

- **Runtime:** [Bun](https://bun.sh) 1.0+
- **Typography:** [Pretext](https://github.com/chenglou/pretext) layout engine
- **Fonts:** Source Han Serif SC, Source Han Sans SC
- **Parser:** micromark + GFM
- **Canvas:** skia-canvas
- **Build:** Vite

## Project Structure

```
src/
├── cli/              # CLI tool
├── shared/           # Core renderer (used by Web & CLI)
│   ├── config/themes.ts    # theme definitions
│   ├── renderer/blocks/    # Block renderers (heading, paragraph, code...)
│   └── parser/markdown.ts  # Markdown parser
├── config/sample.ts  # Default markdown content
└── (web files)
```

## License

MIT
