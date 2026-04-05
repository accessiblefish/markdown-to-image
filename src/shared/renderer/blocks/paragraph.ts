/**
 * 段落渲染器 - 共享
 */

import type { Block, LayoutConfig, Theme } from '../../types'
import { getBodyFont } from '../utils/fonts'
import { wrapInlineElements, renderWrappedInlineElements } from '../utils/inline-renderer'

export interface ParagraphResult {
  ctx: CanvasRenderingContext2D
  currentY: number
}

export function renderParagraph(
  ctx: CanvasRenderingContext2D,
  block: Block,
  config: LayoutConfig,
  theme: Theme,
  currentY: number,
  startNewPage: () => { ctx: CanvasRenderingContext2D; y: number }
): ParagraphResult {
  const contentWidth = config.pageWidth - config.padding.left - config.padding.right
  const lineHeight = config.lineHeight
  
  // 检查是否有行内元素需要特殊渲染
  if (block.inlineElements && block.inlineElements.length > 0) {
    const wrapped = wrapInlineElements(ctx, block.inlineElements, contentWidth, config, theme)
    const totalHeight = wrapped.length * lineHeight + 24 // 上下边距
    
    // 检查是否需要换页
    if (currentY + totalHeight > config.pageHeight - config.padding.bottom) {
      const result = startNewPage()
      ctx = result.ctx
      currentY = result.y
    }
    
    currentY += 12 // 上边距
    
    for (const line of wrapped) {
      let x = config.padding.left
      for (const item of line) {
        ctx.font = getBodyFont(config)
        ctx.fillStyle = theme.text
        
        // 处理不同样式
        if (item.element.type === 'strong') {
          ctx.font = getBodyFont(config).replace(/\d+px/, (size: string) => `bold ${size}`)
        } else if (item.element.type === 'em') {
          ctx.font = getBodyFont(config).replace(/\d+px/, (size: string) => `italic ${size}`)
        } else if (item.element.type === 'code') {
          ctx.font = `${Math.round(config.fontSize * 0.85)}px monospace`
          ctx.fillStyle = theme.inlineCodeText
        } else if (item.element.type === 'link') {
          ctx.fillStyle = theme.link
        }
        
        ctx.fillText(item.element.content, x, currentY)
        x += ctx.measureText(item.element.content).width
        ctx.fillStyle = theme.text // 重置颜色
      }
      currentY += lineHeight
    }
    
    currentY += 12 // 下边距
  } else {
    // 纯文本渲染
    const text = block.content
    ctx.font = getBodyFont(config)
    
    const words = text.split(/(\s+)/)
    let line = ''
    let lineWidth = 0
    
    const charWidth = ctx.measureText('中').width
    const estimatedLines = Math.ceil(text.length * charWidth / contentWidth) + 1
    const totalHeight = estimatedLines * lineHeight + 24
    
    // 检查是否需要换页
    if (currentY + totalHeight > config.pageHeight - config.padding.bottom) {
      const result = startNewPage()
      ctx = result.ctx
      currentY = result.y
    }
    
    currentY += 12 // 上边距
    
    for (const word of words) {
      const testLine = line + word
      const testWidth = ctx.measureText(testLine).width
      
      if (testWidth > contentWidth && line) {
        ctx.fillStyle = theme.text
        ctx.fillText(line, config.padding.left, currentY)
        currentY += lineHeight
        line = word
      } else {
        line = testLine
      }
    }
    
    if (line) {
      ctx.fillStyle = theme.text
      ctx.fillText(line, config.padding.left, currentY)
      currentY += lineHeight
    }
    
    currentY += 12 // 下边距
  }
  
  return { ctx, currentY }
}
