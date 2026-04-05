/**
 * 引用块渲染器 - 共享
 */

import type { Block, LayoutConfig, Theme } from '../../types'
import { renderBlockQuote as renderBlockQuoteBackground } from '../utils/canvas'
import { QUOTE_PADDING } from '../../config/constants'
import { getBodyFont } from '../utils/fonts'
import { wrapInlineElements } from '../utils/inline-renderer'

export interface BlockQuoteResult {
  ctx: CanvasRenderingContext2D
  currentY: number
}

export function renderBlockQuote(
  ctx: CanvasRenderingContext2D,
  block: Block,
  config: LayoutConfig,
  theme: Theme,
  currentY: number,
  startNewPage: () => { ctx: CanvasRenderingContext2D; y: number }
): BlockQuoteResult {
  const contentWidth = config.pageWidth - config.padding.left - config.padding.right - QUOTE_PADDING * 2
  const lineHeight = config.lineHeight
  
  // 计算引用块高度
  let quoteHeight = QUOTE_PADDING * 2
  
  if (block.inlineElements && block.inlineElements.length > 0) {
    const wrapped = wrapInlineElements(ctx, block.inlineElements, contentWidth, config, theme)
    quoteHeight += wrapped.length * lineHeight
  } else {
    ctx.font = getBodyFont(config)
    const text = block.content
    const words = text.split('')
    let line = ''
    let lineCount = 1
    
    for (const char of words) {
      const testLine = line + char
      const testWidth = ctx.measureText(testLine).width
      
      if (testWidth > contentWidth && line) {
        lineCount++
        line = char
      } else {
        line = testLine
      }
    }
    
    quoteHeight += lineCount * lineHeight
  }
  
  // 检查是否需要换页
  if (currentY + quoteHeight > config.pageHeight - config.padding.bottom) {
    const result = startNewPage()
    ctx = result.ctx
    currentY = result.y
  }
  
  // 渲染引用块背景
  const quoteX = config.padding.left
  const quoteY = currentY
  const quoteWidth = config.pageWidth - config.padding.left - config.padding.right
  
  renderBlockQuoteBackground(ctx, quoteX, quoteY, quoteWidth, quoteHeight, theme)
  
  // 渲染引用内容
  let textY = quoteY + QUOTE_PADDING + lineHeight * 0.8
  
  if (block.inlineElements && block.inlineElements.length > 0) {
    const wrapped = wrapInlineElements(ctx, block.inlineElements, contentWidth, config, theme)
    
    for (const line of wrapped) {
      let x = quoteX + QUOTE_PADDING + 12 // 左边框偏移
      
      for (const item of line) {
        ctx.font = getBodyFont(config)
        ctx.fillStyle = theme.text
        
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
        
        ctx.fillText(item.element.content, x, textY)
        x += ctx.measureText(item.element.content).width
        ctx.fillStyle = theme.text
      }
      
      textY += lineHeight
    }
  } else {
    ctx.font = getBodyFont(config)
    ctx.fillStyle = theme.text
    
    const text = block.content
    const words = text.split('')
    let line = ''
    let x = quoteX + QUOTE_PADDING + 12
    
    for (const char of words) {
      const testLine = line + char
      const testWidth = ctx.measureText(testLine).width
      
      if (testWidth > contentWidth && line) {
        ctx.fillText(line, x, textY)
        textY += lineHeight
        line = char
      } else {
        line = testLine
      }
    }
    
    if (line) {
      ctx.fillText(line, x, textY)
    }
  }
  
  currentY += quoteHeight + 24
  
  return { ctx, currentY }
}
