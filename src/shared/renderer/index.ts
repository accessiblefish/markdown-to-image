/**
 * 主渲染器 - 共享
 * 将 Markdown Blocks 渲染为 Canvas 页面
 */

import type { Block, LayoutConfig, ThemeKey } from '../types'
import type { CreateCanvasFn } from './utils/canvas'
import { getTheme } from '../config/themes'
import { FONTS, PADDING } from '../config/constants'
import { parseMarkdownToBlocks } from '../parser/markdown'
import type { PlatformAdapter } from '../types'
import { renderBackground, renderPageFooter } from './utils/canvas'
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

export interface RenderOptions {
  markdown: string
  config: LayoutConfig
  createCanvas: CreateCanvasFn
  adapter: PlatformAdapter
}

/**
 * 渲染 Markdown 为页面
 */
export async function renderToPages(
  options: RenderOptions
): Promise<HTMLCanvasElement[]> {
  const { markdown, config, createCanvas, adapter } = options
  
  const blocks = await parseMarkdownToBlocks(markdown, adapter)
  const theme = getTheme(config.theme)

  const context: PageContext = {
    pages: [],
    currentCanvas: null,
    currentCtx: null,
    currentY: config.padding.top,
  }

  function startNewPage(): { ctx: CanvasRenderingContext2D; y: number } {
    const { canvas, ctx } = createCanvas(config.pageWidth, config.pageHeight)
    renderBackground(ctx, config, theme.bg)
    renderPageFooter(ctx, config, context.pages.length + 1, FONTS, theme.textMuted)

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

/**
 * 创建默认布局配置
 * 与 Web 版保持一致
 */
export function createLayoutConfig(options: Partial<LayoutConfig> = {}): LayoutConfig {
  const fontSize = options.fontSize ?? 30
  const lineHeight = options.lineHeight ?? Math.round(fontSize * 1.3)
  
  return {
    pageWidth: 1080,
    pageHeight: 1440,
    padding: PADDING,
    fontSize,
    lineHeight,
    theme: 'light',
    ...options,
  }
}

export { getTheme, THEMES } from '../config/themes'
export { PADDING, FONTS, DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT } from '../config/constants'
