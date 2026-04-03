/**
 * 代码块渲染器
 */

import type { Block, LayoutConfig } from '../../types'
import type { Theme } from '../../config/themes'
import { getFontString } from '../utils/fonts'
import { getContentRect, getAvailableHeight, needsNewPage } from '../utils/layout'
import { renderTextLine, renderCodeBlock } from '../utils/canvas'
import { CODE_PADDING } from '../../config/constants'
import { highlight, getTokenColor, type Token } from '../utils/syntax-highlighter'

interface CodeLine {
  text: string
  width: number
  tokens?: Token[]
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

  // 语法高亮
  const tokens = highlight(block.content, block.language)
  
  // 预计算所有行（带语法高亮信息）
  const allLines = calculateCodeLinesWithHighlight(tokens, font, codeContentWidth)
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
      const x = contentRect.x + CODE_PADDING.x
      
      // 如果有语法高亮token，使用彩色渲染
      if (line.tokens && line.tokens.length > 0) {
        renderColoredTokens(ctx, line.tokens, x, y + codeLineHeight * 0.75, font, theme.codeBg === '#1e293b')
      } else {
        renderTextLine(ctx, line.text, x, y + codeLineHeight * 0.75, theme.codeText, font)
      }
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
 * 计算带语法高亮的代码行
 */
function calculateCodeLinesWithHighlight(
  tokens: Token[],
  font: string,
  maxWidth: number
): CodeLine[] {
  const lines: CodeLine[] = []
  let currentLineTokens: Token[] = []
  let currentLineWidth = 0
  
  // 创建临时 canvas 用于测量
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  ctx.font = font
  
  const flushLine = () => {
    if (currentLineTokens.length > 0) {
      lines.push({
        text: currentLineTokens.map(t => t.text).join(''),
        width: currentLineWidth,
        tokens: [...currentLineTokens]
      })
      currentLineTokens = []
      currentLineWidth = 0
    }
  }
  
  for (const token of tokens) {
    const tokenLines = token.text.split('\n')
    
    for (let i = 0; i < tokenLines.length; i++) {
      if (i > 0) {
        // 遇到换行符，结束当前行
        flushLine()
      }
      
      const text = tokenLines[i]
      if (!text) continue
      
      const textWidth = ctx.measureText(text).width
      
      // 检查是否需要换行
      if (currentLineWidth + textWidth > maxWidth && currentLineWidth > 0) {
        flushLine()
      }
      
      // 处理长文本自动换行
      if (textWidth > maxWidth) {
        let start = 0
        while (start < text.length) {
          let end = text.length
          while (end > start) {
            const subText = text.slice(start, end)
            const subWidth = ctx.measureText(subText).width
            if (subWidth <= maxWidth) {
              currentLineTokens.push({ type: token.type, text: subText })
              currentLineWidth += subWidth
              flushLine()
              start = end
              break
            }
            end--
          }
          if (end === start) {
            // 单个字符都放不下，强制添加
            const char = text[start]
            currentLineTokens.push({ type: token.type, text: char })
            currentLineWidth += ctx.measureText(char).width
            flushLine()
            start++
          }
        }
      } else {
        currentLineTokens.push({ type: token.type, text })
        currentLineWidth += textWidth
      }
    }
  }
  
  flushLine()
  return lines
}

/**
 * 渲染彩色标记
 */
function renderColoredTokens(
  ctx: CanvasRenderingContext2D,
  tokens: Token[],
  x: number,
  y: number,
  font: string,
  isDark: boolean
): void {
  ctx.font = font
  ctx.textBaseline = 'alphabetic'
  
  let currentX = x
  for (const token of tokens) {
    ctx.fillStyle = getTokenColor(token.type, isDark)
    ctx.fillText(token.text, currentX, y)
    currentX += ctx.measureText(token.text).width
  }
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

  // 使用语法高亮计算行数
  const tokens = highlight(block.content, block.language)
  const allLines = calculateCodeLinesWithHighlight(tokens, font, codeContentWidth)
  return allLines.length * codeLineHeight + CODE_PADDING.y * 2 + config.lineHeight * 0.4
}
