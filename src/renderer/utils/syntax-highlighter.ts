/**
 * 语法高亮工具
 * 为代码块提供简单的语法高亮支持
 */

// 语法标记类型
export type TokenType = 
  | 'keyword'      // 关键字
  | 'string'       // 字符串
  | 'number'       // 数字
  | 'comment'      // 注释
  | 'function'     // 函数名
  | 'class'        // 类名
  | 'operator'     // 运算符
  | 'property'     // 属性
  | 'tag'          // HTML/XML 标签
  | 'attribute'    // HTML 属性
  | 'plain'        // 普通文本

// 标记接口
export interface Token {
  type: TokenType
  text: string
}

// 各语言的关键字
const KEYWORDS_JS = new Set([
  'const', 'let', 'var', 'function', 'class', 'extends', 'implements',
  'interface', 'type', 'enum', 'namespace', 'module', 'import', 'export',
  'from', 'default', 'as', 'async', 'await', 'return', 'if', 'else',
  'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try',
  'catch', 'finally', 'throw', 'new', 'this', 'super', 'static',
  'public', 'private', 'protected', 'readonly', 'abstract', 'declare',
  'in', 'of', 'instanceof', 'typeof', 'void', 'null', 'undefined',
  'true', 'false', 'debugger', 'with', 'yield'
])

const KEYWORDS_PYTHON = new Set([
  'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try',
  'except', 'finally', 'with', 'as', 'import', 'from', 'return',
  'yield', 'lambda', 'pass', 'break', 'continue', 'raise', 'assert',
  'del', 'global', 'nonlocal', 'True', 'False', 'None', 'and',
  'or', 'not', 'in', 'is', 'async', 'await'
])

const KEYWORDS_CSS = new Set([
  '@import', '@media', '@keyframes', '@font-face', '@supports',
  '@layer', '@container', '@property'
])

// 检测语言
function detectLanguage(code: string, specifiedLang?: string): string {
  if (specifiedLang) return specifiedLang.toLowerCase()
  
  // 简单启发式检测
  if (code.includes('def ') && code.includes(':')) return 'python'
  if (code.includes('function') || code.includes('const ') || code.includes('let ')) return 'javascript'
  if (code.includes('{') && code.includes(':') && code.includes(';')) return 'css'
  if (code.includes('<') && code.includes('>')) return 'html'
  
  return 'javascript'
}

