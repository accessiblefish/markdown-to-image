/**
 * 表格渲染器 - 共享
 */

import { prepareWithSegments, layoutNextLine, type LayoutCursor } from '@chenglou/pretext'
import type { Block, LayoutConfig, Theme } from '../../types'
import { getBodyFont } from '../utils/fonts'

const TABLE_MARGIN_TOP = 16
const TABLE_MARGIN_BOTTOM = 24
const CELL_PADDING_X = 14
const CELL_PADDING_Y = 12
const MIN_COLUMN_WIDTH = 84
const MIN_VISIBLE_CHARS = 6

interface TableLayout {
  colWidths: number[]
  rowHeights: number[]
  wrappedRows: string[][][]
}

function wrapCellText(
  text: string,
  font: string,
  maxWidth: number
): { lines: string[]; longestWidth: number } {
  if (!text.trim()) {
    return { lines: [''], longestWidth: 0 }
  }

  const prepared = prepareWithSegments(text, font)
  const lines: string[] = []
  let longestWidth = 0
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }

  while (true) {
    const line = layoutNextLine(prepared, cursor, maxWidth)
    if (line === null) break
    lines.push(line.text)
    longestWidth = Math.max(longestWidth, line.width)
    cursor = line.end
  }

  return {
    lines: lines.length > 0 ? lines : [text],
    longestWidth,
  }
}

function calculateColumnWidths(
  rows: string[][],
  font: string,
  maxTableWidth: number
): number[] {
  const colCount = Math.max(...rows.map((row) => row.length), 1)
  const preferredWidths = new Array(colCount).fill(MIN_COLUMN_WIDTH)
  const minimumWidths = new Array(colCount).fill(MIN_COLUMN_WIDTH)

  const measureCanvas = new OffscreenCanvas(1, 1)
  const measureCtx = measureCanvas.getContext('2d')
  if (!measureCtx) {
    return preferredWidths
  }

  measureCtx.font = font

  for (const row of rows) {
    row.forEach((cell, index) => {
      const text = cell || ''
      const measured = measureCtx.measureText(text).width + CELL_PADDING_X * 2
      const visibleChars = Math.max(
        MIN_VISIBLE_CHARS,
        Math.min(text.trim().length || 0, 12)
      )
      const averageCharWidth = text.length > 0 ? measured / text.length : measureCtx.measureText('字').width
      const estimatedMin = averageCharWidth * visibleChars + CELL_PADDING_X * 2

      preferredWidths[index] = Math.max(preferredWidths[index], Math.min(measured, maxTableWidth))
      minimumWidths[index] = Math.max(
        minimumWidths[index],
        Math.min(preferredWidths[index], Math.max(MIN_COLUMN_WIDTH, estimatedMin))
      )
    })
  }

  const preferredTotal = preferredWidths.reduce((sum, width) => sum + width, 0)
  if (preferredTotal <= maxTableWidth) {
    const extraWidth = maxTableWidth - preferredTotal
    const growPerColumn = extraWidth / colCount
    return preferredWidths.map((width, index) => (
      index === colCount - 1
        ? width + growPerColumn + (maxTableWidth - (preferredTotal + growPerColumn * colCount))
        : width + growPerColumn
    ))
  }

  const minimumTotal = minimumWidths.reduce((sum, width) => sum + width, 0)
  if (minimumTotal >= maxTableWidth) {
    const normalized = minimumWidths.map((width) => (width / minimumTotal) * maxTableWidth)
    const remainder = maxTableWidth - normalized.reduce((sum, width) => sum + width, 0)
    normalized[normalized.length - 1] += remainder
    return normalized
  }

  const remainingWidth = maxTableWidth - minimumTotal
  const flexWidths = preferredWidths.map((width, index) => Math.max(0, width - minimumWidths[index]))
  const flexTotal = flexWidths.reduce((sum, width) => sum + width, 0)

  const finalWidths = minimumWidths.map((minWidth, index) => {
    if (flexTotal === 0) {
      return minWidth + remainingWidth / colCount
    }
    return minWidth + (flexWidths[index] / flexTotal) * remainingWidth
  })

  const finalTotal = finalWidths.reduce((sum, width) => sum + width, 0)
  if (finalTotal !== maxTableWidth) {
    finalWidths[finalWidths.length - 1] += maxTableWidth - finalTotal
  }

  return finalWidths
}

