/**
 * Markdown to Image Generator
 *
 * Convert Markdown to beautiful images using Canvas
 * Styled with ai_studio_code.css
 */

import {
  prepareWithSegments,
  layoutNextLine,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from '@chenglou/pretext'

import { micromark } from 'micromark'
import { gfm, gfmHtml } from 'micromark-extension-gfm'

// ==================== 配置常量 ====================
const DEFAULT_PAGE_WIDTH = 1080
const DEFAULT_PAGE_HEIGHT = 1440
const PADDING = { top: 100, right: 90, bottom: 100, left: 90 }

const FONTS = {
  body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
  mono: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
}

// 基于 ai_studio_code.css 的颜色方案
const THEMES = {
  light: {
    bg: '#ffffff',
    text: '#2c3e50',
    textHeading: '#1a1a1a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    codeBg: '#1e293b',
    codeText: '#f8fafc',
    inlineCodeBg: '#f3f4f6',
    inlineCodeText: '#eb5757',
    quoteBg: '#f8fafc',
    quoteBorder: '#e2e8f0',
    link: '#3498db',
    accent: '#3498db',
  },
  dark: {
    bg: '#0f172a',
    text: '#e2e8f0',
    textHeading: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#334155',
    codeBg: '#1e293b',
    codeText: '#f8fafc',
    inlineCodeBg: '#1e293b',
    inlineCodeText: '#f472b6',
    quoteBg: '#1e293b',
    quoteBorder: '#475569',
    link: '#60a5fa',
    accent: '#60a5fa',
  },
  sepia: {
    bg: '#f5f0e6',
    text: '#433422',
    textHeading: '#2c2416',
    textMuted: '#8b7355',
    border: '#d4c8b8',
    codeBg: '#2d2a26',
    codeText: '#f5f0e6',
    inlineCodeBg: '#ebe4d6',
    inlineCodeText: '#b45309',
    quoteBg: '#faf8f3',
    quoteBorder: '#d4c8b8',
    link: '#b45309',
    accent: '#b45309',
  },
}

type ThemeKey = keyof typeof THEMES

type InlineElement =
  | { type: 'text'; content: string }
  | { type: 'code'; content: string }
  | { type: 'strong'; content: string }
  | { type: 'em'; content: string }
  | { type: 'link'; content: string; href: string }

type BlockType =
  | 'heading'
  | 'paragraph'
  | 'code'
  | 'blockquote'
  | 'list'
  | 'listItem'
  | 'hr'
  | 'table'
  | 'taskList'

interface Block {
  type: BlockType
  content: string
  inlineElements?: InlineElement[]
  level?: number
  language?: string
  ordered?: boolean
  items?: Array<{ text: string; checked?: boolean }>
  rows?: Array<Array<string>>
}

interface LayoutConfig {
  pageWidth: number
  pageHeight: number
  padding: typeof PADDING
  fontSize: number
  lineHeight: number
  theme: ThemeKey
}

// ==================== DOM 元素 ====================
const editor = document.getElementById('editor') as HTMLTextAreaElement
const previewContainer = document.getElementById('previewContainer') as HTMLDivElement
const charCount = document.getElementById('charCount') as HTMLSpanElement
const btnLoadSample = document.getElementById('btnLoadSample') as HTMLButtonElement
const btnClear = document.getElementById('btnClear') as HTMLButtonElement
const btnDownloadAll = document.getElementById('btnDownloadAll') as HTMLButtonElement
const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement
const fontSizeSelect = document.getElementById('fontSizeSelect') as HTMLSelectElement
const pageWidthInput = document.getElementById('pageWidth') as HTMLInputElement
const pageHeightInput = document.getElementById('pageHeight') as HTMLInputElement

// ==================== Markdown 解析 ====================

function parseMarkdownToBlocks(markdown: string): Block[] {
  const html = micromark(markdown, {
    extensions: [gfm()],
    htmlExtensions: [gfmHtml()],
  })

  const temp = document.createElement('div')
  temp.innerHTML = html

  const blocks: Block[] = []

  function extractBlocks(node: Element) {
    const tagName = node.tagName.toLowerCase()

    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        blocks.push({
          type: 'heading',
          content: node.textContent || '',
          level: parseInt(tagName[1]),
        })
        break

      case 'p': {
        const inlineElements = extractInlineElements(node)
        blocks.push({
          type: 'paragraph',
          content: node.textContent || '',
          inlineElements,
        })
        break
      }

      case 'pre':
        const code = node.querySelector('code')
        const lang = code?.className?.match(/language-(\w+)/)?.[1] || ''
        blocks.push({
          type: 'code',
          content: code?.textContent || node.textContent || '',
          language: lang,
        })
        break

      case 'blockquote':
        blocks.push({
          type: 'blockquote',
          content: node.textContent || '',
        })
        break

      case 'ul':
      case 'ol':
        const items: Array<{ text: string; checked?: boolean }> = []
        node.querySelectorAll('li').forEach(li => {
          const checkbox = li.querySelector('input[type="checkbox"]')
          if (checkbox) {
            items.push({
              text: li.textContent?.replace(/^\s*\[.?\]\s*/, '') || '',
              checked: (checkbox as HTMLInputElement).checked,
            })
          } else {
            items.push({ text: li.textContent || '' })
          }
        })
        blocks.push({
          type: items.some(i => i.checked !== undefined) ? 'taskList' : 'list',
          content: '',
          ordered: tagName === 'ol',
          items,
        })
        break

      case 'hr':
        blocks.push({ type: 'hr', content: '' })
        break

      case 'table':
        const rows: Array<Array<string>> = []
        node.querySelectorAll('tr').forEach(tr => {
          const cells: string[] = []
          tr.querySelectorAll('td, th').forEach(cell => {
            cells.push(cell.textContent || '')
          })
          if (cells.length) rows.push(cells)
        })
        blocks.push({ type: 'table', content: '', rows })
        break

      case 'div':
      case 'section':
      case 'article':
        Array.from(node.children).forEach(child => extractBlocks(child))
        break

      default:
        if (node.textContent?.trim()) {
          blocks.push({
            type: 'paragraph',
            content: node.textContent,
          })
        }
    }
  }

  Array.from(temp.children).forEach(child => extractBlocks(child))

  return blocks
}

