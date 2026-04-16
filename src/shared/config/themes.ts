/**
 * 主题配置 - 共享
 * 社交友好的配色方案
 */

import type { Theme } from "../types";

export const THEMES: Record<string, Theme> = {
  // 薄荷清新 - 参考 flo-bit 博客模板的安静博客阅读感
  mint: {
    fontFamily: "serif",
    bg: "#f7faf7",
    bgGradient: ["#fbfdfb", "#eef4ef"],
    decorativeColor: "#d9e4d8",
    text: "#243129",
    textHeading: "#162019",
    textMuted: "#6b7c70",
    border: "transparent",
    tableBorder: "#ccd8ce",
    codeBg: "#1d2922",
    codeText: "#edf4ee",
    inlineCodeBg: "#e5ede6",
    inlineCodeText: "#446752",
    quoteBg: "#ecf2ed",
    quoteBorder: "transparent",
    link: "#3c7254",
    accent: "#5d8d71",
  },
  // 新增：编辑风格 - 参考腾讯研究院海报
  editorial: {
    fontFamily: "serif",
    bg: "#F5F0E8",
    bgGradient: ["#F5F0E8", "#F5F0E8"],
    decorativeColor: "#C75B39",
    bgPattern: "MD", // 背景图案文字
    text: "#2C2824",
    textHeading: "#1A1714",
    textMuted: "#6B6560",
    border: "#D4C8B8",
    tableBorder: "#D4C8B8",
    codeBg: "#2C2824",
    codeText: "#E8E0D4",
    inlineCodeBg: "#E8E0D4",
    inlineCodeText: "#C75B39",
    quoteBg: "#EDE6D6",
    quoteBorder: "#C75B39",
    link: "#C75B39",
    accent: "#C75B39",
  },
  // 工业检测报告风 - 参考质检单、出厂报告、技术卡片的单色印刷感
  inspection: {
    fontFamily: "sans",
    bg: "#FFFFFF",
    bgGradient: ["#FFFFFF", "#FFFFFF"],
    decorativeColor: "#D3CEC3",
    text: "#22201D",
    textHeading: "#171513",
    textMuted: "#6F6961",
    border: "#A9A29A",
    tableBorder: "#7C766E",
    codeBg: "#161616",
    codeText: "#F3EFE9",
    inlineCodeBg: "#E5E7EB",
    inlineCodeText: "#7B1E22",
    quoteBg: "#E5E7EB",
    quoteBorder: "#7B1E22",
    link: "#7B1E22",
    accent: "#7B1E22",
  },
};

export type ThemeKey = keyof typeof THEMES;

export function getTheme(themeKey: ThemeKey): Theme {
  const theme = THEMES[themeKey];
  if (!theme) {
    throw new Error(`Invalid theme: ${String(themeKey)}. Available themes: ${Object.keys(THEMES).join(', ')}`);
  }
  return theme;
}
