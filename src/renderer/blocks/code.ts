/**
 * 代码块渲染器
 */

import type { Block, LayoutConfig } from '../../types'
import type { Theme } from '../../config/themes'
import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext'
import { getFontString, prepareText, hasMoreText } from '../utils/fonts'
import { getContentRect, getAvailableHeight, needsNewPage } from '../utils/layout'
import { renderTextLine, renderCodeBlock } from '../utils/canvas'
import { CODE_PADDING } from '../../config/constants'

interface CodeLine {
  text: string
  width: number
}

/**
 * 渲染代码块
 */
export function renderCode(
  ctx: CanvasRenderingContext2D,
  block: Block,
  config: LayoutConfig,
  theme: Theme,
  currentY: number,
  startNewPage: () => { ctx: CanvasRenderingContext2D; y: number }
): { ctx: CanvasRenderingContext2D; currentY: number } {
  const font = getFontString(config, 'code')
  const contentRect = getContentRect(config)
  const codeLineHeight = config.lineHeight * 0.9
  const codeContentWidth = contentRect.width - CODE_PADDING.x * 2

  // 预计算所有行
  const allLines = calculateCodeLines(block.content, font, codeContentWidth)
  const totalHeight = allLines.length * codeLineHeight + CODE_PADDING.y * 2

  // 检查是否需要新页面
  if (needsNewPage(config, currentY, totalHeight)) {
    const next = startNewPage()
    ctx = next.ctx
    currentY = next.y
  }

  // 分页渲染
  let lineIndex = 0
  while (lineIndex < allLines.length) {
    const blockStartY = currentY
    const pageAvailableHeight = getAvailableHeight(config, currentY) - CODE_PADDING.y * 2
    const linesPerPage = Math.max(1, Math.floor(pageAvailableHeight / codeLineHeight))
    const pageLines = allLines.slice(lineIndex, lineIndex + linesPerPage)

    if (pageLines.length === 0) {
      const next = startNewPage()
      ctx = next.ctx
      currentY = next.y
      continue
    }

    const pageHeight = pageLines.length * codeLineHeight + CODE_PADDING.y * 2
    const blockPadding = 8

    renderCodeBlock(
      ctx,
      contentRect.x + blockPadding,
      blockStartY,
      contentRect.width - blockPadding * 2,
      pageHeight,
      theme
    )

    for (let i = 0; i < pageLines.length; i++) {
      const line = pageLines[i]
      if (!line) continue
      const y = blockStartY + CODE_PADDING.y + i * codeLineHeight
      renderTextLine(ctx, line.text, contentRect.x + CODE_PADDING.x, y + codeLineHeight * 0.75, theme.codeText, font)
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

  return { ctx, currentY }
}

/**
 * 计算代码行
 */
function calculateCodeLines(
  content: string,
  font: string,
  maxWidth: number
): CodeLine[] {
  const prepared = prepareWithSegments(content, font, { whiteSpace: 'pre-wrap' })

  const lines: CodeLine[] = []
  let cursor: { segmentIndex: number; graphemeIndex: number } = { segmentIndex: 0, graphemeIndex: 0 }

  while (hasMoreText(prepared, cursor)) {
    const line = layoutNextLine(prepared, cursor, maxWidth)
    if (!line) break

    lines.push({ text: line.text, width: line.width })
    cursor = line.end
  }

  return lines
}

/**
 * 计算代码块所需高度
 */
export function measureCode(
  block: Block,
  config: LayoutConfig,
  ctx: CanvasRenderingContext2D
): number {
  const font = getFontString(config, 'code')
  const contentRect = getContentRect(config)
  const codeLineHeight = config.lineHeight * 0.9
  const codeContentWidth = contentRect.width - CODE_PADDING.x * 2

  const allLines = calculateCodeLines(block.content, font, codeContentWidth)
  return allLines.length * codeLineHeight + CODE_PADDING.y * 2 + config.lineHeight * 0.4
}
