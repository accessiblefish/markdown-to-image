/**
 * 标题渲染器
 */

import type { Block, LayoutConfig } from '../../types'
import type { Theme } from '../../config/themes'
import { getFontString, prepareText, hasMoreText } from '../utils/fonts'
import { layoutColumn, getAvailableHeight, needsNewPage } from '../utils/layout'
import { renderTextLine } from '../utils/canvas'

/**
 * 渲染标题块
 */
export function renderHeading(
  ctx: CanvasRenderingContext2D,
  block: Block,
  config: LayoutConfig,
  theme: Theme,
  currentY: number,
  startNewPage: () => { ctx: CanvasRenderingContext2D; y: number }
): { ctx: CanvasRenderingContext2D; currentY: number } {
  const level = block.level || 1
  const font = getFontString(config, 'heading', level)
  const prepared = prepareText(block.content, font)
  const lineHeight = config.lineHeight * (1.6 - level * 0.1)

  // 估算所需高度
  const estimatedHeight = lineHeight * 2
  if (needsNewPage(config, currentY, estimatedHeight)) {
    const next = startNewPage()
    ctx = next.ctx
    currentY = next.y
  }

  const availableHeight = getAvailableHeight(config, currentY)
  const result = layoutColumn(
    prepared,
    { segmentIndex: 0, graphemeIndex: 0 },
    config,
    currentY,
    availableHeight
  )

  for (const line of result.lines) {
    renderTextLine(ctx, line.text, line.x, line.y + lineHeight * 0.8, theme.textHeading, font)
  }

  currentY = result.finalY + lineHeight * 0.6

  return { ctx, currentY }
}

/**
 * 计算标题所需高度
 */
export function measureHeading(
  block: Block,
  config: LayoutConfig
): number {
  const level = block.level || 1
  const lineHeight = config.lineHeight * (1.6 - level * 0.1)
  // 简化估算：假设标题最多占2行
  return lineHeight * 2 + lineHeight * 0.6
}
