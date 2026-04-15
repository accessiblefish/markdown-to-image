/**
 * CLI 平台适配器
 * 使用 skia-canvas 和 linkedom (支持 Bun/Node.js)
 */

import { Canvas, loadImage } from 'skia-canvas'
import { parseHTML } from 'linkedom'
import { isAbsolute, resolve } from 'path'
import type { PlatformAdapter } from '../shared/types/index.js'

export interface CanvasAndContext {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

const RENDER_SCALE = 2

function enhanceTextRendering(ctx: CanvasRenderingContext2D): void {
  const originalFillText = ctx.fillText.bind(ctx)
  ctx.fillText = ((text: string, x: number, y: number, maxWidth?: number) => {
    const crispX = Math.round(x)
    const crispY = Math.round(y)
    if (maxWidth !== undefined) {
      originalFillText(text, crispX, crispY, maxWidth)
    } else {
      originalFillText(text, crispX, crispY)
    }
  }) as CanvasRenderingContext2D['fillText']
}

/**
 * 创建 Canvas 和 Context
 * 优化字体渲染质量
 */
export function createCanvas(width: number, height: number): CanvasAndContext {
  const canvas = new Canvas(width * RENDER_SCALE, height * RENDER_SCALE) as unknown as HTMLCanvasElement
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  
  // 设置抗锯齿和质量
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.scale(RENDER_SCALE, RENDER_SCALE)
  enhanceTextRendering(ctx)
  
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

function resolveImagePath(src: string, basePath?: string): string {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:') || src.startsWith('file:')) {
    return src
  }

  if (isAbsolute(src)) {
    return src
  }

  return resolve(basePath || process.cwd(), src)
}

/**
 * CLI 平台适配器 (兼容 Bun/Node.js)
 */
export const cliAdapter: PlatformAdapter = {
  createCanvas,
  parseHTML: parseHTMLString,
  async loadImage(src: string, basePath?: string) {
    const resolvedSrc = resolveImagePath(src, basePath)
    const image = await loadImage(resolvedSrc)
    return {
      image: image as unknown as CanvasImageSource,
      width: image.width,
      height: image.height,
    }
  },
}

/**
 * @deprecated 使用 cliAdapter 替代
 */
export const nodeAdapter = cliAdapter
