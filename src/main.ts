/**
 * Markdown to Image Generator
 *
 * Convert Markdown to beautiful images using Canvas
 * Built with modular architecture for maintainability
 */

import { renderToPages } from './renderer'
import {
  getDOMElements,
  debounce,
  updateCharCount,
  showLoading,
  showEmptyState,
  renderCanvases,
  getLayoutConfig,
  loadSample,
  clearEditor,
  type DOMElements,
} from './ui/controls'
import { downloadAll } from './utils/download'
import { DEBOUNCE_DELAY } from './config/constants'

// 全局状态
let currentCanvases: HTMLCanvasElement[] = []
let isRendering = false
let pendingRender = false

/**
 * 初始化应用
 */
function initApp(): void {
  let elements: DOMElements

  try {
    elements = getDOMElements()
  } catch (error) {
    console.error('Failed to initialize app:', error)
    document.body.innerHTML = `
      <div style="padding: 20px; color: red;">
        Error: Failed to initialize application. Please refresh the page.
      </div>
    `
    return
  }

  // 绑定事件监听器
  bindEventListeners(elements)

  // 初始渲染
  updateCharCount(elements.charCount, elements.editor.value.length)
  updatePreview(elements)
}

/**
 * 绑定事件监听器
 */
function bindEventListeners(elements: DOMElements): void {
  const debouncedPreview = debounce(() => updatePreview(elements), DEBOUNCE_DELAY)

  // 编辑器输入事件
  elements.editor.addEventListener('input', () => {
    updateCharCount(elements.charCount, elements.editor.value.length)
  })

  elements.editor.addEventListener('input', debouncedPreview)

  // 设置变更事件
  elements.themeSelect.addEventListener('change', () => updatePreview(elements))
  elements.fontSizeSelect.addEventListener('change', () => updatePreview(elements))
  elements.pageWidthInput.addEventListener('change', () => updatePreview(elements))
  elements.pageHeightInput.addEventListener('change', () => updatePreview(elements))

  // 按钮事件
  elements.btnLoadSample.addEventListener('click', () => {
    loadSample(elements, () => updatePreview(elements))
  })

  elements.btnClear.addEventListener('click', () => {
    clearEditor(elements, () => updatePreview(elements))
  })

  elements.btnDownloadAll.addEventListener('click', async () => {
    try {
      await downloadAll(currentCanvases, elements.btnDownloadAll)
    } catch (error) {
      // 错误已在 downloadAll 中处理
    }
  })
}

/**
 * 更新预览
 */
async function updatePreview(elements: DOMElements): Promise<void> {
  const markdown = elements.editor.value

  if (!markdown.trim()) {
    showEmptyState(elements.previewContainer)
    currentCanvases = []
    return
  }

  // 显示加载状态
  showLoading(elements.previewContainer)

  // 防止并发渲染
  if (isRendering) {
    pendingRender = true
    return
  }

  isRendering = true

  try {
    const config = getLayoutConfig(elements)

    // 使用 requestAnimationFrame 避免阻塞 UI
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        renderToPages(markdown, config)
          .then((canvases) => {
            currentCanvases = canvases
            renderCanvases(elements.previewContainer, canvases)
          })
          .catch((error) => {
            console.error('Render error:', error)
            elements.previewContainer.innerHTML = `
              <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>Rendering failed.<br>Please try again.</p>
              </div>
            `
          })
          .finally(() => {
            isRendering = false
            resolve()

            // 处理挂起的渲染请求
            if (pendingRender) {
              pendingRender = false
              updatePreview(elements)
            }
          })
      })
    })
  } catch (error) {
    console.error('Preview update error:', error)
    isRendering = false
    pendingRender = false
  }
}

// 启动应用
initApp()