function extractInlineElements(node: Element): InlineElement[] {
  const elements: InlineElement[] = []

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      if (text && !/^\s*$/.test(text)) {
        elements.push({ type: 'text', content: text })
      } else if (text && elements.length > 0) {
        elements.push({ type: 'text', content: ' ' })
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      const tagName = el.tagName.toLowerCase()

      switch (tagName) {
        case 'code':
          elements.push({ type: 'code', content: el.textContent || '' })
          break
        case 'strong':
        case 'b':
          elements.push({ type: 'strong', content: el.textContent || '' })
          break
        case 'em':
        case 'i':
          elements.push({ type: 'em', content: el.textContent || '' })
          break
        case 'a':
          elements.push({
            type: 'link',
            content: el.textContent || '',
            href: el.getAttribute('href') || ''
          })
          break
        default:
          el.childNodes.forEach(child => walk(child))
      }
    }
  }

  node.childNodes.forEach(child => walk(child))
  return elements
}

// ==================== 字体与样式 ====================

function getFontString(config: LayoutConfig, type: 'body' | 'heading' | 'code' | 'inlineCode' | 'small' = 'body', level = 1): string {
  const { fontSize } = config

  switch (type) {
    case 'heading':
      const sizes = [
        fontSize * 1.85,
        fontSize * 1.55,
        fontSize * 1.25,
        fontSize * 1.1,
        fontSize * 1.05,
        fontSize,
      ]
      return `600 ${sizes[level - 1]}px ${FONTS.body}`
    case 'code':
      return `${Math.round(fontSize * 0.9)}px ${FONTS.mono}`
    case 'inlineCode':
      return `${Math.round(fontSize * 0.875)}px ${FONTS.mono}`
    case 'small':
      return `${Math.round(fontSize * 0.875)}px ${FONTS.body}`
    default:
      return `${Math.round(fontSize)}px ${FONTS.body}`
  }
}

