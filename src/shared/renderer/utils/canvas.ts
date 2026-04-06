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
 * 渲染背景 - 支持渐变和装饰
 */
export function renderBackground(
  ctx: CanvasRenderingContext2D,
  config: LayoutConfig,
  theme: Theme
): void {
  // 创建渐变背景
  if (theme.bgGradient && theme.bgGradient.length >= 2) {
    const gradient = ctx.createLinearGradient(0, 0, config.pageWidth, config.pageHeight)
    gradient.addColorStop(0, theme.bgGradient[0])
    gradient.addColorStop(1, theme.bgGradient[1])
    ctx.fillStyle = gradient
  } else {
    ctx.fillStyle = theme.bg
  }
  ctx.fillRect(0, 0, config.pageWidth, config.pageHeight)

  // 绘制装饰元素
  renderDecorativeElements(ctx, config, theme)
}

/**
 * 渲染装饰元素 - 几何图形、光晕等
 */
function renderDecorativeElements(
  ctx: CanvasRenderingContext2D,
  config: LayoutConfig,
  theme: Theme
): void {
  const color = theme.decorativeColor || theme.accent

  // 右上角大圆装饰
  ctx.save()
  ctx.globalAlpha = 0.08
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(config.pageWidth * 0.85, config.pageHeight * 0.15, 150, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // 左下角小圆装饰
  ctx.save()
  ctx.globalAlpha = 0.05
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(config.pageWidth * 0.1, config.pageHeight * 0.85, 100, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // 顶部波浪线装饰
  ctx.save()
  ctx.globalAlpha = 0.1
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.beginPath()
  for (let x = 0; x < config.pageWidth; x += 10) {
    const y = 60 + Math.sin(x * 0.02) * 15
    if (x === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()
  ctx.restore()

  // 点阵装饰
  ctx.save()
  ctx.globalAlpha = 0.06
  ctx.fillStyle = color
  const dotSpacing = 40
  for (let x = config.pageWidth - 100; x < config.pageWidth; x += dotSpacing) {
    for (let y = config.pageHeight - 100; y < config.pageHeight; y += dotSpacing) {
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
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
 * 渲染引用块背景 - 更有设计感的卡片样式
 */
export function renderBlockQuote(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  theme: Theme
): void {
  // 主背景
  ctx.fillStyle = theme.quoteBg
  ctx.beginPath()
  // @ts-ignore
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, 12)
  } else {
    ctx.rect(x, y, width, height)
  }
  ctx.fill()

  // 左边强调条
  ctx.fillStyle = theme.quoteBorder
  ctx.beginPath()
  // @ts-ignore
  if (ctx.roundRect) {
    ctx.roundRect(x, y + 16, 4, height - 32, 2)
  } else {
    ctx.fillRect(x, y + 16, 4, height - 32)
  }
  // @ts-ignore
  if (ctx.roundRect) ctx.roundRect(x, y + 16, 4, height - 32, 2)
  ctx.fill()

  // 右上角装饰引号
  ctx.save()
  ctx.globalAlpha = 0.15
  ctx.fillStyle = theme.quoteBorder
  ctx.font = 'bold 60px Georgia, serif'
  ctx.fillText('"', x + width - 50, y + 50)
  ctx.restore()
}

/**
 * 渲染代码块背景 - 毛玻璃效果
 */
export function renderCodeBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  theme: Theme
): void {
  // 主背景
  ctx.fillStyle = theme.codeBg
  ctx.beginPath()
  // @ts-ignore
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, 12)
  } else {
    ctx.rect(x, y, width, height)
  }
  ctx.fill()

  // 顶部装饰条
  ctx.fillStyle = theme.accent
  ctx.globalAlpha = 0.6
  ctx.beginPath()
  // @ts-ignore
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, 4, [12, 12, 0, 0])
  } else {
    ctx.fillRect(x, y, width, 4)
  }
  // @ts-ignore
  if (ctx.roundRect) ctx.roundRect(x, y, width, 4, [12, 12, 0, 0])
  ctx.fill()
  ctx.globalAlpha = 1

  // 三个点装饰（模拟窗口按钮）
  const dotY = y + 14
  const dots = ['#FF5F56', '#FFBD2E', '#27C93F']
  dots.forEach((color, i) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x + 20 + i * 16, dotY, 5, 0, Math.PI * 2)
    ctx.fill()
  })
}

/**
 * 渲染水平分割线 - 更有设计感
 */
export function renderHorizontalRule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  theme: Theme
): void {
  const centerX = x + width / 2

  // 中心装饰点
  ctx.fillStyle = theme.accent
  ctx.beginPath()
  ctx.arc(centerX, y, 4, 0, Math.PI * 2)
  ctx.fill()

  // 左右线条
  ctx.strokeStyle = theme.border
  ctx.lineWidth = 1.5

  // 左线
  ctx.beginPath()
  ctx.moveTo(x + 60, y)
  ctx.lineTo(centerX - 15, y)
  ctx.stroke()

  // 右线
  ctx.beginPath()
  ctx.moveTo(centerX + 15, y)
  ctx.lineTo(x + width - 60, y)
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
