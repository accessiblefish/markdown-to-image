/**
 * 列表渲染器 - 共享
 */

import type { Block, LayoutConfig, Theme, ListItem } from '../../types'
import { BULLET_WIDTH, BULLET_MARGIN } from '../../config/constants'
import { getBodyFont } from '../utils/fonts'
import { wrapInlineElements } from '../utils/inline-renderer'

export interface ListResult {
  ctx: CanvasRenderingContext2D
  currentY: number
}

function renderListItem(
  ctx: CanvasRenderingContext2D,
  item: ListItem,
  config: LayoutConfig,
  theme: Theme,
  x: number,
  y: number,
  contentWidth: number,
  isOrdered: boolean | undefined,
  index: number
): number {
  const lineHeight = config.lineHeight
  let currentY = y
  
  // 渲染符号或复选框
  ctx.fillStyle = theme.accent
  ctx.font = getBodyFont(config)
  
  if (item.checked !== undefined) {
    // 任务列表 - 绘制复选框
    const boxSize = Math.round(config.fontSize * 0.7)
    const boxX = x + 4
    const boxY = currentY - boxSize + 4
    
    // 绘制方框
    ctx.strokeStyle = theme.textMuted
    ctx.lineWidth = 2
    ctx.strokeRect(boxX, boxY, boxSize, boxSize)
    
    // 如果已选中，绘制对勾
    if (item.checked) {
      ctx.strokeStyle = theme.accent
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(boxX + 3, boxY + boxSize / 2)
      ctx.lineTo(boxX + boxSize / 2 - 1, boxY + boxSize - 4)
      ctx.lineTo(boxX + boxSize - 3, boxY + 3)
      ctx.stroke()
    }
  } else if (isOrdered) {
    ctx.fillText(`${index + 1}.`, x, currentY)
  } else {
    ctx.fillText('•', x + 8, currentY)
  }
  
  // 渲染内容
  const textX = x + BULLET_WIDTH + BULLET_MARGIN
  
  if (item.inlineElements && item.inlineElements.length > 0) {
    const wrapped = wrapInlineElements(ctx, item.inlineElements, contentWidth - BULLET_WIDTH - BULLET_MARGIN, config, theme)
    
    for (let i = 0; i < wrapped.length; i++) {
      const line = wrapped[i]
      let itemX = textX
      
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
        
        ctx.fillText(item.element.content, itemX, currentY)
        itemX += ctx.measureText(item.element.content).width
        ctx.fillStyle = theme.text
      }
      
      currentY += lineHeight
    }
  } else {
    const text = item.text
    ctx.font = getBodyFont(config)
    ctx.fillStyle = theme.text
    
    const words = text.split('')
    let line = ''
    let itemX = textX
    
    for (const char of words) {
      const testLine = line + char
      const testWidth = ctx.measureText(testLine).width
      
      if (testWidth > contentWidth - BULLET_WIDTH - BULLET_MARGIN && line) {
        ctx.fillText(line, itemX, currentY)
        currentY += lineHeight
        line = char
        itemX = textX
      } else {
        line = testLine
      }
    }
    
    if (line) {
      ctx.fillText(line, itemX, currentY)
      currentY += lineHeight
    }
  }
  
  return currentY + 8 // 列表项间距
}

export function renderList(
  ctx: CanvasRenderingContext2D,
  block: Block,
  config: LayoutConfig,
  theme: Theme,
  currentY: number,
  startNewPage: () => { ctx: CanvasRenderingContext2D; y: number }
): ListResult {
  const items = block.items || []
  const isOrdered = block.ordered
  const contentWidth = config.pageWidth - config.padding.left - config.padding.right
  
  // 预估列表高度
  const estimatedHeight = items.length * (config.lineHeight + 16) + 32
  
  // 检查是否需要换页
  if (currentY + estimatedHeight > config.pageHeight - config.padding.bottom) {
    const result = startNewPage()
    ctx = result.ctx
    currentY = result.y
  }
  
  currentY += 16 // 列表顶部间距
  
  const listX = config.padding.left + BULLET_MARGIN
  
  for (let i = 0; i < items.length; i++) {
    // 检查当前项是否需要换页
    const itemHeight = config.lineHeight * 2 + 8
    if (currentY + itemHeight > config.pageHeight - config.padding.bottom) {
      const result = startNewPage()
      ctx = result.ctx
      currentY = result.y + 16
    }
    
    currentY = renderListItem(
      ctx,
      items[i],
      config,
      theme,
      listX,
      currentY,
      contentWidth - BULLET_MARGIN * 2,
      isOrdered,
      i
    )
  }
  
  currentY += 8 // 列表底部间距
  
  return { ctx, currentY }
}
