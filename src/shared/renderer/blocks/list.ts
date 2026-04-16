/**
 * 列表渲染器 - 共享
 */

import type { Block, LayoutConfig, Theme, ListItem } from '../../types'
import { BULLET_WIDTH, BULLET_MARGIN } from '../../config/constants'
import { getBodyFont, getInlineCodeFont } from '../utils/fonts'
import { wrapInlineElements, renderInlineCodeToken } from '../utils/inline-renderer'

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
  ctx.font = getBodyFont(config)
  
  if (item.checked !== undefined) {
    // 任务列表 - 绘制更有设计感的复选框
    const boxSize = Math.round(config.fontSize * 0.75)
    const boxX = x + 4
    const boxY = currentY - boxSize + 4
    
    // 绘制圆角方框背景
    ctx.fillStyle = item.checked ? theme.accent : 'transparent'
    ctx.beginPath()
    // @ts-ignore
    if (ctx.roundRect) {
      ctx.roundRect(boxX, boxY, boxSize, boxSize, 4)
    } else {
      ctx.fillRect(boxX, boxY, boxSize, boxSize)
    }
    // @ts-ignore
    if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxSize, boxSize, 4)
    ctx.fill()
    
    // 绘制边框
    ctx.strokeStyle = item.checked ? theme.accent : theme.textMuted
    ctx.lineWidth = 2
    ctx.beginPath()
    // @ts-ignore
    if (ctx.roundRect) {
      ctx.roundRect(boxX, boxY, boxSize, boxSize, 4)
    } else {
      ctx.strokeRect(boxX, boxY, boxSize, boxSize)
    }
    // @ts-ignore
    if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxSize, boxSize, 4)
    ctx.stroke()
    
    // 如果已选中，绘制对勾
    if (item.checked) {
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(boxX + 4, boxY + boxSize / 2 + 1)
      ctx.lineTo(boxX + boxSize / 2, boxY + boxSize - 5)
      ctx.lineTo(boxX + boxSize - 4, boxY + 5)
      ctx.stroke()
    }
  } else if (isOrdered) {
    // 有序列表使用更醒目的样式
    ctx.fillStyle = theme.accent
    ctx.font = `bold ${config.fontSize * 0.73}px ${getBodyFont(config).split('px')[1] || 'sans-serif'}`
    ctx.fillText(`${index + 1}.`, x, currentY)
  } else {
    // 无序列表使用更精致的圆点
    ctx.fillStyle = theme.accent
    ctx.beginPath()
    ctx.arc(x + 10, currentY - 5, 4, 0, Math.PI * 2)
    ctx.fill()
  }
  
  // 渲染内容
  const textX = x + BULLET_WIDTH + BULLET_MARGIN
  
  if (item.inlineElements && item.inlineElements.length > 0) {
    const wrapped = wrapInlineElements(ctx, item.inlineElements, contentWidth - BULLET_WIDTH - BULLET_MARGIN, config, theme)
    
    for (let i = 0; i < wrapped.length; i++) {
      const line = wrapped[i]
      
      for (const lineItem of line) {
        ctx.font = getBodyFont(config)
        ctx.fillStyle = theme.text
        
        if (lineItem.element.type === 'strong') {
          ctx.font = getBodyFont(config).replace(/\d+px/, (size: string) => `bold ${size}`)
        } else if (lineItem.element.type === 'em') {
          ctx.font = getBodyFont(config).replace(/\d+px/, (size: string) => `italic ${size}`)
        } else if (lineItem.element.type === 'code') {
          renderInlineCodeToken(
            ctx,
            lineItem.element.content,
            textX + lineItem.x,
            currentY,
            config,
            theme
          )
          ctx.fillStyle = theme.text
          continue
        } else if (lineItem.element.type === 'link') {
          ctx.fillStyle = theme.link
        }
        
        // 使用 Pretext 计算的 x 位置（包含 gapBefore）
        ctx.fillText(lineItem.element.content, textX + lineItem.x, currentY)
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
