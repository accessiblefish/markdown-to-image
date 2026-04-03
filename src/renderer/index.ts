/**
 * 主渲染器
 * 将 Markdown Blocks 渲染为 Canvas 页面
 */

import type { Block, LayoutConfig } from '../types'
import { getTheme } from '../config/themes'
import { FONTS } from '../config/constants'
import { parseMarkdownToBlocks } from '../parser/markdown'
import { createCanvas, renderBackground, renderPageFooter } from './utils/canvas'
import {
  renderHeading,
  renderParagraph,
  renderCode,
  renderBlockQuote,
  renderList,
  renderTable,
  renderHorizontalRule,
} from './blocks'

interface PageContext {
  pages: HTMLCanvasElement[]
  currentCanvas: HTMLCanvasElement | null
  currentCtx: CanvasRenderingContext2D | null
  currentY: number
}

/**
 * 渲染 Markdown 为页面
 */
export async function renderToPages(
  markdown: string,
  config: LayoutConfig
): Promise<HTMLCanvasElement[]> {
  const blocks = parseMarkdownToBlocks(markdown)
  const theme = getTheme(config.theme)

  const context: PageContext = {
    pages: [],
    currentCanvas: null,
    currentCtx: null,
    currentY: config.padding.top,
  }

  function startNewPage(): { ctx: CanvasRenderingContext2D; y: number } {
    const { canvas, ctx } = createCanvas(config.pageWidth, config.pageHeight)
    renderBackground(ctx, config)

    renderPageFooter(ctx, config, context.pages.length + 1, FONTS)

    context.pages.push(canvas)
    context.currentCanvas = canvas
    context.currentCtx = ctx
    context.currentY = config.padding.top

    return { ctx, y: context.currentY }
  }

  // 创建第一页
  let { ctx } = startNewPage()

  for (const block of blocks) {
    switch (block.type) {
      case 'heading': {
        const result = renderHeading(ctx, block, config, theme, context.currentY, startNewPage)
        ctx = result.ctx
        context.currentY = result.currentY
        break
      }

      case 'paragraph': {
        const result = renderParagraph(ctx, block, config, theme, context.currentY, startNewPage)
        ctx = result.ctx
        context.currentY = result.currentY
        break
      }

      case 'blockquote': {
        const result = renderBlockQuote(ctx, block, config, theme, context.currentY, startNewPage)
        ctx = result.ctx
        context.currentY = result.currentY
        break
      }

      case 'code': {
        const result = renderCode(ctx, block, config, theme, context.currentY, startNewPage)
        ctx = result.ctx
        context.currentY = result.currentY
        break
      }

      case 'list':
      case 'taskList': {
        const result = renderList(ctx, block, config, theme, context.currentY, startNewPage)
        ctx = result.ctx
        context.currentY = result.currentY
        break
      }

      case 'table': {
        context.currentY = renderTable(ctx, block, config, theme, context.currentY)
        break
      }

      case 'hr': {
        const result = renderHorizontalRule(ctx, config, theme, context.currentY, startNewPage)
        ctx = result.ctx
        context.currentY = result.currentY
        break
      }
    }
  }

  return context.pages
}
