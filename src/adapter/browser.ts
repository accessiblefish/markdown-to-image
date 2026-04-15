/**
 * Browser 平台适配器
 */

import type { PlatformAdapter } from '../shared/types'

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

export function createCanvas(width: number, height: number): CanvasAndContext {
  const canvas = document.createElement('canvas')
  canvas.width = width * RENDER_SCALE
  canvas.height = height * RENDER_SCALE
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.scale(RENDER_SCALE, RENDER_SCALE)
  enhanceTextRendering(ctx)
  return { canvas, ctx }
}

export function parseHTMLString(html: string): Element {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = html
  return wrapper
}

function resolveImagePath(src: string, basePath?: string): string {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:') || src.startsWith('blob:')) {
    return src
  }

  try {
    return new URL(src, basePath || window.location.href).toString()
  } catch {
    return src
  }
}

export const browserAdapter: PlatformAdapter = {
  createCanvas,
  parseHTML: parseHTMLString,
  async loadImage(src: string, basePath?: string) {
    const resolvedSrc = resolveImagePath(src, basePath)

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${resolvedSrc}`))
      img.src = resolvedSrc
    })

    return {
      image,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    }
  },
}
