/**
 * 图片渲染器 - 共享
 */

import type { Block, LayoutConfig, PlatformAdapter, Theme } from '../../types'

const IMAGE_MARGIN_TOP = 20
const IMAGE_MARGIN_BOTTOM = 28
const IMAGE_MAX_HEIGHT_RATIO = 0.45

export interface ImageResult {
  ctx: CanvasRenderingContext2D
  currentY: number
}

export async function renderImage(
  ctx: CanvasRenderingContext2D,
  block: Block,
  config: LayoutConfig,
  _theme: Theme,
  currentY: number,
  adapter: PlatformAdapter,
  startNewPage: () => { ctx: CanvasRenderingContext2D; y: number }
): Promise<ImageResult> {
  const src = block.src?.trim()
  if (!src) {
    return { ctx, currentY }
  }

  try {
    const loaded = await adapter.loadImage(src, config.assetBasePath)
    const contentWidth = config.pageWidth - config.padding.left - config.padding.right
    const maxWidth = contentWidth
    const pageMaxHeight = Math.floor(
      (config.pageHeight - config.padding.top - config.padding.bottom) * IMAGE_MAX_HEIGHT_RATIO
    )
    const availableHeight = config.pageHeight - config.padding.bottom - currentY - IMAGE_MARGIN_TOP - IMAGE_MARGIN_BOTTOM
    const maxHeight = Math.max(config.lineHeight * 3, Math.min(pageMaxHeight, availableHeight))

    let scale = Math.min(maxWidth / loaded.width, maxHeight / loaded.height, 1)
    if (!Number.isFinite(scale) || scale <= 0) {
      scale = 1
    }

    const renderWidth = loaded.width * scale
    const renderHeight = loaded.height * scale
    const requiredHeight = IMAGE_MARGIN_TOP + renderHeight + IMAGE_MARGIN_BOTTOM

    if (currentY + requiredHeight > config.pageHeight - config.padding.bottom) {
      const page = startNewPage()
      ctx = page.ctx
      currentY = page.y

      const nextAvailableHeight =
        config.pageHeight - config.padding.bottom - currentY - IMAGE_MARGIN_TOP - IMAGE_MARGIN_BOTTOM
      const nextMaxHeight = Math.max(config.lineHeight * 3, Math.min(pageMaxHeight, nextAvailableHeight))
      scale = Math.min(maxWidth / loaded.width, nextMaxHeight / loaded.height, 1)
      if (!Number.isFinite(scale) || scale <= 0) {
        scale = 1
      }
    }

    const finalWidth = loaded.width * scale
    const finalHeight = loaded.height * scale

    currentY += IMAGE_MARGIN_TOP

    const x = config.padding.left + (contentWidth - finalWidth) / 2
    ctx.drawImage(loaded.image, x, currentY, finalWidth, finalHeight)

    currentY += finalHeight + IMAGE_MARGIN_BOTTOM
  } catch (error) {
    console.warn(`Failed to render image "${src}":`, error)
  }

  return { ctx, currentY }
}
