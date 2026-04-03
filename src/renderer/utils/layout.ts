/**
 * 布局计算工具
 */

import { layoutNextLine, type PreparedTextWithSegments, type LayoutCursor } from '@chenglou/pretext'
import type { LayoutConfig } from '../../types'

export interface ContentRect {
  x: number
  y: number
  width: number
  height: number
}

export interface LineLayout {
  x: number
  y: number
  text: string
  width: number
}

export interface LayoutColumnResult {
  lines: LineLayout[]
  cursor: LayoutCursor
  finalY: number
}

/**
 * 获取内容区域矩形
 */
export function getContentRect(config: LayoutConfig): ContentRect {
  const { pageWidth, pageHeight, padding } = config
  return {
    x: padding.left,
    y: padding.top,
    width: pageWidth - padding.left - padding.right,
    height: pageHeight - padding.top - padding.bottom,
  }
}

/**
 * 计算列布局
 */
export function layoutColumn(
  prepared: PreparedTextWithSegments,
  startCursor: LayoutCursor,
  config: LayoutConfig,
  yStart: number,
  availableHeight: number,
  isCode = false
): LayoutColumnResult {
  const contentRect = getContentRect(config)
  const lineHeight = isCode ? config.lineHeight * 0.95 : config.lineHeight

  let cursor: LayoutCursor = startCursor
  let lineTop = yStart
  const lines: LineLayout[] = []

  while (true) {
    if (lineTop + lineHeight > yStart + availableHeight) break

    const line = layoutNextLine(prepared, cursor, contentRect.width)
    if (line === null) break

    lines.push({
      x: contentRect.x,
      y: lineTop,
      text: line.text,
      width: line.width,
    })

    cursor = line.end
    lineTop += lineHeight
  }

  return { lines, cursor, finalY: lineTop }
}

/**
 * 计算可用高度
 */
export function getAvailableHeight(config: LayoutConfig, currentY: number): number {
  return config.pageHeight - config.padding.bottom - currentY
}

/**
 * 检查是否需要新页面
 */
export function needsNewPage(
  config: LayoutConfig,
  currentY: number,
  requiredHeight: number
): boolean {
  const available = getAvailableHeight(config, currentY)
  return requiredHeight > available && currentY > config.padding.top + 50
}
