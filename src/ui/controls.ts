/**
 * UI 控制器
 * 处理 DOM 交互和事件绑定
 */

import type { LayoutConfig } from '../types'
import type { ThemeKey } from '../config/themes'
import { DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT, PADDING, DEBOUNCE_DELAY } from '../config/constants'
import { SAMPLE_MARKDOWN } from '../config/sample'

// DOM 元素引用
interface DOMElements {
  editor: HTMLTextAreaElement
  previewContainer: HTMLDivElement
  charCount: HTMLSpanElement
  btnLoadSample: HTMLButtonElement
  btnClear: HTMLButtonElement
  btnDownloadAll: HTMLButtonElement
  themeSelect: HTMLSelectElement
  fontSizeSelect: HTMLSelectElement
  pageWidthInput: HTMLInputElement
  pageHeightInput: HTMLInputElement
}

/**
 * 获取 DOM 元素引用
 */
export function getDOMElements(): DOMElements {
  const getElement = <T extends HTMLElement>(id: string): T => {
    const el = document.getElementById(id)
    if (!el) {
      throw new Error(`Element #${id} not found`)
    }
    return el as T
  }

  return {
    editor: getElement<HTMLTextAreaElement>('editor'),
    previewContainer: getElement<HTMLDivElement>('previewContainer'),
    charCount: getElement<HTMLSpanElement>('charCount'),
    btnLoadSample: getElement<HTMLButtonElement>('btnLoadSample'),
    btnClear: getElement<HTMLButtonElement>('btnClear'),
    btnDownloadAll: getElement<HTMLButtonElement>('btnDownloadAll'),
    themeSelect: getElement<HTMLSelectElement>('themeSelect'),
    fontSizeSelect: getElement<HTMLSelectElement>('fontSizeSelect'),
    pageWidthInput: getElement<HTMLInputElement>('pageWidth'),
    pageHeightInput: getElement<HTMLInputElement>('pageHeight'),
  }
}

/**
 * 创建防抖函数
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * 更新字符计数
 */
export function updateCharCount(element: HTMLSpanElement, count: number): void {
  element.textContent = `${count} chars`
}

/**
 * 显示加载状态
 */
export function showLoading(container: HTMLDivElement): void {
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      Rendering...
    </div>
  `
}

/**
 * 显示空状态
 */
export function showEmptyState(container: HTMLDivElement): void {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📝</div>
      <p>Enter Markdown on the left<br>Images will be generated automatically</p>
    </div>
  `
}

/**
 * 渲染 Canvas 到预览容器
 */
export function renderCanvases(
  container: HTMLDivElement,
  canvases: HTMLCanvasElement[]
): void {
  container.innerHTML = ''

  canvases.forEach((canvas, index) => {
    const wrapper = document.createElement('div')
    wrapper.className = 'page-card'

    const label = document.createElement('div')
    label.className = 'page-label'
    label.textContent = `Page ${index + 1}`

    // 设置 canvas 响应式尺寸
    canvas.style.width = '100%'
    canvas.style.height = 'auto'
    canvas.style.display = 'block'

    wrapper.appendChild(label)
    wrapper.appendChild(canvas)
    container.appendChild(wrapper)
  })
}

/**
 * 获取当前布局配置
 */
export function getLayoutConfig(elements: DOMElements): LayoutConfig {
  const fontSize = parseInt(elements.fontSizeSelect.value, 10) || 30

  return {
    pageWidth: parseInt(elements.pageWidthInput.value, 10) || DEFAULT_PAGE_WIDTH,
    pageHeight: parseInt(elements.pageHeightInput.value, 10) || DEFAULT_PAGE_HEIGHT,
    padding: PADDING,
    fontSize,
    lineHeight: fontSize * 1.3,
    theme: elements.themeSelect.value as ThemeKey,
  }
}

/**
 * 加载示例 Markdown
 */
export function loadSample(elements: DOMElements, callback: () => void): void {
  elements.editor.value = SAMPLE_MARKDOWN
  updateCharCount(elements.charCount, elements.editor.value.length)
  callback()
}

/**
 * 清空编辑器
 */
export function clearEditor(elements: DOMElements, callback: () => void): void {
  elements.editor.value = ''
  updateCharCount(elements.charCount, 0)
  callback()
}

/**
 * 导出类型
 */
export type { DOMElements }
