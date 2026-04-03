/**
 * 段落渲染器
 */

import type { Block, LayoutConfig } from '../../types'
import type { Theme } from '../../config/themes'
import { getFontString } from '../utils/fonts'
import { getContentRect, getAvailableHeight } from '../utils/layout'
import { renderInlineContent } from '../utils/inline-renderer'

/**
 * 渲染段落块
 */
export function renderParagraph(
  ctx: CanvasRenderingContext2D,
  block: Block,
  config: LayoutConfig,
  theme: Theme,
  currentY: number,
  startNewPage: () => { ctx: CanvasRenderingContext2D; y: number }
): { ctx: CanvasRenderingContext2D; currentY: number } {
  const contentRect = getContentRect(config)
  const font = getFontString(config, 'body')

  // 使用统一的内联内容渲染器
  let atomIndex = 0

  // 创建一个包装器来模拟渲染过程以计算行
  const fonts = {
    bodyFont: font,
    codeFont: getFontString(config, 'inlineCode'),
    boldFont: font.replace(/400|500/, '600'),
    italicFont: font.replace('400', '400 italic'),
  }

  // 获取内联元素
  const inlineElements = block.inlineElements
  const content = block.content

  // 构建 fragments
  type TextFragment = { text: string; style: 'normal' | 'code' | 'strong' | 'em' | 'link'; width: number }
  type TextAtom = { text: string; style: TextFragment['style']; width: number; isGlue: boolean }

  const fragments: TextFragment[] = []

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
  const atoms: TextAtom[] = []
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
  while (atomIndex < atoms.length) {
    const availableHeight = getAvailableHeight(config, currentY)

    if (availableHeight < config.lineHeight) {
      const next = startNewPage()
      ctx = next.ctx
      currentY = next.y
      continue
    }

    // 收集行内 atoms
    const lineAtoms: TextAtom[] = []
    let lineWidth = 0
    const maxWidth = contentRect.width

    // 跳过开头空白
    while (atomIndex < atoms.length && atoms[atomIndex]?.isGlue) {
      atomIndex++
    }

    // 填充行
    while (atomIndex < atoms.length) {
      const atom = atoms[atomIndex]
      if (!atom) break

      if (lineWidth + atom.width > maxWidth && lineAtoms.length > 0) {
        break
      }

      lineAtoms.push(atom)
      lineWidth += atom.width
      atomIndex++

      // 检查是否可以在 glue 后断开
      if (atom.isGlue && atomIndex < atoms.length) {
        const nextAtom = atoms[atomIndex]
        if (!nextAtom) break
        if (lineWidth + nextAtom.width > maxWidth) {
          lineAtoms.pop()
          lineWidth -= atom.width
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

    // 移除末尾空白
    while (lineAtoms.length > 0 && lineAtoms[lineAtoms.length - 1]?.isGlue) {
      lineAtoms.pop()
    }

    // 渲染行
    const lineY = currentY + config.lineHeight * 0.75
    let x = contentRect.x

    for (const atom of lineAtoms) {
      renderAtom(ctx, atom, x, lineY, theme, fonts, config)
      x += atom.width
    }

    currentY += config.lineHeight
  }

  currentY += config.lineHeight * 0.5

  return { ctx, currentY }
}

/**
 * 渲染单个 atom
 */
function renderAtom(
  ctx: CanvasRenderingContext2D,
  atom: { text: string; style: 'normal' | 'code' | 'strong' | 'em' | 'link'; width: number },
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
