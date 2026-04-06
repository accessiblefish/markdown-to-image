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

// 字体配置 - 三种可选风格
// 使用系统字体确保最佳渲染质量
export const FONT_FAMILIES = {
  // 风格1: 优雅衬线 - 适合长文阅读
  serif: {
    body: '"Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", Georgia, serif',
    heading: '"Heiti SC", "STHeiti", "SimHei", "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  // 风格2: 简洁无衬线 - 适合现代内容
  sans: {
    body: '"Heiti SC", "STHeiti", "SimHei", "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
    heading: '"Heiti SC", "STHeiti", "SimHei", "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  // 风格3: 现代几何 - 适合科技/设计内容
  modern: {
    body: '"Inter", "SF Pro Display", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    heading: '"Inter", "SF Pro Display", "Segoe UI", "PingFang SC", sans-serif',
  },
} as const

// 向后兼容 - 默认使用衬线风格
export const FONTS = {
  ...FONT_FAMILIES.serif,
  mono: '"SF Mono", "Monaco", "Menlo", "Consolas", monospace',
}

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
