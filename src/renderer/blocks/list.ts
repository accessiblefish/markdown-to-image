/**
 * 列表渲染器（支持有序/无序/任务列表）
 */

import type { Block, LayoutConfig, ListItem } from '../../types'
import type { Theme } from '../../config/themes'
import { getFontString, prepareText, hasMoreText } from '../utils/fonts'
import { layoutNextLine } from '@chenglou/pretext'
import { getContentRect, getAvailableHeight } from '../utils/layout'
import { BULLET_WIDTH, BULLET_MARGIN } from '../../config/constants'

interface ListAtom {
  text: string
  style: 'normal' | 'code' | 'strong' | 'em' | 'link'
  width: number
  isGlue: boolean
}

/**
 * 渲染列表块
 */
export function renderList(
  ctx: CanvasRenderingContext2D,
  block: Block,
  config: LayoutConfig,
  theme: Theme,
  currentY: number,
  startNewPage: () => { ctx: CanvasRenderingContext2D; y: number }
): { ctx: CanvasRenderingContext2D; currentY: number } {
  const contentRect = getContentRect(config)
  const font = getFontString(config, 'body')
  const codeFont = getFontString(config, 'inlineCode')
  const boldFont = font.replace(/400|500/, '600')
  const italicFont = font.replace('400', '400 italic')

  const items = block.items || []
  const isTask = block.type === 'taskList'
  const listLineHeight = config.lineHeight * 0.85
  const contentStartX = contentRect.x + BULLET_MARGIN + BULLET_WIDTH
  const maxTextWidth = contentRect.width - BULLET_MARGIN - BULLET_WIDTH

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item) continue

    const bullet = isTask
      ? (item.checked ? '☑' : '☐')
      : (block.ordered ? `${i + 1}.` : '•')

    // 检查是否需要新页面
    if (getAvailableHeight(config, currentY) < listLineHeight * 2) {
      const next = startNewPage()
      ctx = next.ctx
      currentY = next.y
    }

    // 绘制符号
    ctx.fillStyle = isTask ? theme.textMuted : theme.accent
    ctx.font = font
    const bulletX = contentRect.x + BULLET_MARGIN
    ctx.fillText(bullet, bulletX, currentY + listLineHeight * 0.75)

    // 渲染列表项内容
    if (item.inlineElements && item.inlineElements.length > 0) {
      currentY = renderInlineListItem(
        ctx,
        item,
        config,
        theme,
        currentY,
        contentStartX,
        maxTextWidth,
        listLineHeight,
        startNewPage
      )
    } else {
      // 纯文本渲染
      currentY = renderPlainListItem(
        ctx,
        item.text,
        config,
        theme,
        currentY,
        contentStartX,
        maxTextWidth,
        listLineHeight,
        startNewPage
      )
    }

    currentY += listLineHeight * 0.15
  }

  currentY += config.lineHeight * 0.4

  return { ctx, currentY }
}

/**
 * 渲染带内联样式的列表项
 */
function renderInlineListItem(
  ctx: CanvasRenderingContext2D,
  item: ListItem,
  config: LayoutConfig,
  theme: Theme,
  startY: number,
  contentStartX: number,
  maxTextWidth: number,
  lineHeight: number,
  startNewPage: () => { ctx: CanvasRenderingContext2D; y: number }
): number {
  const font = getFontString(config, 'body')
  const fonts = {
    bodyFont: font,
    codeFont: getFontString(config, 'inlineCode'),
    boldFont: font.replace(/400|500/, '600'),
    italicFont: font.replace('400', '400 italic'),
  }

  // 构建 fragments
  type TextFragment = { text: string; style: ListAtom['style']; width: number }
  const fragments: TextFragment[] = []

  if (item.inlineElements) {
    for (const el of item.inlineElements) {
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
  }

  // 构建 atoms
  const atoms: ListAtom[] = []
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

  // 渲染每一行
  let atomIndex = 0
  let currentY = startY
  let isFirstLine = true

  while (atomIndex < atoms.length) {
    const availableHeight = getAvailableHeight(config, currentY)
    if (availableHeight < lineHeight) {
      const next = startNewPage()
      ctx = next.ctx
      currentY = next.y
      isFirstLine = true
      continue
    }

    // 收集行内 atoms
    const lineAtoms: ListAtom[] = []
    let lineWidth = 0
    const lineMaxWidth = maxTextWidth - (isFirstLine ? 0 : 0)

    // 跳过开头空白
    while (atomIndex < atoms.length && atoms[atomIndex]?.isGlue) {
      atomIndex++
    }

    while (atomIndex < atoms.length) {
      const atom = atoms[atomIndex]
      if (!atom) break

      if (lineWidth + atom.width > lineMaxWidth && lineAtoms.length > 0) {
        break
      }

      lineAtoms.push(atom)
      lineWidth += atom.width
      atomIndex++

      if (atom.isGlue && atomIndex < atoms.length) {
        const nextAtom = atoms[atomIndex]
        if (!nextAtom) break
        if (lineWidth + nextAtom.width > lineMaxWidth) {
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

    // 渲染行
    const lineY = currentY + lineHeight * 0.75
    let x = contentStartX

    for (const atom of lineAtoms) {
      renderListAtom(ctx, atom, x, lineY, theme, fonts, config)
      x += atom.width
    }

    currentY += lineHeight
    isFirstLine = false
  }

  return currentY
}

/**
 * 渲染纯文本列表项
 */
function renderPlainListItem(
  ctx: CanvasRenderingContext2D,
  text: string,
  config: LayoutConfig,
  theme: Theme,
  startY: number,
  contentStartX: number,
  maxTextWidth: number,
  lineHeight: number,
  startNewPage: () => { ctx: CanvasRenderingContext2D; y: number }
): number {
  const font = getFontString(config, 'body')
  const prepared = prepareText(text, font)

  let cursor: { segmentIndex: number; graphemeIndex: number } = { segmentIndex: 0, graphemeIndex: 0 }
  let currentY = startY
  let isFirstLine = true



  while (hasMoreText(prepared, cursor)) {
    const availableHeight = getAvailableHeight(config, currentY)

    if (availableHeight < lineHeight) {
      const next = startNewPage()
      ctx = next.ctx
      currentY = next.y
      isFirstLine = true
      continue
    }

    const line = layoutNextLine(prepared, cursor, maxTextWidth)
    if (!line) break

    const x = isFirstLine ? contentStartX : contentStartX
    ctx.font = font
    ctx.fillStyle = theme.text
    ctx.fillText(line.text, x, currentY + lineHeight * 0.75)

    cursor = line.end
    currentY += lineHeight
    isFirstLine = false
  }

  return currentY
}

/**
 * 渲染列表 atom
 */
function renderListAtom(
  ctx: CanvasRenderingContext2D,
  atom: ListAtom,
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
      ctx.fillStyle = theme.text
      ctx.fillText(atom.text, x, y)
      break
    }
    case 'em': {
      ctx.font = fonts.italicFont
      ctx.fillStyle = theme.text
      ctx.fillText(atom.text, x, y)
      break
    }
    case 'link': {
      ctx.font = fonts.bodyFont
      ctx.fillStyle = theme.link
      ctx.fillText(atom.text, x, y)
      ctx.strokeStyle = theme.link
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, y + 3)
      ctx.lineTo(x + atom.width, y + 3)
      ctx.stroke()
      break
    }
    default: {
      ctx.font = fonts.bodyFont
      ctx.fillStyle = theme.text
      ctx.fillText(atom.text, x, y)
    }
  }
}
