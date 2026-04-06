/**
 * 全局配置常量 - 共享
 */

export const DEFAULT_PAGE_WIDTH = 1080
export const DEFAULT_PAGE_HEIGHT = 1440

export const PADDING = {
  top: 100,
  right: 90,
  bottom: 100,
  left: 90,
} as const

// 社交友好的字体配置
export const FONTS = {
  // 正文使用更优雅的字体
  body: '"Source Han Serif SC", "Noto Serif SC", "Songti SC", "SimSun", serif',
  // 标题使用更有冲击力的字体
  heading: '"Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
  // 代码保持等宽
  mono: '"JetBrains Mono", "Fira Code", "SFMono-Regular", Consolas, monospace',
} as const

// 装饰配置
export const DECORATIVE = {
  // 几何图形
  shapes: ['circle', 'triangle', 'wave', 'dot'] as const,
  // 渐变方向
  gradientDirections: ['to-bottom', 'to-right', 'diagonal'] as const,
} as const

export const CODE_PADDING = { x: 28, y: 24 }
export const QUOTE_PADDING = 24
export const BULLET_WIDTH = 36
export const BULLET_MARGIN = 12
