/**
 * 下载工具
 * 处理图片导出功能
 */

import JSZip from 'jszip'

/**
 * 下载单张图片
 */
function downloadSingleImage(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

/**
 * 打包多张图片为 ZIP
 */
async function downloadAsZip(
  canvases: HTMLCanvasElement[],
  filename: string
): Promise<void> {
  const zip = new JSZip()

  for (let i = 0; i < canvases.length; i++) {
    const canvas = canvases[i]
    if (!canvas) continue

    const dataUrl = canvas.toDataURL('image/png')
    const base64Data = dataUrl.split(',')[1]
    if (base64Data) {
      zip.file(`page-${i + 1}.png`, base64Data, { base64: true })
    }
  }

  const content = await zip.generateAsync({ type: 'blob' })
  const objectUrl = URL.createObjectURL(content)

  try {
    const link = document.createElement('a')
    link.download = filename
    link.href = objectUrl
    link.click()
  } finally {
    // 延迟清理 URL 对象
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }
}

/**
 * 下载所有图片
 */
export async function downloadAll(
  canvases: HTMLCanvasElement[],
  button?: HTMLButtonElement
): Promise<void> {
  if (canvases.length === 0) return

  // 保存原始按钮状态
  const originalText = button?.textContent ?? null
  const wasDisabled = button?.disabled ?? false

  // 显示加载状态
  if (button) {
    button.textContent = 'Generating...'
    button.disabled = true
  }

  try {
    if (canvases.length === 1) {
      await downloadSingleImage(canvases[0]!, 'markdown.png')
    } else {
      await downloadAsZip(canvases, 'markdown-images.zip')
    }
  } catch (error) {
    console.error('Download failed:', error)
    alert('Download failed. Please try again.')
    throw error
  } finally {
    // 恢复按钮状态
    if (button) {
      button.textContent = originalText
      button.disabled = wasDisabled ?? false
    }
  }
}

/**
 * 检查浏览器是否支持下载
 */
export function isDownloadSupported(): boolean {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  try {
    const dataUrl = canvas.toDataURL('image/png')
    return dataUrl.startsWith('data:image/png')
  } catch {
    return false
  }
}
