/**
 * 段落渲染器 - 共享
 */

import { prepareWithSegments, layoutNextLine, type LayoutCursor } from '@chenglou/pretext'
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
        
        // 使用 Pretext 计算的 x 位置（包含 gapBefore）
        ctx.fillText(item.element.content, config.padding.left + item.x, currentY)
        ctx.fillStyle = theme.text // 重置颜色
      }
      currentY += lineHeight
    }
    
    currentY += 12 // 下边距
  } else {
    // 纯文本渲染 - 使用 Pretext 进行正确的文本换行
    const text = block.content
    const font = getBodyFont(config)
    
    // 使用 Pretext 准备和布局文本
    const prepared = prepareWithSegments(text, font)
    const lines: { text: string; width: number }[] = []
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
    
    while (true) {
      const line = layoutNextLine(prepared, cursor, contentWidth)
      if (line === null) break
      lines.push({ text: line.text, width: line.width })
      cursor = line.end
    }
    
    const totalHeight = lines.length * lineHeight + 24
    
    // 检查是否需要换页
    if (currentY + totalHeight > config.pageHeight - config.padding.bottom) {
      const result = startNewPage()
      ctx = result.ctx
      currentY = result.y
    }
    
    currentY += 12 // 上边距
    
    // 渲染每一行
    ctx.font = font
    ctx.fillStyle = theme.text
    for (const line of lines) {
      ctx.fillText(line.text, config.padding.left, currentY)
      currentY += lineHeight
    }
    
    currentY += 12 // 下边距
  }
  
  return { ctx, currentY }
}
