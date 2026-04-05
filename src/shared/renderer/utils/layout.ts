/**
 * 布局工具 - 共享
 */

import type { LayoutConfig, Padding } from '../../types'

export function getContentWidth(config: LayoutConfig): number {
  return config.pageWidth - config.padding.left - config.padding.right
}

export function getContentHeight(config: LayoutConfig): number {
  return config.pageHeight - config.padding.top - config.padding.bottom
}

export function getAvailableHeight(config: LayoutConfig, currentY: number): number {
  return config.pageHeight - config.padding.bottom - currentY
}

export function needsNewPage(config: LayoutConfig, currentY: number, requiredHeight: number): boolean {
  return currentY + requiredHeight > config.pageHeight - config.padding.bottom
}

export function calculateLines(text: string, maxWidth: number, charWidth: number): number {
  const charsPerLine = Math.floor(maxWidth / charWidth)
  return Math.ceil(text.length / charsPerLine)
}
