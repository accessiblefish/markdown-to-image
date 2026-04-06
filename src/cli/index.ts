#!/usr/bin/env bun

/**
 * Markdown to Image CLI
 * 本地 Markdown 转图片工具
 */

// Pretext 需要 OffscreenCanvas 进行文本测量，在 Node/Bun 环境中提供 polyfill
import { Canvas } from 'skia-canvas'
if (typeof globalThis.OffscreenCanvas === 'undefined') {
  class OffscreenCanvasPolyfill {
    width: number
    height: number
    private canvas: Canvas

    constructor(width: number, height: number) {
      this.width = width
      this.height = height
      this.canvas = new Canvas(width, height) as any
    }

    getContext(contextId: string): any {
      if (contextId === '2d') {
        return this.canvas.getContext('2d')
      }
      return null
    }
  }
  globalThis.OffscreenCanvas = OffscreenCanvasPolyfill as any
}

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname, basename, extname } from 'path'
import { program } from 'commander'
import type { Canvas } from 'skia-canvas'
import {
  renderToPages,
  createLayoutConfig,
  type LayoutConfig,
  type ThemeKey,
} from '../shared'
import { cliAdapter } from './adapter'
import { SAMPLE_MARKDOWN } from '../config/sample'

interface CLIOptions {
  input?: string
  output?: string
  theme?: ThemeKey
  width?: number
  height?: number
  fontSize?: number
  quality?: number
  format?: 'png' | 'jpg' | 'webp'
}

const logo = `
┌─────────────────────────────────────┐
│  Markdown to Image CLI v1.0.0       │
│  Convert Markdown to beautiful images│
└─────────────────────────────────────┘
`

/**
 * 保存 Canvas 为图片文件
 */
async function saveCanvas(
  canvas: HTMLCanvasElement,
  outputPath: string,
  format: 'png' | 'jpg' | 'webp',
  quality: number
): Promise<void> {
  const skiaCanvas = canvas as unknown as Canvas
  const buffer = await skiaCanvas.toBuffer(format, { quality: quality / 100 })
  writeFileSync(outputPath, buffer)
}

/**
 * 处理文件或样例
 */
async function processInput(options: CLIOptions): Promise<void> {
  const startTime = performance.now()

  // 确定输入内容
  let markdown: string
  let inputName: string

  if (options.input) {
    const inputPath = resolve(options.input)
    if (!existsSync(inputPath)) {
      console.error(`✗ Error: File not found: ${options.input}`)
      process.exit(1)
    }
    markdown = readFileSync(inputPath, 'utf-8')
    inputName = basename(options.input, extname(options.input))
    console.log(`📄 Reading: ${inputPath}`)
  } else {
    markdown = SAMPLE_MARKDOWN
    inputName = 'markdown-to-image'
    console.log(`📄 Using sample content`)
  }

  // 确定输出目录和文件名
  let outputDir: string
  let outputName: string
  const format = options.format || 'png'

  if (options.output) {
    outputDir = dirname(resolve(options.output))
    outputName = basename(options.output, extname(options.output))
  } else {
    outputDir = process.cwd()
    outputName = inputName
  }
  
  // 提示用户将使用的默认文件名（当未指定 -o 时）
  if (!options.output) {
    console.log(`💡 Output: ${outputName}.${format} (use -o to specify custom name)`)
  }

  if (!existsSync(outputDir)) {
    try {
      mkdirSync(outputDir, { recursive: true })
    } catch (err) {
      console.error(`✗ Error: Cannot create output directory: ${outputDir}`)
      console.error(`  ${err instanceof Error ? err.message : String(err)}`)
      process.exit(1)
    }
  }

  // 检查目录是否可写
  try {
    const testFile = resolve(outputDir, '.write-test')
    writeFileSync(testFile, '')
    // @ts-ignore
    Bun?.file(testFile).delete?.() ?? require('fs').unlinkSync(testFile)
  } catch (err) {
    console.error(`✗ Error: Output directory is not writable: ${outputDir}`)
    process.exit(1)
  }

  // 创建配置
  const config: LayoutConfig = createLayoutConfig({
    theme: options.theme || 'light',
    pageWidth: options.width || 1080,
    pageHeight: options.height || 1440,
    fontSize: options.fontSize || 30,
  })

  // 渲染页面
  console.log('🎨 Rendering...')
  let pages: HTMLCanvasElement[]
  try {
    pages = await renderToPages({
      markdown,
      config,
      createCanvas: cliAdapter.createCanvas,
      adapter: cliAdapter,
    })
  } catch (err) {
    console.error(`✗ Rendering failed: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }

  // 保存图片
  const quality = options.quality || 95

  console.log(`✓ Generated ${pages.length} page(s)`)

  for (let i = 0; i < pages.length; i++) {
    const suffix = pages.length === 1 ? '' : `-${i + 1}`
    const outputPath = resolve(outputDir, `${outputName}${suffix}.${format}`)
    await saveCanvas(pages[i], outputPath, format, quality)
    console.log(`  → ${outputPath}`)
  }

  const duration = Math.round(performance.now() - startTime)
  console.log(`⏱  Done in ${duration}ms`)
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  console.log(logo)

  program
    .name('md2img')
    .description('Convert Markdown files to beautiful images')
    .version('1.0.0')
    .argument('[input]', 'Input Markdown file path (uses sample if not provided)')
    .option('-o, --output <path>', 'Output image path (optional)')
    .option('-t, --theme <theme>', 'Theme: light, dark, sepia', 'light')
    .option('-W, --width <number>', 'Page width in pixels', '1080')
    .option('-H, --height <number>', 'Page height in pixels', '1440')
    .option('-f, --font-size <number>', 'Base font size', '34')
    .option('-q, --quality <number>', 'Image quality (1-100)', '95')
    .option('-F, --format <format>', 'Output format: png, jpg, webp', 'png')
    .action(async (input: string | undefined, options: any) => {
      try {
        await processInput({
          input,
          output: options.output,
          theme: options.theme as ThemeKey,
          width: parseInt(options.width, 10),
          height: parseInt(options.height, 10),
          fontSize: parseInt(options.fontSize, 10),
          quality: parseInt(options.quality, 10),
          format: options.format as 'png' | 'jpg' | 'webp',
        })
      } catch (error) {
        console.error(`✗ Error: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(1)
      }
    })

  await program.parseAsync()
}

main().catch((error) => {
  console.error(`Unexpected error: ${error}`)
  process.exit(1)
})
