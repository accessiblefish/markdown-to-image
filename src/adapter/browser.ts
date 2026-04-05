/**
 * Browser 平台适配器
 */

import type { PlatformAdapter } from '../shared/types'

export interface CanvasAndContext {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

export function createCanvas(width: number, height: number): CanvasAndContext {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  return { canvas, ctx }
}

export function parseHTMLString(html: string): Element {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = html
  return wrapper
}

export const browserAdapter: PlatformAdapter = {
  createCanvas,
  parseHTML: parseHTMLString,
}
