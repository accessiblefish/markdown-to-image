/**
 * 字体工具 - 共享
 */

import type { LayoutConfig } from '../../types'
import { FONT_FAMILIES } from '../../config/constants'

// 获取字体家族配置
function getFontFamily(config: LayoutConfig) {
  const key = config.fontFamily || 'serif'
  return FONT_FAMILIES[key as keyof typeof FONT_FAMILIES] || FONT_FAMILIES.serif
}

export function getHeadingFont(config: LayoutConfig, level: number = 1): string {
  const fontFamily = getFontFamily(config)
  
  // H1 使用特殊样式：粗体无衬线字体，100px，字重 700
  if (level === 1) {
    return `700 100px ${fontFamily.heading}`
  }
  
  // 其他标题使用优雅的无衬线字体
  const sizes = [42, 36, 30, 26, 22, 20]
  const size = sizes[level - 1] || 20
  const weights = [700, 700, 600, 600, 600, 600]
  const weight = weights[level - 1] || 600
  return `${weight} ${size}px ${fontFamily.heading}`
}

export function getBodyFont(config: LayoutConfig): string {
  const fontFamily = getFontFamily(config)
  return `${config.fontSize}px ${fontFamily.body}`
}

export function getCodeFont(config: LayoutConfig): string {
  return `${Math.round(config.fontSize * 0.9)}px "JetBrains Mono", "Fira Code", "SFMono-Regular", Consolas, monospace`
}

export function getInlineCodeFont(config: LayoutConfig): string {
  // inspection 主题需要与正文更接近的视觉字号，其余主题保留更紧凑的 inline code
  const scale = config.theme === 'inspection' ? 0.9 : 0.73
  return `${Math.round(config.fontSize * scale)}px "JetBrains Mono", "Fira Code", "SFMono-Regular", Consolas, monospace`
}
