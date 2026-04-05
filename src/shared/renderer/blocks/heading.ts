/**
 * 标题渲染器 - 共享
 */

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
  
  // 检查是否需要换页
  const estimatedHeight = level === 1 ? 80 : 60
  if (currentY + estimatedHeight > config.pageHeight - config.padding.bottom) {
    const result = startNewPage()
    ctx = result.ctx
    currentY = result.y
  }
  
  // 标题间距
  const marginTop = level === 1 ? 40 : 24
  const marginBottom = level === 1 ? 30 : 20
  
  currentY += marginTop
  
  // 如果标题太长需要换行
  if (textWidth > contentWidth) {
    const words = text.split('')
    let line = ''
    let x = config.padding.left
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i]
      const testWidth = ctx.measureText(testLine).width
      
      if (testWidth > contentWidth && line) {
        ctx.fillText(line, x, currentY)
        currentY += config.lineHeight * 1.5
        line = words[i]
      } else {
        line = testLine
      }
    }
    
    if (line) {
      ctx.fillText(line, x, currentY)
    }
  } else {
    ctx.fillText(text, config.padding.left, currentY)
  }
  
  currentY += marginBottom
  
  return { ctx, currentY }
}