function prepareText(text: string, font: string, preserveWhitespace = false): PreparedTextWithSegments {
  return prepareWithSegments(text, font, preserveWhitespace ? { whiteSpace: 'pre-wrap' } : undefined)
}

function getContentRect(config: LayoutConfig) {
  const { pageWidth, pageHeight, padding } = config
  return {
    x: padding.left,
    y: padding.top,
    width: pageWidth - padding.left - padding.right,
    height: pageHeight - padding.top - padding.bottom,
  }
}

function layoutColumn(
  prepared: PreparedTextWithSegments,
  startCursor: LayoutCursor,
  config: LayoutConfig,
  yStart: number,
  availableHeight: number,
  isCode = false,
) {
  const contentRect = getContentRect(config)
  const lineHeight = isCode ? config.lineHeight * 0.95 : config.lineHeight

  let cursor: LayoutCursor = startCursor
  let lineTop = yStart
  const lines: Array<{ x: number; y: number; text: string; width: number }> = []

  while (true) {
    if (lineTop + lineHeight > yStart + availableHeight) break

    const line = layoutNextLine(prepared, cursor, contentRect.width)
    if (line === null) break

    lines.push({
      x: contentRect.x,
      y: lineTop,
      text: line.text,
      width: line.width,
    })

    cursor = line.end
    lineTop += lineHeight
  }

  return { lines, cursor, finalY: lineTop }
}

function hasMoreText(prepared: PreparedTextWithSegments, cursor: LayoutCursor): boolean {
  return cursor.segmentIndex < prepared.segments.length - 1 ||
    (cursor.segmentIndex === prepared.segments.length - 1 &&
     cursor.graphemeIndex < prepared.segments[cursor.segmentIndex]?.length)
}

// ==================== Canvas 渲染 ====================

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.className = 'page-canvas'
  canvas.style.width = `${width * 0.35}px`
  canvas.style.height = `${height * 0.35}px`

  const ctx = canvas.getContext('2d')!
  return { canvas, ctx }
}

function renderBackground(ctx: CanvasRenderingContext2D, config: LayoutConfig) {
  const theme = THEMES[config.theme]
  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, config.pageWidth, config.pageHeight)
}

function renderTextLine(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, font: string) {
  ctx.fillStyle = color
  ctx.font = font
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, x, y)
}

function renderBlockQuote(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, theme: typeof THEMES.light) {
  ctx.fillStyle = theme.quoteBg
  ctx.fillRect(x, y, width, height)
  ctx.fillStyle = theme.quoteBorder
  ctx.fillRect(x, y, 4, height)
}

function renderCodeBlock(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, theme: typeof THEMES.light) {
  ctx.fillStyle = theme.codeBg
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, 8)
  ctx.fill()
}

function renderHorizontalRule(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, theme: typeof THEMES.light) {
  ctx.strokeStyle = theme.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + width, y)
  ctx.stroke()
}

// ==================== 主渲染逻辑 ====================

