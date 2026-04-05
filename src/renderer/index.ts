/**
 * Web 渲染器
 * 包装 shared renderer，使用浏览器适配器
 */

import type { LayoutConfig } from '../shared/types'
import { renderToPages as sharedRenderToPages } from '../shared/renderer'
import { browserAdapter } from '../adapter/browser'

/**
 * 渲染 Markdown 为页面（Web 版本）
 */
export async function renderToPages(
  markdown: string,
  config: LayoutConfig
): Promise<HTMLCanvasElement[]> {
  return sharedRenderToPages({
    markdown,
    config,
    createCanvas: browserAdapter.createCanvas,
    adapter: browserAdapter,
  })
}

// 重新导出共享配置和工具
export { createLayoutConfig, getTheme, THEMES } from '../shared/renderer'
export { PADDING, FONTS, DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT } from '../shared/config/constants'
