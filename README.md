# Markdown to Image

A web-based tool to convert Markdown to beautiful images, built on top of [@chenglou/pretext](https://github.com/chenglou/pretext) - a high-performance text layout engine that performs pure arithmetic-based typography without touching the DOM.

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── constants.ts  # Global constants
│   ├── themes.ts     # Color themes (light/dark/sepia)
│   └── sample.ts     # Sample markdown content
├── types/            # TypeScript type definitions
│   └── index.ts      # Core types
├── parser/           # Markdown parsing
│   └── markdown.ts   # Micromark-based parser
├── renderer/         # Canvas rendering
│   ├── index.ts      # Main render orchestrator
│   ├── blocks/       # Block renderers
│   │   ├── heading.ts
│   │   ├── paragraph.ts
│   │   ├── code.ts
│   │   ├── blockquote.ts
│   │   ├── list.ts
│   │   ├── table.ts
│   │   └── horizontal-rule.ts
│   └── utils/        # Rendering utilities
│       ├── fonts.ts
│       ├── layout.ts
│       ├── canvas.ts
│       └── inline-renderer.ts
├── ui/               # UI controls
│   └── controls.ts   # DOM interactions
└── utils/            # Utilities
    └── download.ts   # Image export
```

## Architecture

- **Modular Design**: Each block type has its own renderer for maintainability
- **Type Safety**: Full TypeScript with strict mode
- **Error Handling**: Proper error boundaries and user feedback
- **Performance**: Debounced updates, efficient canvas rendering
- **Memory Safety**: Proper cleanup of resources (URL objects)

## Installation

```bash
bun install
```

## Quick Start

```bash
bun dev
```

Open your browser and navigate to `http://localhost:3000`.

## Preview

<table>
  <tr>
    <td width="33%"><img src="./docs/page-1.png" alt="Page 1" /></td>
    <td width="33%"><img src="./docs/page-2.png" alt="Page 2" /></td>
    <td width="33%"><img src="./docs/page-3.png" alt="Page 3" /></td>
  </tr>
</table>

## Build

```bash
bun run build
```

## Tech Stack

- **Text Layout**: [@chenglou/pretext](https://github.com/chenglou/pretext)
- **Markdown Parser**: [micromark](https://github.com/micromark/micromark)
- **Build Tool**: Vite
- **Runtime**: Bun

## License

MIT
