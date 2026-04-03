/**
 * 表格渲染器
 */

import type { Block, LayoutConfig } from '../../types'
import type { Theme } from '../../config/themes'
import { getFontString } from '../utils/fonts'
import { getContentRect } from '../utils/layout'
import { renderTable as renderTableBackground, renderTableRow } from '../utils/canvas'

/**
 * 渲染表格块
 */
export function renderTable(
  ctx: CanvasRenderingContext2D,
  block: Block,
  config: LayoutConfig,
  theme: Theme,
  currentY: number
): number {
  if (!block.rows || block.rows.length === 0) return currentY

  const contentRect = getContentRect(config)
  const smallFont = getFontString(config, 'small')
  const rows = block.rows
  const colCount = rows[0]?.length || 1
  const colWidth = (contentRect.width - 32) / colCount

  // 渲染表头背景
  renderTableBackground(ctx, contentRect.x, currentY, contentRect.width, config.lineHeight * 1.2, theme)

  // 渲染表头文字
  ctx.fillStyle = theme.textHeading
  ctx.font = smallFont
  const headerRow = rows[0]
  if (headerRow) {
    headerRow.forEach((cell, idx) => {
      ctx.fillText(
        cell.slice(0, 20),
        contentRect.x + 16 + idx * colWidth,
        currentY + config.lineHeight * 0.8
      )
    })
  }

  currentY += config.lineHeight * 1.2

  // 渲染表头分隔线
  ctx.strokeStyle = theme.border
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(contentRect.x, currentY - 4)
  ctx.lineTo(contentRect.x + contentRect.width, currentY - 4)
  ctx.stroke()

  // 渲染数据行
  ctx.fillStyle = theme.text
  ctx.font = smallFont
  for (let i = 1; i < rows.length && i < 10; i++) {
    const row = rows[i]
    if (!row) continue

    row.forEach((cell, idx) => {
      ctx.fillText(
        cell.slice(0, 20),
        contentRect.x + 16 + idx * colWidth,
        currentY + config.lineHeight * 0.8
      )
    })

    renderTableRow(ctx, contentRect.x, currentY + config.lineHeight - 4, contentRect.width, theme)
    currentY += config.lineHeight * 1.1
  }

  currentY += config.lineHeight * 0.3

  return currentY
}

/**
 * 计算表格所需高度
 */
export function measureTable(block: Block, config: LayoutConfig): number {
  if (!block.rows || block.rows.length === 0) return 0

  const rowCount = Math.min(block.rows.length, 10)
  return (
    config.lineHeight * 1.2 + // 表头
    (rowCount - 1) * config.lineHeight * 1.1 + // 数据行
    config.lineHeight * 0.3 // 底部间距
  )
}