async function renderToPages(markdown: string, config: LayoutConfig): Promise<HTMLCanvasElement[]> {
  const blocks = parseMarkdownToBlocks(markdown)
  const pages: HTMLCanvasElement[] = []
  const theme = THEMES[config.theme]

  let currentCanvas: HTMLCanvasElement | null = null
  let currentCtx: CanvasRenderingContext2D | null = null
  let currentY = config.padding.top

  function startNewPage() {
    const { canvas, ctx } = createCanvas(config.pageWidth, config.pageHeight)
    renderBackground(ctx, config)

    ctx.fillStyle = theme.textMuted
    ctx.font = `12px ${FONTS.body}`
    ctx.textAlign = 'right'
    ctx.fillText(`- ${pages.length + 1} -`, config.pageWidth - config.padding.right, config.pageHeight - 40)
    ctx.textAlign = 'left'

    pages.push(canvas)
    currentCanvas = canvas
    currentCtx = ctx
    currentY = config.padding.top

    return { ctx, y: currentY }
  }

  let { ctx } = startNewPage()
  const contentRect = getContentRect(config)

  for (const block of blocks) {
    const availableHeight = config.pageHeight - config.padding.bottom - currentY

    switch (block.type) {
      case 'heading': {
        const level = block.level || 1
        const font = getFontString(config, 'heading', level)
        const prepared = prepareText(block.content, font)
        const lineHeight = config.lineHeight * (1.6 - level * 0.1)

        const estimatedHeight = lineHeight * 2
        if (availableHeight < estimatedHeight && currentY > config.padding.top + 50) {
          const next = startNewPage()
          ctx = next.ctx
          currentY = next.y
        }

        const result = layoutColumn(prepared, { segmentIndex: 0, graphemeIndex: 0 }, config, currentY, availableHeight)

        for (const line of result.lines) {
          renderTextLine(ctx, line.text, line.x, line.y + lineHeight * 0.8, theme.textHeading, font)
        }

        currentY = result.finalY + lineHeight * 0.6
        break
      }

      case 'paragraph': {
        const font = getFontString(config, 'body')
        const codeFont = getFontString(config, 'inlineCode')
        const boldFont = font.replace(/400|500/, '600')
        const italicFont = font.replace('400', '400 italic')

        const fragments: Array<{ text: string; style: 'normal' | 'code' | 'strong' | 'em' | 'link'; width: number }> = []

        if (block.inlineElements && block.inlineElements.length > 0) {
          for (const el of block.inlineElements) {
            let text = el.content
            let style: typeof fragments[0]['style']
            switch (el.type) {
              case 'code': style = 'code'; break
              case 'strong': style = 'strong'; break
              case 'em': style = 'em'; break
              case 'link': style = 'link'; break
              default: style = 'normal'
            }
            ctx.font = style === 'code' ? codeFont : (style === 'strong' ? boldFont : (style === 'em' ? italicFont : font))
            const width = ctx.measureText(text).width
            fragments.push({ text, style, width })
          }
        } else {
          ctx.font = font
          const width = ctx.measureText(block.content).width
          fragments.push({ text: block.content, style: 'normal', width })
        }

        type Atom = { text: string; style: typeof fragments[0]['style']; width: number; isGlue: boolean }
        const atoms: Atom[] = []

        for (const frag of fragments) {
          if (frag.style === 'normal') {
            const parts = frag.text.split(/(\s+)/)
            for (const part of parts) {
              if (!part) continue
              ctx.font = font
              atoms.push({
                text: part,
                style: 'normal',
                width: ctx.measureText(part).width,
                isGlue: /^\s+$/.test(part)
              })
            }
          } else {
            ctx.font = frag.style === 'code' ? codeFont : (frag.style === 'strong' ? boldFont : (frag.style === 'em' ? italicFont : font))
            atoms.push({
              text: frag.text,
              style: frag.style,
              width: ctx.measureText(frag.text).width,
              isGlue: false
            })
          }
        }

        let atomIndex = 0
        while (atomIndex < atoms.length) {
          const availableH = config.pageHeight - config.padding.bottom - currentY
          if (availableH < config.lineHeight) {
            const next = startNewPage()
            ctx = next.ctx
            currentY = next.y
            continue
          }

          const lineAtoms: Atom[] = []
          let lineWidth = 0
          const maxWidth = contentRect.width

          while (atomIndex < atoms.length && atoms[atomIndex]!.isGlue) {
            atomIndex++
          }

          while (atomIndex < atoms.length) {
            const atom = atoms[atomIndex]!

            if (lineWidth + atom.width > maxWidth && lineAtoms.length > 0) {
              break
            }

            lineAtoms.push(atom)
            lineWidth += atom.width
            atomIndex++

            if (atom.isGlue && atomIndex < atoms.length) {
              const nextAtom = atoms[atomIndex]!
              if (lineWidth + nextAtom.width > maxWidth) {
                lineAtoms.pop()
                lineWidth -= atom.width
                break
              }
            }
          }

          if (lineAtoms.length === 0) {
            if (atomIndex < atoms.length) {
              lineAtoms.push(atoms[atomIndex]!)
              atomIndex++
            } else {
              break
            }
          }

          while (lineAtoms.length > 0 && lineAtoms[lineAtoms.length - 1]!.isGlue) {
            const removed = lineAtoms.pop()!
            lineWidth -= removed.width
          }

          const lineY = currentY + config.lineHeight * 0.75
          let x = contentRect.x

          for (const atom of lineAtoms) {
            switch (atom.style) {
              case 'code': {
                const inlineFontSize = config.fontSize * 0.875
                const bgPaddingX = 4
                const bgPaddingY = 3
                const bgY = lineY - inlineFontSize * 0.75 - bgPaddingY

                ctx.fillStyle = theme.inlineCodeBg
                ctx.beginPath()
                ctx.roundRect(x - bgPaddingX, bgY, atom.width + bgPaddingX * 2, inlineFontSize + bgPaddingY * 2, 4)
                ctx.fill()

                ctx.font = codeFont
                ctx.fillStyle = theme.inlineCodeText
                ctx.fillText(atom.text, x, lineY)
                break
              }
              case 'strong': {
                ctx.font = boldFont
                ctx.fillStyle = theme.text
                ctx.fillText(atom.text, x, lineY)
                break
              }
              case 'em': {
                ctx.font = italicFont
                ctx.fillStyle = theme.text
                ctx.fillText(atom.text, x, lineY)
                break
              }
              case 'link': {
                ctx.font = font
                ctx.fillStyle = theme.link
                ctx.fillText(atom.text, x, lineY)
                ctx.strokeStyle = theme.link
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(x, lineY + 3)
                ctx.lineTo(x + atom.width, lineY + 3)
                ctx.stroke()
                break
              }
              default: {
                ctx.font = font
                ctx.fillStyle = theme.text
                ctx.fillText(atom.text, x, lineY)
              }
            }
            x += atom.width
          }

          currentY += config.lineHeight
        }

        currentY += config.lineHeight * 0.5
        break
      }

      case 'blockquote': {
        const font = getFontString(config, 'body')
        const prepared = prepareText(block.content, font)
        const quoteStartY = currentY
        let hasRenderedQuote = false

        let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }

        while (hasMoreText(prepared, cursor)) {
          const availableH = config.pageHeight - config.padding.bottom - currentY

          if (availableH < config.lineHeight) {
            if (hasRenderedQuote) {
              renderBlockQuote(ctx, contentRect.x + 24, quoteStartY, contentRect.width - 48, currentY - quoteStartY, theme)
            }
            const next = startNewPage()
            ctx = next.ctx
            currentY = next.y
            hasRenderedQuote = false
            continue
          }

          const result = layoutColumn(prepared, cursor, {
            ...config,
            padding: { ...config.padding, left: config.padding.left + 48 },
          }, currentY, availableH)

          for (const line of result.lines) {
            renderTextLine(ctx, line.text, line.x + 24, line.y + config.lineHeight * 0.75, theme.textMuted, font)
          }

          hasRenderedQuote = true
          cursor = result.cursor
          currentY = result.finalY
        }

        renderBlockQuote(ctx, contentRect.x + 24, quoteStartY, contentRect.width - 48, currentY - quoteStartY + 4, theme)
        currentY += config.lineHeight * 0.6
        break
      }

      case 'code': {
        const font = getFontString(config, 'code')
        const codePadding = { x: 28, y: 24 }
        const codeLineHeight = config.lineHeight * 0.9
        const codeContentWidth = contentRect.width - codePadding.x * 2

        const prepared = prepareText(block.content, font, true)

        const allLines: Array<{ text: string; width: number }> = []
        let tempCursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
        while (hasMoreText(prepared, tempCursor)) {
          const line = layoutNextLine(prepared, tempCursor, codeContentWidth)
          if (!line) break
          allLines.push({ text: line.text, width: line.width })
          tempCursor = line.end
        }

        const totalHeight = allLines.length * codeLineHeight + codePadding.y * 2
        if (totalHeight > availableHeight && currentY > config.padding.top + 50) {
          const next = startNewPage()
          ctx = next.ctx
          currentY = next.y
        }

        let lineIndex = 0
        while (lineIndex < allLines.length) {
          const blockStartY = currentY
          const blockPadding = 8

          const pageAvailableHeight = config.pageHeight - config.padding.bottom - currentY - codePadding.y * 2
          const linesPerPage = Math.max(1, Math.floor(pageAvailableHeight / codeLineHeight))
          const pageLines = allLines.slice(lineIndex, lineIndex + linesPerPage)

          if (pageLines.length === 0) {
            const next = startNewPage()
            ctx = next.ctx
            currentY = next.y
            continue
          }

          const pageHeight = pageLines.length * codeLineHeight + codePadding.y * 2

          renderCodeBlock(ctx, contentRect.x + blockPadding, blockStartY, contentRect.width - blockPadding * 2, pageHeight, theme)

          for (let i = 0; i < pageLines.length; i++) {
            const line = pageLines[i]
            const y = blockStartY + codePadding.y + i * codeLineHeight
            renderTextLine(ctx, line.text, contentRect.x + codePadding.x, y + codeLineHeight * 0.75, theme.codeText, font)
          }

          lineIndex += pageLines.length
          currentY = blockStartY + pageHeight

          if (lineIndex < allLines.length) {
            const next = startNewPage()
            ctx = next.ctx
            currentY = next.y
          }
        }

        currentY += config.lineHeight * 0.4
        break
      }

      case 'list':
      case 'taskList': {
        const font = getFontString(config, 'body')
        const items = block.items || []
        const bulletWidth = 36
        const isTask = block.type === 'taskList'

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const bullet = isTask
            ? (item.checked ? '☑' : '☐')
            : (block.ordered ? `${i + 1}.` : '•')
          const prepared = prepareText(item.text, font)

          if (config.pageHeight - config.padding.bottom - currentY < config.lineHeight * 2) {
            const next = startNewPage()
            ctx = next.ctx
            currentY = next.y
          }

          ctx.fillStyle = isTask ? theme.textMuted : theme.accent
          ctx.font = font
          const bulletX = isTask ? contentRect.x : contentRect.x + 4
          ctx.fillText(bullet, bulletX, currentY + config.lineHeight * 0.75)

          let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
          let isFirstLine = true

          while (hasMoreText(prepared, cursor)) {
            const availableH = config.pageHeight - config.padding.bottom - currentY

            if (availableH < config.lineHeight) {
              const next = startNewPage()
              ctx = next.ctx
              currentY = next.y
              isFirstLine = true
              continue
            }

            const result = layoutColumn(prepared, cursor, {
              ...config,
              padding: { ...config.padding, left: config.padding.left + bulletWidth },
            }, currentY, availableH)

            for (const line of result.lines) {
              const x = isFirstLine ? line.x + bulletWidth - 8 : line.x + bulletWidth
              renderTextLine(ctx, line.text, x, line.y + config.lineHeight * 0.75, theme.text, font)
              isFirstLine = false
            }

            cursor = result.cursor
            currentY = result.finalY
          }

          currentY += config.lineHeight * 0.15
        }

        currentY += config.lineHeight * 0.4
        break
      }

      case 'table': {
        if (!block.rows || block.rows.length === 0) break

        const font = getFontString(config, 'body')
        const smallFont = getFontString(config, 'small')
        const rows = block.rows
        const colCount = rows[0]?.length || 1
        const colWidth = (contentRect.width - 32) / colCount

        ctx.fillStyle = theme.quoteBg
        ctx.fillRect(contentRect.x, currentY, contentRect.width, config.lineHeight * 1.2)

        ctx.fillStyle = theme.textHeading
        ctx.font = smallFont
        rows[0].forEach((cell, idx) => {
          ctx.fillText(cell.slice(0, 20), contentRect.x + 16 + idx * colWidth, currentY + config.lineHeight * 0.8)
        })

        currentY += config.lineHeight * 1.2

        ctx.strokeStyle = theme.border
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(contentRect.x, currentY - 4)
        ctx.lineTo(contentRect.x + contentRect.width, currentY - 4)
        ctx.stroke()

        ctx.fillStyle = theme.text
        ctx.font = smallFont
        for (let i = 1; i < rows.length && i < 10; i++) {
          rows[i].forEach((cell, idx) => {
            ctx.fillText(cell.slice(0, 20), contentRect.x + 16 + idx * colWidth, currentY + config.lineHeight * 0.8)
          })

          ctx.strokeStyle = theme.border
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(contentRect.x, currentY + config.lineHeight - 4)
          ctx.lineTo(contentRect.x + contentRect.width, currentY + config.lineHeight - 4)
          ctx.stroke()

          currentY += config.lineHeight * 1.1
        }

        currentY += config.lineHeight * 0.3
        break
      }

      case 'hr': {
        if (availableHeight < 50) {
          const next = startNewPage()
          ctx = next.ctx
          currentY = next.y
        }

        renderHorizontalRule(ctx, contentRect.x, currentY + 25, contentRect.width, theme)
        currentY += 50
        break
      }
    }
  }

  return pages
}

