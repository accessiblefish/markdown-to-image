/**
 * 行内文本渲染器 - 共享
 */

import type { Block, InlineElement, LayoutConfig, Theme, TextAtom, TextFragment, LayoutResult } from '../../types'
import { getBodyFont, getInlineCodeFont } from './fonts'

export function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: 'normal' | 'code' | 'strong' | 'em' | 'link',
  config: LayoutConfig,
  theme: Theme
): number {
  let font = getBodyFont(config)
  
  switch (style) {
    case 'code':
      font = getInlineCodeFont(config)
      break
    case 'strong':
      font = font.replace(/\d+px/, (size: string) => `bold ${size}`)
      break
    case 'em':
      font = font.replace(/\d+px/, (size: string) => `italic ${size}`)
      break
  }
  
  ctx.font = font
  return ctx.measureText(text).width
}

export function renderInlineElement(
  ctx: CanvasRenderingContext2D,
  element: InlineElement,
  x: number,
  y: number,
  config: LayoutConfig,
  theme: Theme
): void {
  switch (element.type) {
    case 'text':
      ctx.fillStyle = theme.text
      ctx.font = getBodyFont(config)
      ctx.fillText(element.content, x, y)
      break
    case 'code':
      ctx.fillStyle = theme.inlineCodeText
      ctx.font = getInlineCodeFont(config)
      ctx.fillText(element.content, x, y)
      break
    case 'strong':
      ctx.fillStyle = theme.text
      ctx.font = getBodyFont(config).replace(/\d+px/, (size: string) => `bold ${size}`)
      ctx.fillText(element.content, x, y)
      break
    case 'em':
      ctx.fillStyle = theme.text
      ctx.font = getBodyFont(config).replace(/\d+px/, (size: string) => `italic ${size}`)
      ctx.fillText(element.content, x, y)
      break
    case 'link':
      ctx.fillStyle = theme.link
      ctx.font = getBodyFont(config)
      ctx.fillText(element.content, x, y)
      break
  }
}

export function getInlineElementWidth(
  ctx: CanvasRenderingContext2D,
  element: InlineElement,
  config: LayoutConfig,
  theme: Theme
): number {
  const style: 'normal' | 'code' | 'strong' | 'em' | 'link' = 
    element.type === 'text' ? 'normal' : element.type
  return measureText(ctx, element.content, style, config, theme)
}

export function renderWrappedInlineElements(
  ctx: CanvasRenderingContext2D,
  elements: InlineElement[],
  startX: number,
  startY: number,
  maxWidth: number,
  config: LayoutConfig,
  theme: Theme,
  lineHeight: number
): number {
  let x = startX
  let y = startY
  
  for (const el of elements) {
    const width = getInlineElementWidth(ctx, el, config, theme)
    
    if (x + width > startX + maxWidth && x > startX) {
      x = startX
      y += lineHeight
    }
    
    renderInlineElement(ctx, el, x, y, config, theme)
    x += width
  }
  
  return y
}

export function wrapInlineElements(
  ctx: CanvasRenderingContext2D,
  elements: InlineElement[],
  maxWidth: number,
  config: LayoutConfig,
  theme: Theme
): Array<{ element: InlineElement; x: number; y: number }[]> {
  const lines: Array<{ element: InlineElement; x: number; y: number }[]> = []
  let currentLine: { element: InlineElement; x: number; y: number }[] = []
  let currentX = 0
  
  for (const el of elements) {
    const width = getInlineElementWidth(ctx, el, config, theme)
    
    if (currentX + width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine)
      currentLine = []
      currentX = 0
    }
    
    currentLine.push({ element: el, x: currentX, y: 0 })
    currentX += width
  }
  
  if (currentLine.length > 0) {
    lines.push(currentLine)
  }
  
  return lines
}
