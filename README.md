# Markdown to Image

A web-based tool to convert Markdown to beautiful images, built on top of [@chenglou/pretext](https://github.com/chenglou/pretext) - a high-performance text layout engine that performs pure arithmetic-based typography without touching the DOM.

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
