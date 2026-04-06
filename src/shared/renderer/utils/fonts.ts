/**
 * 字体工具 - 共享
 */

import type { LayoutConfig } from '../../types'

export function getHeadingFont(config: LayoutConfig, level: number = 1): string {
  // H1 使用特殊样式：粗体无衬线字体，100px，字重 700
  if (level === 1) {
    return `700 100px "Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`
  }
  // 其他标题使用优雅的无衬线字体
  const sizes = [42, 36, 30, 26, 22, 20]
  const size = sizes[level - 1] || 20
  const weights = [700, 700, 600, 600, 600, 600]
  const weight = weights[level - 1] || 600
  return `${weight} ${size}px "Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`
}

export function getBodyFont(config: LayoutConfig): string {
  // 正文使用衬线字体，更有阅读感
  return `${config.fontSize}px "Source Han Serif SC", "Noto Serif SC", "Songti SC", "SimSun", serif`
}

export function getCodeFont(config: LayoutConfig): string {
  return `${Math.round(config.fontSize * 0.9)}px "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace`
}

export function getInlineCodeFont(config: LayoutConfig): string {
  return `${Math.round(config.fontSize * 0.85)}px "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace`
}
