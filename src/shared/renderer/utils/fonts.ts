/**
 * 字体工具 - 共享
 */

import type { LayoutConfig } from '../../types'

export function getHeadingFont(config: LayoutConfig, level: number = 1): string {
  // H1 使用特殊样式：Inter 字体，100px，字重 550，字间距 -0.05em
  if (level === 1) {
    return `550 100px Inter, -apple-system, BlinkMacSystemFont, sans-serif`
  }
  const sizes = [42, 36, 30, 26, 22, 20]
  const size = sizes[level - 1] || 20
  const weights = [700, 700, 600, 600, 600, 600]
  const weight = weights[level - 1] || 600
  return `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
}

export function getBodyFont(config: LayoutConfig): string {
  return `${config.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`
}

export function getCodeFont(config: LayoutConfig): string {
  return `${Math.round(config.fontSize * 0.9)}px "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace`
}

export function getInlineCodeFont(config: LayoutConfig): string {
  return `${Math.round(config.fontSize * 0.85)}px "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace`
}
