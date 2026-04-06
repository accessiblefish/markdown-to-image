/**
 * 代码块渲染器 - 共享
 */

import type { Block, LayoutConfig, Theme } from '../../types'
import { renderCodeBlock, renderTextLine } from '../utils/canvas'
import { CODE_PADDING, FONTS } from '../../config/constants'

export interface CodeResult {
  ctx: CanvasRenderingContext2D
  currentY: number
}

// 简单的语法高亮颜色映射
const SYNTAX_COLORS: Record<string, Record<string, string>> = {
  default: {
    keyword: '#ff7b72',
    string: '#a5d6ff',
    comment: '#8b949e',
    function: '#d2a8ff',
    number: '#79c0ff',
    operator: '#ff7b72',
    default: '#f8fafc',
  },
  light: {
    keyword: '#d73a49',
    string: '#032f62',
    comment: '#6a737d',
    function: '#6f42c1',
    number: '#005cc5',
    operator: '#d73a49',
    default: '#24292e',
  },
}

function getSyntaxColor(tokenType: string, isDark: boolean): string {
  const colors = isDark ? SYNTAX_COLORS.default : SYNTAX_COLORS.light
  return colors[tokenType] || colors.default
}

function tokenizeCode(code: string, language?: string): Array<{ text: string; type: string }> {
  const tokens: Array<{ text: string; type: string }> = []
  const lines = code.split('\n')
  
  for (const line of lines) {
    // 简单的高亮规则
    let remaining = line
    
    while (remaining.length > 0) {
      // 字符串
      const stringMatch = remaining.match(/^(["'])(.*?)\1/)
      if (stringMatch) {
        tokens.push({ text: stringMatch[0], type: 'string' })
        remaining = remaining.slice(stringMatch[0].length)
        continue
      }
      
      // 关键字
      const keywordMatch = remaining.match(/^(function|const|let|var|if|else|for|while|return|import|export|class|async|await|from)\b/)
      if (keywordMatch) {
        tokens.push({ text: keywordMatch[0], type: 'keyword' })
        remaining = remaining.slice(keywordMatch[0].length)
        continue
      }
      
      // 注释
      const commentMatch = remaining.match(/^\/\/.*$/)
      if (commentMatch) {
        tokens.push({ text: commentMatch[0], type: 'comment' })
        remaining = remaining.slice(commentMatch[0].length)
        continue
      }
      
      // 数字
      const numberMatch = remaining.match(/^\d+(\.\d+)?/)
      if (numberMatch) {
        tokens.push({ text: numberMatch[0], type: 'number' })
        remaining = remaining.slice(numberMatch[0].length)
        continue
      }
      
      // 默认：单个字符
      tokens.push({ text: remaining[0], type: 'default' })
      remaining = remaining.slice(1)
    }
    
    tokens.push({ text: '\n', type: 'default' })
  }
  
  return tokens
}

export function renderCode(
  ctx: CanvasRenderingContext2D,
  block: Block,
  config: LayoutConfig,
  theme: Theme,
  currentY: number,
  startNewPage: () => { ctx: CanvasRenderingContext2D; y: number }
): CodeResult {
  const code = block.content
  const language = block.language
  const lines = code.split('\n')
  
  const contentWidth = config.pageWidth - config.padding.left - config.padding.right
  const codeWidth = contentWidth
  const lineHeight = config.lineHeight * 1.2
  const codeFont = `${Math.round(config.fontSize * 0.9 * 0.9)}px ${FONTS.mono}`
  
  const minLines = Math.min(lines.length, 20)
  const codeHeight = minLines * lineHeight + CODE_PADDING.y * 2
  
  // 检查是否需要换页
  if (currentY + codeHeight > config.pageHeight - config.padding.bottom) {
    const result = startNewPage()
    ctx = result.ctx
    currentY = result.y
  }
  
  // 渲染代码块背景
  const codeX = config.padding.left
  const codeY = currentY
  renderCodeBlock(ctx, codeX, codeY, codeWidth, codeHeight, theme)
  
  // 如果有语言标签，渲染它
  if (language) {
    ctx.fillStyle = theme.textMuted
    ctx.font = `12px ${FONTS.mono}`
    ctx.textAlign = 'right'
    ctx.fillText(language, codeX + codeWidth - CODE_PADDING.x, codeY + 20)
    ctx.textAlign = 'left'
  }
  
  // 渲染代码内容
  ctx.font = codeFont
  const isDark = theme.codeBg === '#1e293b' || theme.codeBg === '#2d2a26'
  
  let y = codeY + CODE_PADDING.y + lineHeight * 0.8
  let maxLines = Math.floor((codeHeight - CODE_PADDING.y * 2) / lineHeight)
  
  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    const line = lines[i]
    const tokens = tokenizeCode(line, language)
    let x = codeX + CODE_PADDING.x
    
    for (const token of tokens) {
      if (token.text === '\n') continue
      
      ctx.fillStyle = getSyntaxColor(token.type, isDark)
      ctx.fillText(token.text, x, y)
      x += ctx.measureText(token.text).width
    }
    
    y += lineHeight
  }
  
  currentY += codeHeight + 24 // 代码块间距
  
  return { ctx, currentY }
}
