/**
 * 核心类型定义 - 共享
 */

export type ThemeKey = 'mint' | 'editorial' | 'inspection'

export interface Theme {
  bg: string
  bgGradient?: string[] // 渐变背景色数组 [start, end]
  decorativeColor?: string // 装饰元素颜色
  bgPattern?: string // 背景图案文字（如 "AI"）
  fontFamily?: FontFamilyKey
  text: string
  textHeading: string
  textMuted: string
  border: string
  tableBorder?: string
  codeBg: string
  codeText: string
  inlineCodeBg: string
  inlineCodeText: string
  quoteBg: string
  quoteBorder: string
  link: string
  accent: string
}

export type InlineElementType = 'text' | 'code' | 'strong' | 'em' | 'link'

export interface InlineElementBase {
  type: InlineElementType
  content: string
}

export interface LinkElement extends InlineElementBase {
  type: 'link'
  href: string
}

export type InlineElement = InlineElementBase | LinkElement

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'code'
  | 'blockquote'
  | 'list'
  | 'listItem'
  | 'hr'
  | 'table'
  | 'image'
  | 'taskList'

export interface ListItem {
  text: string
  checked?: boolean
  inlineElements?: InlineElement[]
}

export interface Block {
  type: BlockType
  content: string
  inlineElements?: InlineElement[]
  level?: number
  language?: string
  ordered?: boolean
  items?: ListItem[]
  rows?: string[][]
  src?: string
  alt?: string
}

export interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

export type FontFamilyKey = 'serif' | 'sans' | 'modern'

export interface LayoutConfig {
  pageWidth: number
  pageHeight: number
  padding: Padding
  fontSize: number
  lineHeight: number
  theme: ThemeKey
  fontFamily?: FontFamilyKey
  assetBasePath?: string
}

export type FontType = 'body' | 'heading' | 'code' | 'inlineCode' | 'small'

export type TextStyle = 'normal' | 'code' | 'strong' | 'em' | 'link'

export interface TextFragment {
  text: string
  style: TextStyle
  width: number
}

export interface TextAtom {
  text: string
  style: TextStyle
  width: number
  isGlue: boolean
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D
  currentY: number
  config: LayoutConfig
}

export interface LayoutResult {
  lines: Array<{ x: number; y: number; text: string; width: number }>
  cursor: { segmentIndex: number; graphemeIndex: number }
  finalY: number
}

// 平台抽象接口
export interface PlatformAdapter {
  createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }
  parseHTML(html: string): Element
  loadImage(src: string, basePath?: string): Promise<{ image: CanvasImageSource; width: number; height: number }>
}
