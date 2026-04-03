/**
 * 内联内容渲染器 - 统一处理段落、引用、列表中的内联元素
 */

// CanvasRenderingContext2D is a built-in browser type
import type {
  InlineElement,
  LayoutConfig,
  TextFragment,
  TextAtom,
  TextStyle,
} from '../../types'
import type { Theme } from '../../config/themes'
import { getFontString } from './fonts'
import { getContentRect } from './layout'

interface InlineRenderOptions {
  ctx: CanvasRenderingContext2D
  inlineElements: InlineElement[] | undefined
  content: string
  config: LayoutConfig
  theme: Theme
  startX: number
  startY: number
  maxWidth: number
  lineHeight: number
  isQuote?: boolean
}

interface InlineRenderResult {
  finalY: number
  totalLines: number
}

/**
 * 渲染内联内容（统一处理段落、引用、列表）
 */
export function renderInlineContent(options: InlineRenderOptions): InlineRenderResult {
  const {
    ctx,
    inlineElements,
    content,
    config,
    theme,
    startX,
    startY,
    maxWidth,
    lineHeight,
    isQuote = false,
  } = options

  const fonts = getInlineFonts(config, ctx)
  const fragments = buildFragments(ctx, inlineElements, content, fonts)
  const atoms = buildAtoms(ctx, fragments, fonts)

  let atomIndex = 0
  let currentY = startY
  let totalLines = 0
  let isFirstLine = true

  while (atomIndex < atoms.length) {
 const lineAtoms = collectLineAtoms(atoms, atomIndex, maxWidth, isFirstLine)

    if (lineAtoms.length === 0) {
      if (atomIndex < atoms.length) {
        lineAtoms.push(atoms[atomIndex]!)
        atomIndex++
      } else {
        break
      }
    }

    atomIndex += lineAtoms.length + (atomIndex < atoms.length ? 0 : 0)

    // 跳过末尾的空白
    while (lineAtoms.length > 0 && lineAtoms[lineAtoms.length - 1]!.isGlue) {
      const removed = lineAtoms.pop()
      if (!removed) break
    }

    if (lineAtoms.length === 0) continue

    // 渲染行
    const lineY = currentY + lineHeight * 0.75
    let x = startX

    for (const atom of lineAtoms) {
      renderAtom(ctx, atom, x, lineY, theme, fonts, isQuote)
      x += atom.width
    }

    currentY += lineHeight
    totalLines++
    isFirstLine = false

    // 更新实际消耗的 atom 数量
    const consumedCount = calculateConsumedAtoms(atoms, atomIndex, lineAtoms)
    atomIndex = consumedCount
  }

  return { finalY: currentY, totalLines }
}

/**
 * 计算消耗的 atom 数量
 */
function calculateConsumedAtoms(
  atoms: TextAtom[],
  currentIndex: number,
  lineAtoms: TextAtom[]
): number {
  let count = 0
  let remaining = lineAtoms.length

  for (let i = currentIndex; i < atoms.length && remaining > 0; i++) {
    const atom = atoms[i]
    if (!atom) break

    // 匹配 atom
    const found = lineAtoms.some(
      (la) => la.text === atom.text && la.style === atom.style
    )
    if (found) {
      remaining--
      count++
    } else if (!atom.isGlue) {
      count++
    } else if (remaining === lineAtoms.length) {
      // 开头跳过的 glue
      count++
    } else {
      break
    }
  }

  return currentIndex + count
}

/**
 * 获取内联字体配置
 */
function getInlineFonts(config: LayoutConfig, ctx: CanvasRenderingContext2D) {
  const bodyFont = getFontString(config, 'body')
  const codeFont = getFontString(config, 'inlineCode')
  const boldFont = bodyFont.replace(/400|500/, '600')
  const italicFont = bodyFont.replace('400', '400 italic')

  return { bodyFont, codeFont, boldFont, italicFont }
}

/**
 * 构建文本片段
 */
function buildFragments(
  ctx: CanvasRenderingContext2D,
  inlineElements: InlineElement[] | undefined,
  fallbackContent: string,
  fonts: { bodyFont: string; codeFont: string; boldFont: string; italicFont: string }
): TextFragment[] {
  const fragments: TextFragment[] = []

  if (inlineElements && inlineElements.length > 0) {
    for (const el of inlineElements) {
      let style: TextStyle
      switch (el.type) {
        case 'code':
          style = 'code'
          break
        case 'strong':
          style = 'strong'
          break
        case 'em':
          style = 'em'
          break
        case 'link':
          style = 'link'
          break
        default:
          style = 'normal'
      }

      ctx.font =
        style === 'code'
          ? fonts.codeFont
          : style === 'strong'
            ? fonts.boldFont
            : style === 'em'
              ? fonts.italicFont
              : fonts.bodyFont

      fragments.push({
        text: el.content,
        style,
        width: ctx.measureText(el.content).width,
      })
    }
  } else {
    ctx.font = fonts.bodyFont
    fragments.push({
      text: fallbackContent,
      style: 'normal',
      width: ctx.measureText(fallbackContent).width,
    })
  }

  return fragments
}