// 转义正则表达式特殊字符
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// JavaScript/TypeScript 语法高亮
function tokenizeJavaScript(code: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  
  while (i < code.length) {
    const char = code[i]
    const remaining = code.slice(i)
    
    // 跳过空白字符但保留它们
    if (/\s/.test(char)) {
      const match = remaining.match(/^\s+/)
      if (match) {
        tokens.push({ type: 'plain', text: match[0] })
        i += match[0].length
        continue
      }
    }
    
    // 单行注释 //
    if (remaining.startsWith('//')) {
      const end = code.indexOf('\n', i)
      const comment = end === -1 ? code.slice(i) : code.slice(i, end)
      tokens.push({ type: 'comment', text: comment })
      i += comment.length
      continue
    }
    
    // 多行注释 /* */
    if (remaining.startsWith('/*')) {
      const end = code.indexOf('*/', i + 2)
      const comment = end === -1 ? code.slice(i) : code.slice(i, end + 2)
      tokens.push({ type: 'comment', text: comment })
      i += comment.length
      continue
    }
    
    // 字符串 " " 或 ' '
    if (char === '"' || char === "'") {
      const quote = char
      let j = i + 1
      while (j < code.length) {
        if (code[j] === '\\') {
          j += 2
          continue
        }
        if (code[j] === quote) break
        j++
      }
      tokens.push({ type: 'string', text: code.slice(i, j + 1) })
      i = j + 1
      continue
    }
    
    // 模板字符串 ` `
    if (char === '`') {
      let j = i + 1
      while (j < code.length) {
        if (code[j] === '\\') {
          j += 2
          continue
        }
        if (code[j] === '`') break
        // 模板字符串内的表达式
        if (code[j] === '$' && code[j + 1] === '{') {
          tokens.push({ type: 'string', text: code.slice(i, j) })
          tokens.push({ type: 'operator', text: '${' })
          i = j + 2
          // 递归处理表达式内部
          let braceCount = 1
          let exprStart = i
          while (i < code.length && braceCount > 0) {
            if (code[i] === '{') braceCount++
            if (code[i] === '}') braceCount--
            i++
          }
          const exprTokens = tokenizeJavaScript(code.slice(exprStart, i - 1))
          tokens.push(...exprTokens)
          tokens.push({ type: 'operator', text: '}' })
          // 继续模板字符串
          j = i
          while (j < code.length) {
            if (code[j] === '\\') {
              j += 2
              continue
            }
            if (code[j] === '`') break
            if (code[j] === '$' && code[j + 1] === '{') break
            j++
          }
          tokens.push({ type: 'string', text: code.slice(i, j) })
          i = j
          if (code[i] === '`') {
            tokens.push({ type: 'string', text: '`' })
            i++
          }
          continue
        }
        j++
      }
      if (tokens[tokens.length - 1]?.type !== 'string' || code.slice(i, j + 1) !== '`') {
        tokens.push({ type: 'string', text: code.slice(i, j + 1) })
      }
      i = j + 1
      continue
    }
    
    // 数字
    if (/\d/.test(char) || (char === '.' && /\d/.test(code[i + 1]))) {
      const match = remaining.match(/^\d*\.?\d+([eE][+-]?\d+)?/)
      if (match) {
        tokens.push({ type: 'number', text: match[0] })
        i += match[0].length
        continue
      }
    }
    
    // 标识符/关键字/函数名
    if (/[a-zA-Z_$]/.test(char)) {
      const match = remaining.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/)
      if (match) {
        const word = match[0]
        if (KEYWORDS_JS.has(word)) {
          tokens.push({ type: 'keyword', text: word })
        } else if (code[i + word.length] === '(') {
          tokens.push({ type: 'function', text: word })
        } else if (/^[A-Z]/.test(word) && word.length > 1) {
          tokens.push({ type: 'class', text: word })
        } else {
          tokens.push({ type: 'plain', text: word })
        }
        i += word.length
        continue
      }
    }
    
    // 运算符
    if (/[+\-*/%=<>!&|^~?:]/.test(char)) {
      const match = remaining.match(/^[+\-*/%=<>!&|^~?:]+/)
      if (match) {
        tokens.push({ type: 'operator', text: match[0] })
        i += match[0].length
        continue
      }
    }
    
    // 属性访问 .property
    if (char === '.' && /[a-zA-Z_$]/.test(code[i + 1])) {
      const match = remaining.match(/^\.[a-zA-Z_$][a-zA-Z0-9_$]*/)
      if (match) {
        tokens.push({ type: 'operator', text: '.' })
        tokens.push({ type: 'property', text: match[0].slice(1) })
        i += match[0].length
        continue
      }
    }
    
    // 其他字符
    tokens.push({ type: 'plain', text: char })
    i++
  }
  
  return tokens
}

// Python 语法高亮
function tokenizePython(code: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  
  while (i < code.length) {
    const char = code[i]
    const remaining = code.slice(i)
    
    // 空白字符
    if (/\s/.test(char)) {
      const match = remaining.match(/^\s+/)
      if (match) {
        tokens.push({ type: 'plain', text: match[0] })
        i += match[0].length
        continue
      }
    }
    
    // 注释 #
    if (char === '#') {
      const end = code.indexOf('\n', i)
      const comment = end === -1 ? code.slice(i) : code.slice(i, end)
      tokens.push({ type: 'comment', text: comment })
      i += comment.length
      continue
    }
    
    // 字符串 " " ' ' """ """ ''' '''
    if (char === '"' || char === "'") {
      const quote = char
      const tripleQuote = remaining.slice(0, 3)
      if (tripleQuote === '"""' || tripleQuote === "'''") {
        // 三引号字符串
        const endQuote = tripleQuote
        let j = i + 3
        while (j < code.length - 2) {
          if (code.slice(j, j + 3) === endQuote) break
          j++
        }
        tokens.push({ type: 'string', text: code.slice(i, j + 3) })
        i = j + 3
      } else {
        // 普通字符串
        let j = i + 1
        while (j < code.length) {
          if (code[j] === '\\') {
            j += 2
            continue
          }
          if (code[j] === quote) break
          j++
        }
        tokens.push({ type: 'string', text: code.slice(i, j + 1) })
        i = j + 1
      }
      continue
    }
    
    // 数字
    if (/\d/.test(char)) {
      const match = remaining.match(/^\d*\.?\d+([eE][+-]?\d+)?/)
      if (match) {
        tokens.push({ type: 'number', text: match[0] })
        i += match[0].length
        continue
      }
    }
    
    // 装饰器 @decorator
    if (char === '@' && /[a-zA-Z_]/.test(code[i + 1])) {
      const match = remaining.match(/^@[a-zA-Z_$][a-zA-Z0-9_$]*/)
      if (match) {
        tokens.push({ type: 'keyword', text: match[0] })
        i += match[0].length
        continue
      }
    }
    
    // 标识符/关键字/函数名
    if (/[a-zA-Z_$]/.test(char)) {
      const match = remaining.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/)
      if (match) {
        const word = match[0]
        if (KEYWORDS_PYTHON.has(word)) {
          tokens.push({ type: 'keyword', text: word })
        } else if (code[i + word.length] === '(') {
          tokens.push({ type: 'function', text: word })
        } else if (/^[A-Z]/.test(word) && word.length > 1) {
          tokens.push({ type: 'class', text: word })
        } else {
          tokens.push({ type: 'plain', text: word })
        }
        i += word.length
        continue
      }
    }
    
    // 运算符
    if (/[+\-*/%=<>!&|^~]/.test(char)) {
      const match = remaining.match(/^[+\-*/%=<>!&|^~]+/)
      if (match) {
        tokens.push({ type: 'operator', text: match[0] })
        i += match[0].length
        continue
      }
    }
    
    // 其他字符
    tokens.push({ type: 'plain', text: char })
    i++
  }
  
  return tokens
}

