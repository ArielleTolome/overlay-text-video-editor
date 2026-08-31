import * as fs from 'node:fs';
import * as path from 'node:path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import type { CaptionStyle } from './types';
import { ensureDir } from './utils';

export interface OverlayRenderOptions {
  top?: string | number;
  size?: string | number;
  strokeTemplatePath?: string;
  cardTemplatePath?: string;
}

export class OverlayRenderer {
  private browser: Browser | null = null;
  private strokeTemplateHtml: string = '';
  private cardTemplateHtml: string = '';
  private overlayCache: Map<string, string> = new Map();

  constructor(private options: OverlayRenderOptions = {}) {}

  /**
   * Initializes the browser and loads template HTML files.
   */
  public async init(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=none',
        ],
      });
    }

    // Load templates
    const defaultStrokePath = path.resolve(process.cwd(), 'templates/tiktok_stroke.html');
    const defaultCardPath = path.resolve(process.cwd(), 'templates/tiktok_card.html');

    const strokePath = this.options.strokeTemplatePath || defaultStrokePath;
    const cardPath = this.options.cardTemplatePath || defaultCardPath;

    if (fs.existsSync(strokePath)) {
      this.strokeTemplateHtml = fs.readFileSync(strokePath, 'utf8');
    } else {
      this.strokeTemplateHtml = this.getFallbackStrokeTemplate();
    }

    if (fs.existsSync(cardPath)) {
      this.cardTemplateHtml = fs.readFileSync(cardPath, 'utf8');
    } else {
      this.cardTemplateHtml = this.getFallbackCardTemplate();
    }
  }

  /**
   * Renders an overlay transparent PNG for a specific caption and style.
   * If outputPath is provided, writes to file and returns filePath.
   */
  public async renderOverlay(
    caption: string,
    style: CaptionStyle,
    outputPath?: string,
    customOptions?: OverlayRenderOptions
  ): Promise<string> {
    if (!this.browser) {
      await this.init();
    }

    const cacheKey = `${style}:::${caption}:::${customOptions?.top || ''}:::${customOptions?.size || ''}`;
    if (outputPath && this.overlayCache.has(cacheKey)) {
      const cachedPath = this.overlayCache.get(cacheKey)!;
      if (fs.existsSync(cachedPath)) {
        if (cachedPath !== outputPath) {
          fs.copyFileSync(cachedPath, outputPath);
        }
        return outputPath;
      }
    }

    const templateHtml = style === 'card' ? this.cardTemplateHtml : this.strokeTemplateHtml;
    const safeCaption = JSON.stringify(caption);
    const escapedCaption = caption
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    let html = templateHtml.replace(/\{\{CAPTION\}\}/g, escapedCaption);
    // Prepend script setting window.CAPTION and seeking timeline to steady state
    const injectionScript = `
      <script>
        window.CAPTION = ${safeCaption};
        window.addEventListener('DOMContentLoaded', () => {
          const compId = '${style === 'card' ? 'tiktok-card' : 'tiktok-stroke'}';
          if (window.__timelines && window.__timelines[compId]) {
            // Seek to 1.0s to ensure pop-in transition is 100% complete
            window.__timelines[compId].seek(1.0);
          }
        });
      </script>
    `;
    html = html.replace('</head>', `${injectionScript}</head>`);

    const page = await this.browser!.newPage();
    try {
      await page.setViewport({
        width: 1080,
        height: 1920,
        deviceScaleFactor: 1,
      });

      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Ensure fonts and DOM are fully rendered
      await page.evaluate(() => {
        const doc = document as unknown as { fonts?: { ready?: Promise<unknown> } };
        return doc.fonts?.ready ?? Promise.resolve();
      });

      // Also explicitly seek timeline to hold state
      await page.evaluate((compId: string) => {
        const win = window as unknown as { __timelines?: Record<string, { seek: (t: number) => void }> };
        if (win.__timelines && win.__timelines[compId]) {
          win.__timelines[compId].seek(1.0);
        }
      }, style === 'card' ? 'tiktok-card' : 'tiktok-stroke');

      const targetPath = outputPath || path.resolve(process.cwd(), `output/temp_${Date.now()}_${Math.random().toString(36).slice(2)}.png`);
      ensureDir(path.dirname(targetPath));

      await page.screenshot({
        path: targetPath,
        omitBackground: true,
        type: 'png',
      });

      this.overlayCache.set(cacheKey, targetPath);
      return targetPath;
    } finally {
      await page.close();
    }
  }

  /**
   * Closes the underlying Puppeteer browser.
   */
  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Fallback embedded stroke template if HTML file is missing.
   */
  private getFallbackStrokeTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 1080px; height: 1920px; overflow: hidden; background: transparent; }
    #stage { width: 1080px; height: 1920px; display: flex; justify-content: center; align-items: flex-start; }
    .caption-wrapper { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); width: 100%; max-width: 880px; padding: 0 20px; text-align: center; }
    .caption-text { color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Montserrat", "Proxima Nova", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"; font-size: 52px; font-weight: 800; line-height: 1.25; -webkit-text-stroke: 4px #000000; paint-order: stroke fill; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9), 0 4px 12px rgba(0, 0, 0, 0.6); }
  </style>
</head>
<body>
  <div id="stage">
    <div class="caption-wrapper"><div class="caption-text">{{CAPTION}}</div></div>
  </div>
</body>
</html>`;
  }

  /**
   * Fallback embedded card template if HTML file is missing.
   */
  private getFallbackCardTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 1080px; height: 1920px; overflow: hidden; background: transparent; }
    #stage { width: 1080px; height: 1920px; display: flex; justify-content: center; align-items: flex-start; }
    .caption-wrapper { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); width: 100%; max-width: 880px; padding: 0 24px; display: flex; justify-content: center; }
    .caption-card { background: rgba(255, 255, 255, 0.96); backdrop-filter: blur(16px); border-radius: 28px; padding: 28px 40px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35); text-align: center; max-width: 840px; }
    .caption-text { color: #111111; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Plus Jakarta Sans", "Montserrat", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"; font-size: 44px; font-weight: 700; line-height: 1.35; }
  </style>
</head>
<body>
  <div id="stage">
    <div class="caption-wrapper"><div class="caption-card"><div class="caption-text">{{CAPTION}}</div></div></div>
  </div>
</body>
</html>`;
  }
}
