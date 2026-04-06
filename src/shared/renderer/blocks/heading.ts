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
    ctx.font = font
    ctx.fillStyle = theme.textHeading
    
    // 重新测量文本宽度（使用新 ctx）
    const textWidth = ctx.measureText(text).width
    
    // 垂直居中
    const pageHeight = config.pageHeight - config.padding.top - config.padding.bottom
    currentY = config.padding.top + pageHeight / 2
    
    // 水平居中
    const x = config.pageWidth / 2 - textWidth / 2
    
    // 如果标题太长需要换行
    if (textWidth > contentWidth) {
      // 优先检查是否有手动换行标记（<br>、<br/>、\n）
      const manualBreakPattern = /<br\s*\/?>|\n/g
      const hasManualBreak = manualBreakPattern.test(text)
      
      if (hasManualBreak) {
        // 使用手动换行
        const lines = text.split(manualBreakPattern).map(s => s.trim()).filter(s => s)
        const h1LineHeight = 120
        const totalHeight = lines.length * h1LineHeight
        currentY = config.padding.top + (pageHeight - totalHeight) / 2 + h1LineHeight * 0.8
        
        for (const line of lines) {
          const lineWidth = ctx.measureText(line).width
          const lineX = config.pageWidth / 2 - lineWidth / 2
          ctx.fillText(line, lineX, currentY)
          currentY += h1LineHeight
        }
      } else {
        // 使用 Pretext 自动换行
        const prepared = prepareWithSegments(text, font)
        let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
        
        // 计算总行数来垂直居中（H1 使用 1.2 倍行高，基于 100px 字体）
        const h1LineHeight = 120
        let lines: string[] = []
        let widths: number[] = []
        while (true) {
          const line = layoutNextLine(prepared, cursor, contentWidth)
          if (line === null) break
          lines.push(line.text)
          widths.push(line.width)
          cursor = line.end
        }
        
        const totalHeight = lines.length * h1LineHeight
        currentY = config.padding.top + (pageHeight - totalHeight) / 2 + h1LineHeight * 0.8
        
        for (let i = 0; i < lines.length; i++) {
          const lineX = config.pageWidth / 2 - widths[i] / 2
          ctx.fillText(lines[i], lineX, currentY)
          currentY += h1LineHeight
        }
      }
    } else {
      ctx.fillText(text, x, currentY)
    }
    
    // H1 后强制换页
    const pageResult = startNewPage()
    ctx = pageResult.ctx
    currentY = pageResult.y
    
    return { ctx, currentY }
  }
  
  // 其他标题保持原有逻辑
  const estimatedHeight = 60
  if (currentY + estimatedHeight > config.pageHeight - config.padding.bottom) {
    const result = startNewPage()
    ctx = result.ctx
    currentY = result.y
  }
  
  const marginTop = 24
  const marginBottom = 20
  
  currentY += marginTop
  
  if (textWidth > contentWidth) {
    const prepared = prepareWithSegments(text, font)
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
    let x = config.padding.left
    
    while (true) {
      const line = layoutNextLine(prepared, cursor, contentWidth)
      if (line === null) break
      ctx.fillText(line.text, x, currentY)
      currentY += config.lineHeight * 1.5
      cursor = line.end
    }
  } else {
    ctx.fillText(text, config.padding.left, currentY)
  }
  
  currentY += marginBottom
  
  return { ctx, currentY }
}
