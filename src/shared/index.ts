/**
 * Markdown to Image - Shared Core
 * 共享核心模块，用于 Web 和 CLI
 */

// 类型
export * from './types/index.js'

// 配置
export { THEMES, getTheme } from './config/themes.js'
export {
  PADDING,
  FONTS,
  DEFAULT_PAGE_WIDTH,
  DEFAULT_PAGE_HEIGHT,
  CODE_PADDING,
  QUOTE_PADDING,
  BULLET_WIDTH,
  BULLET_MARGIN,
} from './config/constants.js'

// 解析器
export { parseMarkdownToBlocks, extractInlineElements, createTextElement } from './parser/markdown.js'

// 渲染器
export {
  renderToPages,
  createLayoutConfig,
} from './renderer/index.js'
export type { RenderOptions } from './renderer/index.js'

// 渲染器工具
export {
  renderBackground,
  renderPageFooter,
  renderTextLine,
  renderBlockQuote,
  renderCodeBlock,
  renderHorizontalRule,
  renderTable,
  renderTableRow,
  renderTaskCheckbox,
  renderListBullet,
} from './renderer/utils/canvas.js'
export type { CreateCanvasFn, CanvasAndContext } from './renderer/utils/canvas.js'

export {
  getHeadingFont,
  getBodyFont,
  getCodeFont,
  getInlineCodeFont,
} from './renderer/utils/fonts.js'

export {
  renderInlineElement,
  getInlineElementWidth,
  renderWrappedInlineElements,
  wrapInlineElements,
} from './renderer/utils/inline-renderer.js'

export {
  getContentWidth,
  getContentHeight,
  getAvailableHeight,
  needsNewPage,
  calculateLines,
} from './renderer/utils/layout.js'

// Block 渲染器导出类型
export type { HeadingResult } from './renderer/blocks/heading.js'
export type { ParagraphResult } from './renderer/blocks/paragraph.js'
export type { CodeResult } from './renderer/blocks/code.js'
export type { BlockQuoteResult } from './renderer/blocks/blockquote.js'
export type { ListResult } from './renderer/blocks/list.js'
export type { HorizontalRuleResult } from './renderer/blocks/horizontal-rule.js'
