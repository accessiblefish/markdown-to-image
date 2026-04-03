/**
 * 水平分割线渲染器
 */

import type { LayoutConfig } from '../../types'
import type { Theme } from '../../config/themes'
import { getContentRect, getAvailableHeight } from '../utils/layout'
import { renderHorizontalRule as renderHR } from '../utils/canvas'

/**
 * 渲染水平分割线
 */
export function renderHorizontalRule(
  ctx: CanvasRenderingContext2D,
  config: LayoutConfig,
  theme: Theme,
  currentY: number,
  startNewPage: () => { ctx: CanvasRenderingContext2D; y: number }
): { ctx: CanvasRenderingContext2D; currentY: number } {
  const contentRect = getContentRect(config)

  // 检查是否需要新页面
  if (getAvailableHeight(config, currentY) < 50) {
    const next = startNewPage()
    ctx = next.ctx
    currentY = next.y
  }

  renderHR(ctx, contentRect.x, currentY + 25, contentRect.width, theme)
  currentY += 50

  return { ctx, currentY }
}
