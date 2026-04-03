/**
 * 字体和排版工具
 */

import { prepareWithSegments, type PreparedTextWithSegments, type LayoutCursor } from '@chenglou/pretext'
import { FONTS } from '../../config/constants'
import type { LayoutConfig, FontType } from '../../types'

/**
 * 获取字体字符串
 */
export function getFontString(
  config: LayoutConfig,
  type: FontType = 'body',
  level = 1
): string {
  const { fontSize } = config

  switch (type) {
    case 'heading': {
      const sizes = [
        fontSize * 1.85,
        fontSize * 1.55,
        fontSize * 1.25,
        fontSize * 1.1,
        fontSize * 1.05,
        fontSize,
      ]
      return `600 ${sizes[level - 1]}px ${FONTS.body}`
    }
    case 'code':
      return `${Math.round(fontSize * 0.9)}px ${FONTS.mono}`
    case 'inlineCode':
      return `${Math.round(fontSize * 0.875)}px ${FONTS.mono}`
    case 'small':
      return `400 ${Math.round(fontSize * 0.875)}px ${FONTS.body}`
    default:
      return `400 ${Math.round(fontSize)}px ${FONTS.body}`
  }
}

/**
 * 准备文本用于排版
 */
export function prepareText(
  text: string,
  font: string,
  preserveWhitespace = false
): PreparedTextWithSegments {
  return prepareWithSegments(
    text,
    font,
    preserveWhitespace ? { whiteSpace: 'pre-wrap' } : undefined
  )
}

/**
 * 检查是否还有更多文本需要排版
 */
export function hasMoreText(
  prepared: PreparedTextWithSegments,
  cursor: LayoutCursor
): boolean {
  const segment = prepared.segments[cursor.segmentIndex]
  if (!segment) return false

  return (
    cursor.segmentIndex < prepared.segments.length - 1 ||
    (cursor.segmentIndex === prepared.segments.length - 1 &&
      cursor.graphemeIndex < segment.length)
  )
}
