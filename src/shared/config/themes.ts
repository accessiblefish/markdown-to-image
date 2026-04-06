/**
 * 主题配置 - 共享
 * 社交友好的配色方案
 */

import type { Theme } from '../types'

export const THEMES: Record<string, Theme> = {
  // 活力橙粉 - 适合小红书、Instagram
  light: {
    bg: '#FFF5F0',
    bgGradient: ['#FFF5F0', '#FFE8E0'],
    decorativeColor: '#FF6B6B',
    text: '#2D3436',
    textHeading: '#1A1A2E',
    textMuted: '#636E72',
    border: '#FFE0D6',
    codeBg: '#2D3436',
    codeText: '#FFEAA7',
    inlineCodeBg: '#FFE0D6',
    inlineCodeText: '#E17055',
    quoteBg: '#FFF0EB',
    quoteBorder: '#FF6B6B',
    link: '#E17055',
    accent: '#FF6B6B',
  },
  // 深海蓝紫 - 适合 Twitter、技术分享
  dark: {
    bg: '#1A1A2E',
    bgGradient: ['#1A1A2E', '#16213E'],
    decorativeColor: '#E94560',
    text: '#EAEAEA',
    textHeading: '#FFFFFF',
    textMuted: '#A0A0A0',
    border: '#0F3460',
    codeBg: '#0F0F23',
    codeText: '#A8E6CF',
    inlineCodeBg: '#16213E',
    inlineCodeText: '#E94560',
    quoteBg: '#16213E',
    quoteBorder: '#E94560',
    link: '#E94560',
    accent: '#E94560',
  },
  // 森林绿 - 适合微信、公众号
  sepia: {
    bg: '#F7F4ED',
    bgGradient: ['#F7F4ED', '#EDE8D8'],
    decorativeColor: '#6B8E23',
    text: '#3D3D3D',
    textHeading: '#2C3E2C',
    textMuted: '#7A7A7A',
    border: '#D4CFC4',
    codeBg: '#2C3E2C',
    codeText: '#E8F5E9',
    inlineCodeBg: '#E8F5E9',
    inlineCodeText: '#558B2F',
    quoteBg: '#F0F5E8',
    quoteBorder: '#6B8E23',
    link: '#558B2F',
    accent: '#6B8E23',
  },
  // 新增：霓虹紫 - 适合年轻群体、潮流内容
  neon: {
    bg: '#0D0221',
    bgGradient: ['#0D0221', '#1B0A3A'],
    decorativeColor: '#FF3864',
    text: '#F0E6FF',
    textHeading: '#FFFFFF',
    textMuted: '#9D8BB0',
    border: '#261447',
    codeBg: '#1B0A3A',
    codeText: '#00F5D4',
    inlineCodeBg: '#261447',
    inlineCodeText: '#FF3864',
    quoteBg: '#1B0A3A',
    quoteBorder: '#FF3864',
    link: '#FF3864',
    accent: '#FF3864',
  },
  // 新增：薄荷清新 - 适合生活方式、健康
  mint: {
    bg: '#F0FFF4',
    bgGradient: ['#F0FFF4', '#E6FFFA'],
    decorativeColor: '#38B2AC',
    text: '#234E52',
    textHeading: '#1A202C',
    textMuted: '#4A5568',
    border: '#B2F5EA',
    codeBg: '#234E52',
    codeText: '#81E6D9',
    inlineCodeBg: '#E6FFFA',
    inlineCodeText: '#319795',
    quoteBg: '#E6FFFA',
    quoteBorder: '#38B2AC',
    link: '#319795',
    accent: '#38B2AC',
  },
}

export type ThemeKey = keyof typeof THEMES

export function getTheme(themeKey: ThemeKey): Theme {
  return THEMES[themeKey]
}
