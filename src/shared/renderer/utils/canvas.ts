/**
 * Canvas 渲染工具 - 共享
 */

import type { LayoutConfig, Theme } from "../../types";
import type { Padding } from "../../types";

export interface CanvasAndContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export interface CreateCanvasFn {
  (width: number, height: number): CanvasAndContext;
}

/**
 * 渲染背景 - 支持渐变和装饰
 */
export function renderBackground(
  ctx: CanvasRenderingContext2D,
  config: LayoutConfig,
  theme: Theme,
): void {
  // 创建渐变背景
  if (theme.bgGradient && theme.bgGradient.length >= 2) {
    const gradient = ctx.createLinearGradient(
      0,
      0,
      config.pageWidth,
      config.pageHeight,
    );
    gradient.addColorStop(0, theme.bgGradient[0]);
    gradient.addColorStop(1, theme.bgGradient[1]);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = theme.bg;
  }
  ctx.fillRect(0, 0, config.pageWidth, config.pageHeight);

  renderPageGrid(ctx, config, theme);

  // 绘制装饰元素（数据流背景）
  renderDecorativeElements(ctx, config, theme);

  // 如果有背景图案，在正文区域添加半透明遮罩，确保可读性
  if (theme.bgPattern) {
    renderContentOverlay(ctx, config, theme);
  }
}

function renderPageGrid(
  ctx: CanvasRenderingContext2D,
  config: LayoutConfig,
  theme: Theme,
): void {
  if (theme.fontFamily === "sans" && theme.bg === "#FFFFFF") {
    return;
  }

  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.globalAlpha = theme.bgPattern ? 0.08 : theme.fontFamily === "sans" ? 0.08 : 0.12;
  ctx.lineWidth = 1;

  const spacing = theme.fontFamily === "sans" ? 52 : 44;
  for (let x = 40; x < config.pageWidth - 40; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x, config.pageHeight - 40);
    ctx.stroke();
  }

  for (let y = 40; y < config.pageHeight - 40; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(config.pageWidth - 40, y);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 渲染正文区域遮罩 - 确保背景不影响正文可读性
 */
function renderContentOverlay(
  ctx: CanvasRenderingContext2D,
  config: LayoutConfig,
  theme: Theme,
): void {
  const margin = 50; // 边缘保留数据流效果
  const x = margin;
  const y = margin;
  const width = config.pageWidth - margin * 2;
  const height = config.pageHeight - margin * 2;

  // 使用背景色或渐变起始色作为遮罩，确保与背景一致
  ctx.save();
  // 如果有渐变，使用渐变的起始色；否则使用纯色背景
  ctx.fillStyle = theme.bgGradient?.[0] ?? theme.bg;

  // @ts-ignore
  if (ctx.roundRect) ctx.roundRect(x, y, width, height, 16);
  ctx.fill();

  ctx.restore();
}

/**
 * 渲染装饰元素 - 几何图形、光晕等
 */
function renderDecorativeElements(
  ctx: CanvasRenderingContext2D,
  config: LayoutConfig,
  theme: Theme,
): void {
  // 如果主题有背景图案，优先渲染图案
  if (theme.bgPattern) {
    renderPatternBackground(ctx, config, theme);
    return;
  }
}

/**
 * 渲染图案背景 - 黑盒数据流效果
 * 文字从上到下垂直排列，使用 mono 字体，像代码雨/数据流
 */
function renderPatternBackground(
  ctx: CanvasRenderingContext2D,
  config: LayoutConfig,
  theme: Theme,
): void {
  const pattern = theme.bgPattern || "MD";
  const color = theme.textMuted;

  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = color;
  // 使用 mono 字体，更像代码/数据流
  ctx.font = '18px "SF Mono", "Fira Code", "JetBrains Mono", Monaco, monospace';

  // 垂直数据流效果 - 多列文字从上到下
  const colSpacing = 35; // 列间距
  const lineSpacing = 20; // 行间距
  const chars = pattern.split("");

  // 绘制多列数据流
  for (let x = 0; x < config.pageWidth; x += colSpacing) {
    // 每列起始位置略有不同，营造流动感
    const offsetY = (x % 3) * 10;

    for (let y = -50 + offsetY; y < config.pageHeight + 50; y += lineSpacing) {
      // 循环使用 pattern 的字符
      const charIndex = Math.floor((y / lineSpacing) % chars.length);
      const char = chars[charIndex] || pattern;

      // 随机透明度变化，营造数据流动感
      const alpha = 0.05 + Math.random() * 0.15;
      ctx.globalAlpha = alpha;

      ctx.fillText(char, x, y);
    }
  }

  ctx.restore();
}

/**
 * 渲染页面页脚（页码）
 */
export function renderPageFooter(
  ctx: CanvasRenderingContext2D,
  config: LayoutConfig,
  pageNumber: number,
  fonts: { body: string },
  textColor: string,
): void {
  ctx.fillStyle = textColor;
  const footerFont = config.fontFamily === "sans"
    ? `"SF Mono", "JetBrains Mono", "Fira Code", monospace`
    : fonts.body;
  ctx.font = `25px ${footerFont}`;
  ctx.textAlign = "right";
  ctx.fillText(
    `- ${pageNumber} -`,
    config.pageWidth - config.padding.right,
    config.pageHeight - 55,
  );
  ctx.textAlign = "left";
}

/**
 * 渲染文本行
 */
export function renderTextLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  font: string,
): void {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}

