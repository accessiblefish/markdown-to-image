/**
 * Markdown 解析器 - 共享
 * 平台无关，通过 adapter 注入 DOM 实现
 */

import type { Block, InlineElement, InlineElementType, LinkElement, PlatformAdapter } from '../types'

/**
 * 解析 Markdown 字符串为 Block 数组
 */
export async function parseMarkdownToBlocks(markdown: string, adapter: PlatformAdapter): Promise<Block[]> {
  if (!markdown.trim()) {
    return []
  }

  // 动态导入 micromark（浏览器和 Node 都支持）
  const [{ micromark }, { gfm, gfmHtml }] = await Promise.all([
    import('micromark'),
    import('micromark-extension-gfm'),
  ])

  const html = micromark(markdown, {
    extensions: [gfm()],
    htmlExtensions: [gfmHtml()],
  })

  const temp = adapter.parseHTML(html)

  const blocks: Block[] = []

  Array.from(temp.children).forEach((child) => {
    extractBlocks(child as Element, blocks)
  })

  return blocks
}

/**
 * 递归提取 Block 元素
 */
function extractBlocks(node: Element, blocks: Block[]): void {
  const tagName = node.tagName.toLowerCase()

  switch (tagName) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      blocks.push({
        type: 'heading',
        content: node.textContent || '',
        level: parseInt(tagName[1], 10),
      })
      break

    case 'p': {
      const standaloneImage = extractStandaloneImage(node)
      if (standaloneImage) {
        blocks.push(standaloneImage)
        break
      }

      const inlineElements = extractInlineElements(node)
      blocks.push({
        type: 'paragraph',
        content: node.textContent || '',
        inlineElements,
      })
      break
    }

    case 'pre': {
      const code = node.querySelector('code')
      const lang = code?.className?.match(/language-(\w+)/)?.[1] || ''
      blocks.push({
        type: 'code',
        content: code?.textContent || node.textContent || '',
        language: lang,
      })
      break
    }

    case 'blockquote': {
      const p = node.querySelector('p')
      const targetNode = p || node
      const inlineElements = extractInlineElements(targetNode)
      blocks.push({
        type: 'blockquote',
        content: targetNode.textContent || '',
        inlineElements,
      })
      break
    }

    case 'ul':
    case 'ol': {
      const items = extractListItems(node)
      const isTaskList = items.some((i) => i.checked !== undefined)
      blocks.push({
        type: isTaskList ? 'taskList' : 'list',
        content: '',
        ordered: tagName === 'ol',
        items,
      })
      break
    }

    case 'hr':
      blocks.push({ type: 'hr', content: '' })
      break

    case 'table': {
      const rows = extractTableRows(node)
      blocks.push({ type: 'table', content: '', rows })
      break
    }

    case 'img':
      blocks.push({
        type: 'image',
        content: '',
        src: node.getAttribute('src') || '',
        alt: node.getAttribute('alt') || '',
      })
      break

    case 'div':
    case 'section':
    case 'article':
      Array.from(node.children).forEach((child) => {
        extractBlocks(child as Element, blocks)
      })
      break

    default:
      if (node.textContent?.trim()) {
        blocks.push({
          type: 'paragraph',
          content: node.textContent,
        })
      }
  }
}

function extractStandaloneImage(node: Element): Block | null {
  if (node.children.length !== 1) {
    return null
  }

  const child = node.children[0]
  if (child.tagName.toLowerCase() !== 'img') {
    return null
  }

  return {
    type: 'image',
    content: '',
    src: child.getAttribute('src') || '',
    alt: child.getAttribute('alt') || '',
  }
}

/**
 * 提取列表项
 */
function extractListItems(node: Element) {
  const items: Array<{ text: string; checked?: boolean; inlineElements?: InlineElement[] }> = []

  node.querySelectorAll(':scope > li').forEach((li) => {
    const checkbox = li.querySelector('input[type="checkbox"]')
    const inlineElements = extractInlineElements(li)

    if (checkbox) {
      // 使用 getAttribute 因为 linkedom 的 checked 属性返回 undefined
      const checked = checkbox.getAttribute('checked') !== null
      items.push({
        text: li.textContent?.replace(/^\s*\[.?\]\s*/, '') || '',
        checked,
        inlineElements,
      })
    } else {
      items.push({ text: li.textContent || '', inlineElements })
    }
  })

  return items
}

/**
 * 提取表格行
 */
function extractTableRows(node: Element): string[][] {
  const rows: string[][] = []

  node.querySelectorAll('tr').forEach((tr) => {
    const cells: string[] = []
    tr.querySelectorAll('td, th').forEach((cell) => {
      cells.push(cell.textContent || '')
    })
    if (cells.length > 0) {
      rows.push(cells)
    }
  })

  return rows
}

/**
 * 提取行内元素
 */
export function extractInlineElements(node: Element): InlineElement[] {
  const elements: InlineElement[] = []

  function walk(node: Node): void {
    if (node.nodeType === 3) { // TEXT_NODE
      const text = node.textContent || ''
      // 保留所有非空文本，包括前后空格
      if (text && !/^\s*$/.test(text)) {
        elements.push({ type: 'text', content: text })
      } else if (text && elements.length > 0) {
        // 保留原始空白内容，不只是单个空格
        elements.push({ type: 'text', content: text })
      }
    } else if (node.nodeType === 1) { // ELEMENT_NODE
      const el = node as Element
      const tagName = el.tagName.toLowerCase()

      switch (tagName) {
        case 'code':
          elements.push({ type: 'code', content: el.textContent || '' })
          break
        case 'strong':
        case 'b':
          elements.push({ type: 'strong', content: el.textContent || '' })
          break
        case 'em':
        case 'i':
          elements.push({ type: 'em', content: el.textContent || '' })
          break
        case 'a': {
          const linkEl: LinkElement = {
            type: 'link',
            content: el.textContent || '',
            href: el.getAttribute('href') || '',
          }
          elements.push(linkEl)
          break
        }
        default:
          el.childNodes.forEach((child) => walk(child))
      }
    }
  }

  node.childNodes.forEach((child) => walk(child))
  return elements
}

/**
 * 创建文本元素
 */
export function createTextElement(content: string, type: InlineElementType = 'text'): InlineElement {
  return { type, content }
}