// CSS 语法高亮
function tokenizeCSS(code: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  
  while (i < code.length) {
    const char = code[i]
    const remaining = code.slice(i)
    
    // 空白字符
    if (/\s/.test(char)) {
      const match = remaining.match(/^\s+/)
      if (match) {
        tokens.push({ type: 'plain', text: match[0] })
        i += match[0].length
        continue
      }
    }
    
    // 注释 /* */
    if (remaining.startsWith('/*')) {
      const end = code.indexOf('*/', i + 2)
      const comment = end === -1 ? code.slice(i) : code.slice(i, end + 2)
      tokens.push({ type: 'comment', text: comment })
      i += comment.length
      continue
    }
    
    // 字符串
    if (char === '"' || char === "'") {
      const quote = char
      let j = i + 1
      while (j < code.length) {
        if (code[j] === '\\') {
          j += 2
          continue
        }
        if (code[j] === quote) break
        j++
      }
      tokens.push({ type: 'string', text: code.slice(i, j + 1) })
      i = j + 1
      continue
    }
    
    // At-rules @media, @import, etc.
    if (char === '@') {
      const match = remaining.match(/^@[a-z-]+/)
      if (match) {
        tokens.push({ type: 'keyword', text: match[0] })
        i += match[0].length
        continue
      }
    }
    
    // 选择器/属性/值
    if (/[a-zA-Z-]/.test(char)) {
      const match = remaining.match(/^[a-zA-Z-][a-zA-Z0-9-]*/)
      if (match) {
        tokens.push({ type: 'property', text: match[0] })
        i += match[0].length
        continue
      }
    }
    
    // 数字（带单位）
    if (/\d/.test(char)) {
      const match = remaining.match(/^(\d*\.?\d+)([a-z%]+)?/)
      if (match) {
        tokens.push({ type: 'number', text: match[1] })
        if (match[2]) {
          tokens.push({ type: 'keyword', text: match[2] })
        }
        i += match[0].length
        continue
      }
    }
    
    // #颜色值
    if (char === '#') {
      const match = remaining.match(/^#[a-fA-F0-9]{3,8}/)
      if (match) {
        tokens.push({ type: 'string', text: match[0] })
        i += match[0].length
        continue
      }
    }
    
    // 标点符号
    if (/[{}:;,.()]/.test(char)) {
      tokens.push({ type: 'operator', text: char })
      i++
      continue
    }
    
    // 其他字符
    tokens.push({ type: 'plain', text: char })
    i++
  }
  
  return tokens
}

// HTML 语法高亮
function tokenizeHTML(code: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  
  while (i < code.length) {
    const char = code[i]
    const remaining = code.slice(i)
    
    // 注释 <!-- -->
    if (remaining.startsWith('<!--')) {
      const end = code.indexOf('-->', i + 4)
      const comment = end === -1 ? code.slice(i) : code.slice(i, end + 3)
      tokens.push({ type: 'comment', text: comment })
      i += comment.length
      continue
    }
    
    // 标签 <tag>
    if (char === '<' && /[a-zA-Z/]/.test(code[i + 1])) {
      tokens.push({ type: 'operator', text: '<' })
      i++
      
      // 结束标签 /
      if (code[i] === '/') {
        tokens.push({ type: 'operator', text: '/' })
        i++
      }
      
      // 标签名
      const tagMatch = code.slice(i).match(/^[a-zA-Z][a-zA-Z0-9-]*/)
      if (tagMatch) {
        tokens.push({ type: 'tag', text: tagMatch[0] })
        i += tagMatch[0].length
      }
      
      // 标签属性和值
      while (i < code.length && code[i] !== '>') {
        // 跳过空白
        if (/\s/.test(code[i])) {
          tokens.push({ type: 'plain', text: code[i] })
          i++
          continue
        }
        
        // 自闭合标签 /
        if (code[i] === '/') {
          tokens.push({ type: 'operator', text: '/' })
          i++
          continue
        }
        
        // 属性名
        if (/[a-zA-Z-]/.test(code[i])) {
          const attrMatch = code.slice(i).match(/^[a-zA-Z-][a-zA-Z0-9-:]*/)
          if (attrMatch) {
            tokens.push({ type: 'attribute', text: attrMatch[0] })
            i += attrMatch[0].length
            
            // 属性值 ="value"
            if (code[i] === '=') {
              tokens.push({ type: 'operator', text: '=' })
              i++
              
              if (code[i] === '"' || code[i] === "'") {
                const quote = code[i]
                let j = i + 1
                while (j < code.length && code[j] !== quote) {
                  j++
                }
                tokens.push({ type: 'string', text: code.slice(i, j + 1) })
                i = j + 1
              }
            }
          }
          continue
        }
        
        i++
      }
      
      if (code[i] === '>') {
        tokens.push({ type: 'operator', text: '>' })
        i++
      }
      continue
    }
    
    // 文本内容
    let j = i
    while (j < code.length && code[j] !== '<') {
      j++
    }
    if (j > i) {
      tokens.push({ type: 'plain', text: code.slice(i, j) })
      i = j
    } else {
      tokens.push({ type: 'plain', text: char })
      i++
    }
  }
  
  return tokens
}

// 主入口：对代码进行语法高亮
export function highlight(code: string, language?: string): Token[] {
  const lang = detectLanguage(code, language)
  
  switch (lang) {
    case 'javascript':
    case 'js':
    case 'typescript':
    case 'ts':
    case 'jsx':
    case 'tsx':
      return tokenizeJavaScript(code)
    case 'python':
    case 'py':
      return tokenizePython(code)
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return tokenizeCSS(code)
    case 'html':
    case 'xml':
    case 'svg':
      return tokenizeHTML(code)
    default:
      // 对其他语言使用简单的 JavaScript 解析器
      return tokenizeJavaScript(code)
  }
}

// 获取标记类型的颜色
export function getTokenColor(type: TokenType, isDark: boolean): string {
  const colors: Record<TokenType, { light: string; dark: string }> = {
    keyword:   { light: '#ff79c6', dark: '#ff79c6' },  // 粉色 - 关键字
    string:    { light: '#f1fa8c', dark: '#f1fa8c' },  // 黄色 - 字符串
    number:    { light: '#bd93f9', dark: '#bd93f9' },  // 紫色 - 数字
    comment:   { light: '#6272a4', dark: '#6272a4' },  // 灰色 - 注释
    function:  { light: '#50fa7b', dark: '#50fa7b' },  // 绿色 - 函数名
    class:     { light: '#8be9fd', dark: '#8be9fd' },  // 青色 - 类名
    operator:  { light: '#ff79c6', dark: '#ff79c6' },  // 粉色 - 运算符
    property:  { light: '#8be9fd', dark: '#8be9fd' },  // 青色 - 属性
    tag:       { light: '#ff79c6', dark: '#ff79c6' },  // 粉色 - 标签
    attribute: { light: '#50fa7b', dark: '#50fa7b' },  // 绿色 - 属性
    plain:     { light: '#f8f8f2', dark: '#f8f8f2' },  // 白色 - 普通文本
  }
  
  return colors[type][isDark ? 'dark' : 'light']
}