/**
 * 渲染引用块背景 - 更有设计感的卡片样式
 */
export function renderBlockQuote(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  theme: Theme,
): void {
  const isInspection = theme.fontFamily === "sans";
  // 主背景
  ctx.fillStyle = theme.quoteBg;
  ctx.beginPath();
  // @ts-ignore
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, isInspection ? 0 : 12);
  } else {
    ctx.rect(x, y, width, height);
  }
  ctx.fill();

  // 左边强调条
  ctx.fillStyle = theme.quoteBorder;
  if (isInspection) {
    ctx.fillRect(x, y, width, 6);
  } else {
    ctx.beginPath();
    // @ts-ignore
    if (ctx.roundRect) {
      ctx.roundRect(x, y + 16, 4, height - 32, 2);
    } else {
      ctx.fillRect(x, y + 16, 4, height - 32);
    }
    // @ts-ignore
    if (ctx.roundRect) ctx.roundRect(x, y + 16, 4, height - 32, 2);
    ctx.fill();
  }

  // 右上角装饰引号
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = theme.quoteBorder;
  ctx.font = theme.fontFamily === "sans"
    ? `700 48px "SF Mono", "JetBrains Mono", monospace`
    : "bold 60px Georgia, serif";
  ctx.fillText('"', x + width - 50, y + (isInspection ? 60 : 50));
  ctx.restore();
}

/**
 * 渲染代码块背景 - 毛玻璃效果
 */
export function renderCodeBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  theme: Theme,
): void {
  // 主背景
  ctx.fillStyle = theme.codeBg;
  ctx.beginPath();
  // @ts-ignore
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, 12);
  } else {
    ctx.rect(x, y, width, height);
  }
  ctx.fill();

  // 顶部装饰条
  ctx.fillStyle = theme.accent;
  ctx.globalAlpha = theme.fontFamily === "sans" ? 0.85 : 0.6;
  ctx.beginPath();
  // @ts-ignore
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, 4, [12, 12, 0, 0]);
  } else {
    ctx.fillRect(x, y, width, 4);
  }
  // @ts-ignore
  if (ctx.roundRect) ctx.roundRect(x, y, width, 4, [12, 12, 0, 0]);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 三个点装饰（模拟窗口按钮）
  const dotY = y + 14;
  const dots = theme.fontFamily === "sans"
    ? [theme.accent, theme.codeText, theme.textMuted]
    : ["#FF5F56", "#FFBD2E", "#27C93F"];
  dots.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 20 + i * 16, dotY, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * 渲染水平分割线 - 更有设计感
 */
export function renderHorizontalRule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  theme: Theme,
): void {
  const isInspection = theme.fontFamily === "sans";
  const centerX = x + width / 2;

  if (isInspection) {
    ctx.strokeStyle = theme.tableBorder || theme.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x + width, y - 4);
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x + width, y + 4);
    ctx.stroke();
    ctx.fillStyle = theme.accent;
    ctx.fillRect(centerX - 24, y - 8, 48, 16);
    return;
  }

  // 中心装饰点
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(centerX, y, 4, 0, Math.PI * 2);
  ctx.fill();

  // 左右线条
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.28;

  // 左线
  ctx.beginPath();
  ctx.moveTo(x + 60, y);
  ctx.lineTo(centerX - 15, y);
  ctx.stroke();

  // 右线
  ctx.beginPath();
  ctx.moveTo(centerX + 15, y);
  ctx.lineTo(x + width - 60, y);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/**
 * 渲染表格
 */
export function renderTable(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  rowHeight: number,
  theme: Theme,
): void {
  ctx.fillStyle = theme.quoteBg;
  ctx.fillRect(x, y, width, rowHeight);
}

/**
 * 渲染表格行
 */
export function renderTableRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  theme: Theme,
): void {
  ctx.strokeStyle = theme.tableBorder || theme.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();
}

/**
 * 渲染任务列表复选框
 */
export function renderTaskCheckbox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  checked: boolean,
  theme: Theme,
  font: string,
): void {
  ctx.fillStyle = theme.textMuted;
  ctx.font = font;
  const symbol = checked ? "☑" : "☐";
  ctx.fillText(symbol, x, y);
}

/**
 * 渲染列表项符号
 */
export function renderListBullet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ordered: boolean | undefined,
  index: number,
  theme: Theme,
  font: string,
): void {
  ctx.fillStyle = theme.accent;
  ctx.font = font;
  const bullet = ordered ? `${index + 1}.` : "•";
  ctx.fillText(bullet, x, y);
}
