/**
 * 标题渲染器 - 共享
 */

import { prepareWithSegments, layoutNextLine, type LayoutCursor } from '@chenglou/pretext'
import type { Block, LayoutConfig, Theme } from '../../types'
import type { CreateCanvasFn } from '../utils/canvas'
import { getHeadingFont } from '../utils/fonts'
import { renderPageFooter, renderBackground } from '../utils/canvas'
import { FONTS } from '../../config/constants'
import { getTheme } from '../../config/themes'

export interface HeadingResult {
  ctx: CanvasRenderingContext2D
  currentY: number
}

function getPosterLines(
  text: string,
  font: string,
  maxWidth: number
): Array<{ text: string; width: number }> {
  const manualBreakPattern = /<br\s*\/?>|\n/g
  if (manualBreakPattern.test(text)) {
    const canvas = new OffscreenCanvas(1, 1)
    const measure = canvas.getContext('2d')
    if (!measure) return []
    measure.font = font

    return text
      .split(manualBreakPattern)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({ text: line, width: measure.measureText(line).width }))
  }

  const prepared = prepareWithSegments(text, font)
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  const lines: Array<{ text: string; width: number }> = []

  while (true) {
    const line = layoutNextLine(prepared, cursor, maxWidth)
    if (line === null) break
    lines.push({ text: line.text, width: line.width })
    cursor = line.end
  }

  return lines
}

export function renderHeading(
  ctx: CanvasRenderingContext2D,
  block: Block,
  config: LayoutConfig,
  theme: Theme,
  currentY: number,
  startNewPage: () => { ctx: CanvasRenderingContext2D; y: number }
): HeadingResult {
  const level = block.level || 1
  const font = getHeadingFont(config, level)
  const text = block.content
  const isInspection = config.theme === 'inspection'
  
  ctx.font = font
  ctx.fillStyle = theme.textHeading
  
  const textWidth = ctx.measureText(text).width
  const contentWidth = config.pageWidth - config.padding.left - config.padding.right
  
  // H1 单独一页，居中显示
  if (level === 1) {
    // 如果当前页面已经有内容（不是顶部），则换到新页面
    if (currentY > config.padding.top + 50) {
      const result = startNewPage()
      ctx = result.ctx
      currentY = result.y
    }
    
    // 重新设置字体（确保新页面的 ctx 有正确设置）
    const posterFont = isInspection
      ? `800 88px "SF Mono", "JetBrains Mono", "Fira Code", monospace`
      : font
    ctx.font = posterFont
    ctx.fillStyle = theme.textHeading
    
    const posterMaxWidth = Math.min(contentWidth, config.pageWidth * (isInspection ? 0.68 : 0.74))
    const lines = getPosterLines(text, posterFont, posterMaxWidth)

    if (isInspection) {
      const frameX = config.padding.left
      const frameY = 248
      const frameWidth = contentWidth
      const frameHeight = 520
      const startX = frameX + 56
      const blockTop = frameY + 210
      const h1LineHeight = 126
      let textY = blockTop

      ctx.save()
      ctx.strokeStyle = theme.textHeading
      ctx.lineWidth = 1.5
      ctx.strokeRect(frameX, frameY, frameWidth, frameHeight)
      ctx.strokeStyle = theme.tableBorder || theme.border
      ctx.lineWidth = 1
      ctx.strokeRect(frameX + 14, frameY + 14, frameWidth - 28, frameHeight - 28)
      ctx.restore()

      ctx.font = posterFont
      ctx.fillStyle = theme.textHeading

      if (lines.length > 0) {
        for (const line of lines) {
          ctx.fillText(line.text, startX, textY)
          textY += h1LineHeight
        }
        currentY = frameY + frameHeight
      } else {
        ctx.fillText(text, startX, blockTop)
        currentY = frameY + frameHeight
      }
    } else {
      const h1LineHeight = 168
      const blockTop = 380
      const startX = config.padding.left + 38
      let textY = blockTop

      if (lines.length > 0) {
        for (const line of lines) {
          ctx.fillText(line.text, startX, textY)
          textY += h1LineHeight
        }
        currentY = textY
      } else {
        currentY = blockTop
        ctx.fillText(text, startX, currentY)
      }
    }
    
    // H1 后添加下边距，然后强制换页
    currentY += 60 // H1 下边距
    
    // 检查是否需要换页（如果下边距导致超出页面）
    if (currentY > config.pageHeight - config.padding.bottom) {
      const pageResult = startNewPage()
      ctx = pageResult.ctx
      currentY = pageResult.y
    } else {
      // 不需要换页，但创建新页面给后续内容
      const pageResult = startNewPage()
      ctx = pageResult.ctx
      currentY = pageResult.y
    }
    
    return { ctx, currentY }
  }
  
  // 其他标题（H2-H6）调整边距
  const marginTop = level === 2 ? 24 : 20
  const marginBottom = level === 2 ? 40 : 32
  
  // 预估高度检查是否需要换页
  const estimatedHeight = marginTop + config.lineHeight + marginBottom
  if (currentY + estimatedHeight > config.pageHeight - config.padding.bottom) {
    const result = startNewPage()
    ctx = result.ctx
    currentY = result.y
  }
  
  currentY += marginTop
  
  // 重新设置字体（确保换页后的 ctx 有正确设置）
  ctx.font = isInspection && level <= 3
    ? `700 ${level === 2 ? 32 : 24}px "SF Mono", "JetBrains Mono", monospace`
    : font
  ctx.fillStyle = theme.textHeading

  if (isInspection && level === 2) {
    const barY = currentY - 18
    const textX = config.padding.left + 30
    ctx.fillRect(config.padding.left, barY, 14, 56)
    ctx.fillText(text, textX, currentY + 24)
    ctx.strokeStyle = theme.tableBorder || theme.border
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(textX, currentY + 40)
    ctx.lineTo(config.pageWidth - config.padding.right, currentY + 40)
    ctx.stroke()
    currentY += 72
    return { ctx, currentY: currentY + 8 }
  }
  
  if (textWidth > contentWidth) {
    const prepared = prepareWithSegments(text, font)
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
    let x = config.padding.left
    
    while (true) {
      const line = layoutNextLine(prepared, cursor, contentWidth)
      if (line === null) break
      ctx.fillText(line.text, x, currentY)
      currentY += config.lineHeight * 1.2
      cursor = line.end
    }
  } else {
    ctx.fillText(text, config.padding.left, currentY)
  }
  
  currentY += marginBottom
  
  return { ctx, currentY }
}
