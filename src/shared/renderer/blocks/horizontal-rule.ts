/**
 * 水平分割线渲染器 - 共享
 */

import type { LayoutConfig, Theme } from '../../types'
import { renderHorizontalRule as renderHR } from '../utils/canvas'

export interface HorizontalRuleResult {
  ctx: CanvasRenderingContext2D
  currentY: number
}

export function renderHorizontalRule(
  ctx: CanvasRenderingContext2D,
  config: LayoutConfig,
  theme: Theme,
  currentY: number,
  startNewPage: () => { ctx: CanvasRenderingContext2D; y: number }
): HorizontalRuleResult {
  // 检查是否需要换页
  if (currentY + 48 > config.pageHeight - config.padding.bottom) {
    const result = startNewPage()
    ctx = result.ctx
    currentY = result.y
  }
  
  currentY += 24
  
  const x = config.padding.left
  const y = currentY
  const width = config.pageWidth - config.padding.left - config.padding.right
  
  renderHR(ctx, x, y, width, theme)
  
  currentY += 24
  
  return { ctx, currentY }
}