// ==================== UI 控制 ====================

const SAMPLE_MARKDOWN = `# Markdown to Image

Convert your Markdown to beautiful images with **customizable themes** and *perfect typography*.

## Features

- Clean, readable output
- Multiple themes: light, dark, sepia
- Code blocks with syntax highlighting
- Support for lists, quotes, and tables

## Code Example

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

> "Simplicity is the ultimate sophistication"

---

Made with ❤️ using Canvas`

let currentCanvases: HTMLCanvasElement[] = []
let debounceTimer: number | null = null

function updatePreview() {
  const markdown = editor.value
  charCount.textContent = `${markdown.length} chars`

  if (!markdown.trim()) {
    previewContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <p>Enter Markdown on the left<br>Images will be generated automatically</p>
      </div>
    `
    currentCanvases = []
    return
  }

  const config: LayoutConfig = {
    pageWidth: parseInt(pageWidthInput.value) || DEFAULT_PAGE_WIDTH,
    pageHeight: parseInt(pageHeightInput.value) || DEFAULT_PAGE_HEIGHT,
    padding: PADDING,
    fontSize: parseInt(fontSizeSelect.value) || 34,
    lineHeight: (parseInt(fontSizeSelect.value) || 34) * 1.6,
    theme: themeSelect.value as ThemeKey,
  }

  previewContainer.innerHTML = '<div class="loading"><div class="spinner"></div>Rendering...</div>'

  requestAnimationFrame(() => {
    renderToPages(markdown, config).then(canvases => {
      currentCanvases = canvases
      previewContainer.innerHTML = ''

      canvases.forEach((canvas, index) => {
        const wrapper = document.createElement('div')
        wrapper.className = 'page-card'

        const label = document.createElement('div')
        label.className = 'page-label'
        label.textContent = `Page ${index + 1}`

        wrapper.appendChild(label)
        wrapper.appendChild(canvas)
        previewContainer.appendChild(wrapper)
      })
    })
  })
}

function debouncedUpdate() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(updatePreview, 300)
}

// Event bindings
editor.addEventListener('input', () => {
  charCount.textContent = `${editor.value.length} chars`
})

editor.addEventListener('input', debouncedUpdate)

themeSelect.addEventListener('change', updatePreview)
fontSizeSelect.addEventListener('change', updatePreview)
pageWidthInput.addEventListener('change', updatePreview)
pageHeightInput.addEventListener('change', updatePreview)

btnLoadSample.addEventListener('click', () => {
  editor.value = SAMPLE_MARKDOWN
  charCount.textContent = `${editor.value.length} chars`
  updatePreview()
})

btnClear.addEventListener('click', () => {
  editor.value = ''
  charCount.textContent = '0 chars'
  updatePreview()
})

btnDownloadAll.addEventListener('click', async () => {
  if (currentCanvases.length === 0) return

  for (let i = 0; i < currentCanvases.length; i++) {
    const canvas = currentCanvases[i]
    const link = document.createElement('a')
    link.download = `page-${i + 1}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    if (i < currentCanvases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
})

// Initialize
charCount.textContent = `${editor.value.length} chars`
updatePreview()
