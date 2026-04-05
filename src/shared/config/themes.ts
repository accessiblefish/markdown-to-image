/**
 * 主题配置 - 共享
 */

import type { Theme } from '../types'

export const THEMES: Record<string, Theme> = {
  light: {
    bg: '#ffffff',
    text: '#2c3e50',
    textHeading: '#1a1a1a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    codeBg: '#1e293b',
    codeText: '#f8fafc',
    inlineCodeBg: '#f3f4f6',
    inlineCodeText: '#eb5757',
    quoteBg: '#f8fafc',
    quoteBorder: '#e2e8f0',
    link: '#3498db',
    accent: '#3498db',
  },
  dark: {
    bg: '#0f172a',
    text: '#e2e8f0',
    textHeading: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#334155',
    codeBg: '#1e293b',
    codeText: '#f8fafc',
    inlineCodeBg: '#1e293b',
    inlineCodeText: '#f472b6',
    quoteBg: '#1e293b',
    quoteBorder: '#475569',
    link: '#60a5fa',
    accent: '#60a5fa',
  },
  sepia: {
    bg: '#f5f0e6',
    text: '#433422',
    textHeading: '#2c2416',
    textMuted: '#8b7355',
    border: '#d4c8b8',
    codeBg: '#2d2a26',
    codeText: '#f5f0e6',
    inlineCodeBg: '#ebe4d6',
    inlineCodeText: '#b45309',
    quoteBg: '#faf8f3',
    quoteBorder: '#d4c8b8',
    link: '#b45309',
    accent: '#b45309',
  },
}

export type ThemeKey = keyof typeof THEMES

export function getTheme(themeKey: ThemeKey): Theme {
  return THEMES[themeKey]
}