function buildTableLayout(
  block: Block,
  config: LayoutConfig
): TableLayout {
  const rows = block.rows || []
  const font = getBodyFont(config)
  const maxTableWidth = config.pageWidth - config.padding.left - config.padding.right
  const colWidths = calculateColumnWidths(rows, font, maxTableWidth)

  const wrappedRows: string[][][] = []
  const rowHeights: number[] = []

  for (const row of rows) {
    const wrappedCells = colWidths.map((colWidth, index) => {
      const cellText = row[index] || ''
      return wrapCellText(cellText, font, colWidth - CELL_PADDING_X * 2).lines
    })

    const maxLineCount = Math.max(...wrappedCells.map((cell) => cell.length), 1)
    wrappedRows.push(wrappedCells)
    rowHeights.push(maxLineCount * config.lineHeight + CELL_PADDING_Y * 2)
  }

  return {
    colWidths,
    rowHeights,
    wrappedRows,
  }
}

function drawCellBackground(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fillStyle: string,
  strokeStyle: string
): void {
  ctx.fillStyle = fillStyle
  ctx.fillRect(x, y, width, height)
  ctx.strokeStyle = strokeStyle
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, width, height)
}

export function renderTable(
  ctx: CanvasRenderingContext2D,
  block: Block,
  config: LayoutConfig,
  theme: Theme,
  currentY: number,
  startNewPage: () => { ctx: CanvasRenderingContext2D; y: number }
): { ctx: CanvasRenderingContext2D; currentY: number } {
  const rows = block.rows || []
  const isInspection = config.theme === 'inspection'
  if (rows.length === 0) {
    return { ctx, currentY }
  }

  const layout = buildTableLayout(block, config)
  const font = getBodyFont(config)
  const headerHeight = layout.rowHeights[0] || 0
  const firstBodyRowHeight = layout.rowHeights[1] || 0
  const minFirstPageHeight = TABLE_MARGIN_TOP + headerHeight + firstBodyRowHeight + TABLE_MARGIN_BOTTOM

  if (currentY + minFirstPageHeight > config.pageHeight - config.padding.bottom) {
    const nextPage = startNewPage()
    ctx = nextPage.ctx
    currentY = nextPage.y
  }

  currentY += TABLE_MARGIN_TOP
  let rowY = currentY
  const startX = config.padding.left

  ctx.font = font
  ctx.textBaseline = 'alphabetic'

  function drawRow(rowIndex: number, y: number): number {
    const rowHeight = layout.rowHeights[rowIndex]
    let cellX = startX
    const isHeader = rowIndex === 0

    for (let colIndex = 0; colIndex < layout.colWidths.length; colIndex++) {
      const colWidth = layout.colWidths[colIndex]
      const lines = layout.wrappedRows[rowIndex]?.[colIndex] || ['']

      drawCellBackground(
        ctx,
        cellX,
        y,
        colWidth,
        rowHeight,
        isHeader
          ? (isInspection ? "#E5E7EB" : theme.quoteBg)
          : (isInspection
            ? theme.quoteBg
            : 'rgba(255,255,255,0.18)'),
        theme.tableBorder || theme.border
      )

      ctx.fillStyle = isHeader
        ? (isInspection ? theme.textHeading : theme.textHeading)
        : theme.text
      ctx.font = isHeader
        ? (isInspection
          ? `700 ${Math.round(config.fontSize * 0.82)}px "SF Mono", "JetBrains Mono", monospace`
          : getBodyFont(config).replace(/\d+px/, (size: string) => `bold ${size}`))
        : font

      let textY = y + CELL_PADDING_Y + config.lineHeight * 0.8
      for (const line of lines) {
        ctx.fillText(line, cellX + CELL_PADDING_X, textY)
        textY += config.lineHeight
      }

      cellX += colWidth
    }

    return y + rowHeight
  }

  rowY = drawRow(0, rowY)
  currentY = rowY

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const rowHeight = layout.rowHeights[rowIndex]
    const remainingHeightNeeded = rowHeight + TABLE_MARGIN_BOTTOM

    if (rowY + remainingHeightNeeded > config.pageHeight - config.padding.bottom) {
      const nextPage = startNewPage()
      ctx = nextPage.ctx
      ctx.font = font
      ctx.textBaseline = 'alphabetic'
      rowY = nextPage.y + TABLE_MARGIN_TOP

      rowY = drawRow(0, rowY)
    }

    rowY = drawRow(rowIndex, rowY)
    currentY = rowY
  }

  currentY = rowY + TABLE_MARGIN_BOTTOM

  return { ctx, currentY }
}
