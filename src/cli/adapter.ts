/**
 * CLI 平台适配器
 * 使用 skia-canvas 和 linkedom (支持 Bun/Node.js)
 */

import { Canvas } from 'skia-canvas'
import { parseHTML } from 'linkedom'
import type { PlatformAdapter } from '../shared/types/index.js'

export interface CanvasAndContext {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

/**
 * 创建 Canvas 和 Context
 */
export function createCanvas(width: number, height: number): CanvasAndContext {
  const canvas = new Canvas(width, height) as unknown as HTMLCanvasElement
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  return { canvas, ctx }
}

/**
 * 解析 HTML 字符串为 DOM 元素
 */
export function parseHTMLString(html: string): Element {
  const { document } = parseHTML(html)
  const wrapper = document.createElement('div')
  wrapper.innerHTML = html
  return wrapper
}

/**
 * CLI 平台适配器 (兼容 Bun/Node.js)
 */
export const cliAdapter: PlatformAdapter = {
  createCanvas,
  parseHTML: parseHTMLString,
}

/**
 * @deprecated 使用 cliAdapter 替代
 */
export const nodeAdapter = cliAdapter
