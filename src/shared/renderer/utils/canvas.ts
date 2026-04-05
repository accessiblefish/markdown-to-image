/**
 * Canvas 渲染工具 - 共享
 */

import type { LayoutConfig, Theme } from '../../types'
import type { Padding } from '../../types'

export interface CanvasAndContext {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

export interface CreateCanvasFn {
  (width: number, height: number): CanvasAndContext
}

/**
 * 渲染背景
 */
export function renderBackground(
  ctx: CanvasRenderingContext2D,
  config: LayoutConfig,
  bgColor: string
): void {
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, config.pageWidth, config.pageHeight)
}

/**
 * 渲染页面页脚（页码）
 */
export function renderPageFooter(
  ctx: CanvasRenderingContext2D,
  config: LayoutConfig,
  pageNumber: number,
  fonts: { body: string },
  textColor: string
): void {
  ctx.fillStyle = textColor
  ctx.font = `25px ${fonts.body}`
  ctx.textAlign = 'right'
  ctx.fillText(
    `- ${pageNumber} -`,
    config.pageWidth - config.padding.right,
    config.pageHeight - 55
  )
  ctx.textAlign = 'left'
}

/**
 * 渲染文本行
 */
export function renderTextLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  font: string
): void {
  ctx.fillStyle = color
  ctx.font = font
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, x, y)
}

/**
 * 渲染引用块背景
 */
export function renderBlockQuote(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  theme: Theme
): void {
  ctx.fillStyle = theme.quoteBg
  ctx.fillRect(x, y, width, height)
  ctx.fillStyle = theme.quoteBorder
  ctx.fillRect(x, y, 4, height)
}

/**
 * 渲染代码块背景
 */
export function renderCodeBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  theme: Theme
): void {
  ctx.fillStyle = theme.codeBg
  ctx.beginPath()
  // @ts-ignore - roundRect may not be in all Canvas types
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, 8)
  } else {
    ctx.rect(x, y, width, height)
  }
  ctx.fill()
}

/**
 * 渲染水平分割线
 */
export function renderHorizontalRule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  theme: Theme
): void {
  ctx.strokeStyle = theme.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + width, y)
  ctx.stroke()
}

/**
 * 渲染表格
 */
export function renderTable(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  rowHeight: number,
  theme: Theme
): void {
  ctx.fillStyle = theme.quoteBg
  ctx.fillRect(x, y, width, rowHeight)
}

/**
 * 渲染表格行
 */
export function renderTableRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  theme: Theme
): void {
  ctx.strokeStyle = theme.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + width, y)
  ctx.stroke()
}

/**
 * 渲染任务列表复选框
 */
export function renderTaskCheckbox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  checked: boolean,
  theme: Theme,
  font: string
): void {
  ctx.fillStyle = theme.textMuted
  ctx.font = font
  const symbol = checked ? '☑' : '☐'
  ctx.fillText(symbol, x, y)
}

/**
 * 渲染列表项符号
 */
export function renderListBullet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ordered: boolean | undefined,
  index: number,
  theme: Theme,
  font: string
): void {
  ctx.fillStyle = theme.accent
  ctx.font = font
  const bullet = ordered ? `${index + 1}.` : '•'
  ctx.fillText(bullet, x, y)
}
