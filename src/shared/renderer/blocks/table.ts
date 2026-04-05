/**
 * 表格渲染器 - 共享
 */

import type { Block, LayoutConfig, Theme } from '../../types'
import { renderTable as renderTableBackground, renderTableRow } from '../utils/canvas'
import { getBodyFont } from '../utils/fonts'

export function renderTable(
  ctx: CanvasRenderingContext2D,
  block: Block,
  config: LayoutConfig,
  theme: Theme,
  currentY: number
): number {
  const rows = block.rows || []
  if (rows.length === 0) return currentY
  
  const contentWidth = config.pageWidth - config.padding.left - config.padding.right
  const colCount = rows[0]?.length || 1
  const colWidth = contentWidth / colCount
  const rowHeight = config.lineHeight * 1.5
  
  const tableHeight = rows.length * rowHeight + 16
  
  // 简单处理：直接渲染表格
  currentY += 16
  
  const tableX = config.padding.left
  const tableY = currentY
  
  // 渲染表头背景
  renderTableBackground(ctx, tableX, tableY, contentWidth, rowHeight, theme)
  
  ctx.font = getBodyFont(config)
  
  // 渲染表格内容
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const y = tableY + i * rowHeight + rowHeight * 0.7
    
    for (let j = 0; j < row.length; j++) {
      const cell = row[j]
      const x = tableX + j * colWidth + 12
      
      ctx.fillStyle = i === 0 ? theme.textHeading : theme.text
      ctx.fillText(cell, x, y)
    }
    
    // 渲染行分隔线
    if (i > 0) {
      renderTableRow(ctx, tableX, tableY + i * rowHeight, contentWidth, theme)
    }
  }
  
  currentY += tableHeight + 24
  
  return currentY
}
