/**
 * Markdown 解析器
 */

import { micromark } from 'micromark'
import { gfm, gfmHtml } from 'micromark-extension-gfm'
import type { Block, InlineElement, InlineElementType, LinkElement } from '../types'

/**
 * 解析 Markdown 字符串为 Block 数组
 */
export function parseMarkdownToBlocks(markdown: string): Block[] {
  if (!markdown.trim()) {
    return []
  }

  const html = micromark(markdown, {
    extensions: [gfm()],
    htmlExtensions: [gfmHtml()],
  })

  const temp = document.createElement('div')
  temp.innerHTML = html

  const blocks: Block[] = []

  Array.from(temp.children).forEach((child) => {
    extractBlocks(child, blocks)
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

/**
 * 提取列表项
 */
function extractListItems(node: Element) {
  const items: Array<{ text: string; checked?: boolean; inlineElements?: InlineElement[] }> = []

  node.querySelectorAll(':scope > li').forEach((li) => {
    const checkbox = li.querySelector('input[type="checkbox"]')
    const inlineElements = extractInlineElements(li)

    if (checkbox) {
      items.push({
        text: li.textContent?.replace(/^\s*\[.?\]\s*/, '') || '',
        checked: (checkbox as HTMLInputElement).checked,
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
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      if (text && !/^\s*$/.test(text)) {
        elements.push({ type: 'text', content: text })
      } else if (text && elements.length > 0) {
        elements.push({ type: 'text', content: ' ' })
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
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
