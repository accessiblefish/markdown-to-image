/**
 * 引用块渲染器
 */

import type { Block, LayoutConfig } from '../../types'
import type { Theme } from '../../config/themes'
import { getFontString } from '../utils/fonts'
import { getContentRect, getAvailableHeight, needsNewPage } from '../utils/layout'
import { renderBlockQuote as renderBlockQuoteBackground } from '../utils/canvas'
import { QUOTE_PADDING } from '../../config/constants'

interface QuoteAtom {
  text: string
  style: 'normal' | 'code' | 'strong' | 'em' | 'link'
  width: number
  isGlue: boolean
}

/**
 * 渲染引用块
 */
export function renderBlockQuote(
  ctx: CanvasRenderingContext2D,
  block: Block,
  config: LayoutConfig,
  theme: Theme,
  currentY: number,
  startNewPage: () => { ctx: CanvasRenderingContext2D; y: number }
): { ctx: CanvasRenderingContext2D; currentY: number } {
  const contentRect = getContentRect(config)
  const font = getFontString(config, 'body')
  const quoteContentWidth = contentRect.width - QUOTE_PADDING * 2
  const maxTextWidth = quoteContentWidth - QUOTE_PADDING * 2

  // 构建 atoms（与段落类似但使用 quote 样式）
  const fonts = {
    bodyFont: font,
    codeFont: getFontString(config, 'inlineCode'),
    boldFont: font.replace(/400|500/, '600'),
    italicFont: font.replace('400', '400 italic'),
  }

  // 构建 fragments
  type TextFragment = { text: string; style: QuoteAtom['style']; width: number }
  const fragments: TextFragment[] = []

  const inlineElements = block.inlineElements
  const content = block.content

  if (inlineElements && inlineElements.length > 0) {
    for (const el of inlineElements) {
      let style: TextFragment['style']
      switch (el.type) {
        case 'code': style = 'code'; break
        case 'strong': style = 'strong'; break
        case 'em': style = 'em'; break
        case 'link': style = 'link'; break
        default: style = 'normal'
      }

      ctx.font = style === 'code' ? fonts.codeFont :
                 style === 'strong' ? fonts.boldFont :
                 style === 'em' ? fonts.italicFont : fonts.bodyFont

      fragments.push({ text: el.content, style, width: ctx.measureText(el.content).width })
    }
  } else {
    ctx.font = fonts.bodyFont
    fragments.push({ text: content, style: 'normal', width: ctx.measureText(content).width })
  }

  // 构建 atoms
  const atoms: QuoteAtom[] = []
  for (const frag of fragments) {
    if (frag.style === 'normal') {
      const parts = frag.text.split(/(\s+)/)
      for (const part of parts) {
        if (!part) continue
        ctx.font = fonts.bodyFont
        atoms.push({
          text: part,
          style: 'normal',
          width: ctx.measureText(part).width,
          isGlue: /^\s+$/.test(part)
        })
      }
    } else {
      ctx.font = frag.style === 'code' ? fonts.codeFont :
                 frag.style === 'strong' ? fonts.boldFont :
                 frag.style === 'em' ? fonts.italicFont : fonts.bodyFont

      atoms.push({
        text: frag.text,
        style: frag.style,
        width: ctx.measureText(frag.text).width,
        isGlue: false
      })
    }
  }

  // 计算所有行
  const allLines: QuoteAtom[][] = []
  let atomIndex = 0

  while (atomIndex < atoms.length) {
    const lineAtoms: QuoteAtom[] = []
    let lineWidth = 0

    // 跳过开头空白
    while (atomIndex < atoms.length && atoms[atomIndex]?.isGlue) {
      atomIndex++
    }

    while (atomIndex < atoms.length) {
      const atom = atoms[atomIndex]
      if (!atom) break

      if (lineWidth + atom.width > maxTextWidth && lineAtoms.length > 0) {
        break
      }

      lineAtoms.push(atom)
      lineWidth += atom.width
      atomIndex++

      if (atom.isGlue && atomIndex < atoms.length) {
        const nextAtom = atoms[atomIndex]
        if (!nextAtom) break
        if (lineWidth + nextAtom.width > maxTextWidth) {
          lineAtoms.pop()
          break
        }
      }
    }

    if (lineAtoms.length === 0) {
      if (atomIndex < atoms.length) {
        lineAtoms.push(atoms[atomIndex])
        atomIndex++
      } else {
        break
      }
    }

    while (lineAtoms.length > 0 && lineAtoms[lineAtoms.length - 1]?.isGlue) {
      lineAtoms.pop()
    }

    allLines.push(lineAtoms)
  }

  const totalHeight = allLines.length * config.lineHeight + 16

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
    const pageAvailableHeight = getAvailableHeight(config, currentY) - 16
    const linesPerPage = Math.max(1, Math.floor(pageAvailableHeight / config.lineHeight))
    const pageLines = allLines.slice(lineIndex, lineIndex + linesPerPage)

    if (pageLines.length === 0) {
      const next = startNewPage()
      ctx = next.ctx
      currentY = next.y
      continue
    }

    const pageHeight = pageLines.length * config.lineHeight + 16

    // 渲染背景
    renderBlockQuoteBackground(
      ctx,
      contentRect.x + QUOTE_PADDING,
      blockStartY,
      contentRect.width - QUOTE_PADDING * 2,
      pageHeight,
      theme
    )

    // 渲染每一行
    for (let i = 0; i < pageLines.length; i++) {
      const lineAtoms = pageLines[i]
      if (!lineAtoms) continue

      const y = blockStartY + 8 + i * config.lineHeight
      let x = contentRect.x + QUOTE_PADDING * 2

      for (const atom of lineAtoms) {
        renderQuoteAtom(ctx, atom, x, y + config.lineHeight * 0.75, theme, fonts, config)
        x += atom.width
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
 * 渲染引用块内的 atom
 */
function renderQuoteAtom(
  ctx: CanvasRenderingContext2D,
  atom: QuoteAtom,
  x: number,
  y: number,
  theme: Theme,
  fonts: { bodyFont: string; codeFont: string; boldFont: string; italicFont: string },
  config: LayoutConfig
): void {
  switch (atom.style) {
    case 'code': {
      const inlineFontSize = config.fontSize * 0.875
      const bgPaddingX = 4
      const bgPaddingY = 3
      const bgY = y - inlineFontSize * 0.75 - bgPaddingY

      ctx.fillStyle = theme.inlineCodeBg
      ctx.beginPath()
      ctx.roundRect(x - bgPaddingX, bgY, atom.width + bgPaddingX * 2, inlineFontSize + bgPaddingY * 2, 4)
      ctx.fill()

      ctx.font = fonts.codeFont
      ctx.fillStyle = theme.inlineCodeText
      ctx.fillText(atom.text, x, y)
      break
    }
    case 'strong': {
      ctx.font = fonts.boldFont
      ctx.fillStyle = theme.textMuted
      ctx.fillText(atom.text, x, y)
      break
    }
    case 'em': {
      ctx.font = fonts.italicFont
      ctx.fillStyle = theme.textMuted
      ctx.fillText(atom.text, x, y)
      break
    }
    case 'link': {
      ctx.font = fonts.bodyFont
      ctx.fillStyle = theme.link
      ctx.fillText(atom.text, x, y)
      break
    }
    default: {
      ctx.font = fonts.bodyFont
      ctx.fillStyle = theme.textMuted
      ctx.fillText(atom.text, x, y)
    }
  }
}
