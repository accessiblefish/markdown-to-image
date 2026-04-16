/**
 * 行内文本渲染器 - 共享
 * 使用 Pretext 的 inline-flow API 处理 rich inline 文本
 */

import {
  prepareInlineFlow,
  layoutNextInlineFlowLine,
  type InlineFlowItem,
  type InlineFlowCursor,
  type InlineFlowLine,
} from './inline-flow.js'
import type { InlineElement, LayoutConfig, Theme } from '../../types'
import { getBodyFont, getInlineCodeFont } from './fonts'

const FLOW_START_CURSOR: InlineFlowCursor = {
  itemIndex: 0,
  segmentIndex: 0,
  graphemeIndex: 0,
}

function getElementFont(el: InlineElement, config: LayoutConfig): string {
  switch (el.type) {
    case 'code':
      return getInlineCodeFont(config)
    case 'strong':
      return getBodyFont(config).replace(/\d+px/, (size: string) => `bold ${size}`)
    case 'em':
      return getBodyFont(config).replace(/\d+px/, (size: string) => `italic ${size}`)
    case 'link':
    case 'text':
    default:
      return getBodyFont(config)
  }
}

function inlineElementsToFlowItems(elements: InlineElement[], config: LayoutConfig): InlineFlowItem[] {
  return elements.map(el => ({
    text: el.content,
    font: getElementFont(el, config),
  }))
}

export function wrapInlineElements(
  _ctx: CanvasRenderingContext2D,
  elements: InlineElement[],
  maxWidth: number,
  config: LayoutConfig,
  _theme: Theme
): Array<{ element: InlineElement; x: number; y: number }[]> {
  if (elements.length === 0) return []

  // 转换为 Pretext 的 inline flow items
  const items = inlineElementsToFlowItems(elements, config)
  const prepared = prepareInlineFlow(items)

  const lines: Array<{ element: InlineElement; x: number; y: number }[]> = []
  let cursor = FLOW_START_CURSOR

  while (true) {
    const line = layoutNextInlineFlowLine(prepared, maxWidth, cursor)
    if (line === null) break

    const lineElements: { element: InlineElement; x: number; y: number }[] = []
    let currentX = 0

    for (const fragment of line.fragments) {
      const originalElement = elements[fragment.itemIndex]
      if (!originalElement) continue

      currentX += fragment.gapBefore
      lineElements.push({
        element: { ...originalElement, content: fragment.text },
        x: currentX,
        y: 0,
      })
      currentX += fragment.occupiedWidth
    }

    if (lineElements.length > 0) {
      lines.push(lineElements)
    }

    cursor = line.end
  }

  return lines
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

export function renderInlineCodeToken(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  baselineY: number,
  config: LayoutConfig,
  theme: Theme
): void {
  const codeFont = getInlineCodeFont(config)
  ctx.font = codeFont

  const metrics = ctx.measureText(text)
  const textWidth = metrics.width
  const ascent = metrics.actualBoundingBoxAscent || config.fontSize * 0.52
  const descent = metrics.actualBoundingBoxDescent || config.fontSize * 0.16
  const paddingX = 6
  const paddingY = 4
  const boxTop = baselineY - ascent - paddingY
  const boxHeight = ascent + descent + paddingY * 2

  ctx.fillStyle = theme.inlineCodeBg
  ctx.beginPath()
  // @ts-ignore
  if (ctx.roundRect) {
    ctx.roundRect(x - paddingX, boxTop, textWidth + paddingX * 2, boxHeight, 6)
  } else {
    ctx.fillRect(x - paddingX, boxTop, textWidth + paddingX * 2, boxHeight)
  }
  // @ts-ignore
  if (ctx.roundRect) ctx.roundRect(x - paddingX, boxTop, textWidth + paddingX * 2, boxHeight, 6)
  ctx.fill()

  ctx.fillStyle = theme.inlineCodeText
  ctx.font = codeFont
  ctx.fillText(text, x, baselineY)
}

export function getInlineElementWidth(
  ctx: CanvasRenderingContext2D,
  element: InlineElement,
  config: LayoutConfig,
  theme: Theme
): number {
  ctx.font = getElementFont(element, config)
  return ctx.measureText(element.content).width
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
  const wrapped = wrapInlineElements(ctx, elements, maxWidth, config, theme)
  let y = startY

  for (const line of wrapped) {
    for (const item of line) {
      renderInlineElement(ctx, item.element, startX + item.x, y, config, theme)
    }
    y += lineHeight
  }

  return y
}