/**
 * 构建原子单元
 */
function buildAtoms(
  ctx: CanvasRenderingContext2D,
  fragments: TextFragment[],
  fonts: { bodyFont: string; codeFont: string; boldFont: string; italicFont: string }
): TextAtom[] {
  const atoms: TextAtom[] = []

  for (const frag of fragments) {
    if (frag.style === 'normal') {
      // 分割普通文本为单词和空白
      const parts = frag.text.split(/(\s+)/)
      for (const part of parts) {
        if (!part) continue
        ctx.font = fonts.bodyFont
        atoms.push({
          text: part,
          style: 'normal',
          width: ctx.measureText(part).width,
          isGlue: /^\s+$/.test(part),
        })
      }
    } else {
      // 内联样式保持完整
      ctx.font =
        frag.style === 'code'
          ? fonts.codeFont
          : frag.style === 'strong'
            ? fonts.boldFont
            : frag.style === 'em'
              ? fonts.italicFont
              : fonts.bodyFont

      atoms.push({
        text: frag.text,
        style: frag.style,
        width: ctx.measureText(frag.text).width,
        isGlue: false,
      })
    }
  }

  return atoms
}

/**
 * 收集行内的原子
 */
function collectLineAtoms(
  atoms: TextAtom[],
  startIndex: number,
  maxWidth: number,
  isFirstLine: boolean
): TextAtom[] {
  const lineAtoms: TextAtom[] = []
  let lineWidth = 0
  let atomIndex = startIndex

  // 跳过开头的空白
  while (atomIndex < atoms.length && atoms[atomIndex]?.isGlue) {
    atomIndex++
  }

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
        break
      }
    }
  }

  return lineAtoms
}

/**
 * 渲染单个原子
 */
function renderAtom(
  ctx: CanvasRenderingContext2D,
  atom: TextAtom,
  x: number,
  y: number,
  theme: Theme,
  fonts: { bodyFont: string; codeFont: string; boldFont: string; italicFont: string },
  isQuote: boolean
): void {
  const textColor = isQuote ? theme.textMuted : theme.text

  switch (atom.style) {
    case 'code': {
      renderInlineCode(ctx, atom, x, y, theme)
      break
    }
    case 'strong': {
      ctx.font = fonts.boldFont
      ctx.fillStyle = textColor
      ctx.fillText(atom.text, x, y)
      break
    }
    case 'em': {
      ctx.font = fonts.italicFont
      ctx.fillStyle = textColor
      ctx.fillText(atom.text, x, y)
      break
    }
    case 'link': {
      ctx.font = fonts.bodyFont
      ctx.fillStyle = theme.link
      ctx.fillText(atom.text, x, y)
      // 下划线
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
      ctx.fillStyle = textColor
      ctx.fillText(atom.text, x, y)
    }
  }
}

/**
 * 渲染内联代码
 */
function renderInlineCode(
  ctx: CanvasRenderingContext2D,
  atom: TextAtom,
  x: number,
  y: number,
  theme: Theme
): void {
  // 估算字体大小
  const inlineFontSize = 14 // 默认值
  const bgPaddingX = 4
  const bgPaddingY = 3
  const bgY = y - inlineFontSize * 0.75 - bgPaddingY

  // 绘制背景
  ctx.fillStyle = theme.inlineCodeBg
  ctx.beginPath()
  ctx.roundRect(
    x - bgPaddingX,
    bgY,
    atom.width + bgPaddingX * 2,
    inlineFontSize + bgPaddingY * 2,
    4
  )
  ctx.fill()

  // 绘制文字
  ctx.font = getFontString({ fontSize: 14 } as any, 'inlineCode')
  ctx.fillStyle = theme.inlineCodeText
  ctx.fillText(atom.text, x, y)
}

/**
 * 计算内联内容所需高度
 */
export function measureInlineContent(
  ctx: CanvasRenderingContext2D,
  inlineElements: InlineElement[] | undefined,
  content: string,
  config: LayoutConfig,
  maxWidth: number,
  lineHeight: number
): number {
  const fonts = getInlineFonts(config, ctx)
  const fragments = buildFragments(ctx, inlineElements, content, fonts)
  const atoms = buildAtoms(ctx, fragments, fonts)

  let atomIndex = 0
  let lineCount = 0

  while (atomIndex < atoms.length) {
    const lineAtoms = collectLineAtoms(atoms, atomIndex, maxWidth, lineCount === 0)
    if (lineAtoms.length === 0) break

    lineCount++

    // 计算实际消耗的 atom
    let consumed = 0
    let remaining = lineAtoms.length
    for (let i = atomIndex; i < atoms.length && remaining > 0; i++) {
      const atom = atoms[i]
      if (!atom) break

      if (lineAtoms.some((la) => la.text === atom.text && la.style === atom.style)) {
        remaining--
        consumed++
      } else if (!atom.isGlue) {
        consumed++
      } else if (consumed === 0) {
        consumed++
      } else {
        break
      }
    }
    atomIndex += consumed
  }

  return lineCount * lineHeight
}
