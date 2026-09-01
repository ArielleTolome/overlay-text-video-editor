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
  snapchatTemplatePath?: string;
  commentTemplatePath?: string;
  iosBarrageTemplatePath?: string;
  twotoneTemplatePath?: string;
}

export class OverlayRenderer {
  private browser: Browser | null = null;
  private strokeTemplateHtml: string = '';
  private cardTemplateHtml: string = '';
  private snapchatTemplateHtml: string = '';
  private commentTemplateHtml: string = '';
  private iosBarrageTemplateHtml: string = '';
  private twotoneTemplateHtml: string = '';
  private overlayCache: Map<string, string> = new Map();
  constructor(private options: OverlayRenderOptions = {}) {}

  /**
   * Initializes the browser and loads template HTML files.
   */
  public async init(): Promise<void> {
    if (!this.browser) {
      const systemChromePath = this.findSystemChrome();
      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: systemChromePath || undefined,
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
    const defaultSnapchatPath = path.resolve(process.cwd(), 'templates/snapchat.html');
    const defaultCommentPath = path.resolve(process.cwd(), 'templates/tiktok_comment.html');
    const defaultBarragePath = path.resolve(process.cwd(), 'templates/ios_notification_barrage.html');
    const defaultTwotonePath = path.resolve(process.cwd(), 'templates/tiktok_twotone.html');

    const strokePath = this.options.strokeTemplatePath || defaultStrokePath;
    const cardPath = this.options.cardTemplatePath || defaultCardPath;
    const snapchatPath = this.options.snapchatTemplatePath || defaultSnapchatPath;
    const commentPath = this.options.commentTemplatePath || defaultCommentPath;
    const barragePath = this.options.iosBarrageTemplatePath || defaultBarragePath;
    const twotonePath = this.options.twotoneTemplatePath || defaultTwotonePath;

    this.strokeTemplateHtml = fs.existsSync(strokePath)
      ? fs.readFileSync(strokePath, 'utf8')
      : this.getFallbackStrokeTemplate();

    this.cardTemplateHtml = fs.existsSync(cardPath)
      ? fs.readFileSync(cardPath, 'utf8')
      : this.getFallbackCardTemplate();

    this.snapchatTemplateHtml = fs.existsSync(snapchatPath)
      ? fs.readFileSync(snapchatPath, 'utf8')
      : this.getFallbackSnapchatTemplate();

    this.commentTemplateHtml = fs.existsSync(commentPath)
      ? fs.readFileSync(commentPath, 'utf8')
      : this.getFallbackCommentTemplate();

    this.iosBarrageTemplateHtml = fs.existsSync(barragePath)
      ? fs.readFileSync(barragePath, 'utf8')
      : this.getFallbackCommentTemplate();

    this.twotoneTemplateHtml = fs.existsSync(twotonePath)
      ? fs.readFileSync(twotonePath, 'utf8')
      : this.getFallbackTwotoneTemplate();
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

    let templateHtml = this.strokeTemplateHtml;
    let compId = 'tiktok-stroke';

    if (style === 'card') {
      templateHtml = this.cardTemplateHtml;
      compId = 'tiktok-card';
    } else if (style === 'snapchat') {
      templateHtml = this.snapchatTemplateHtml;
      compId = 'snapchat-bar';
    } else if (style === 'comment') {
      templateHtml = this.commentTemplateHtml;
      compId = 'tiktok-comment';
    } else if (style === 'ios-barrage') {
      templateHtml = this.iosBarrageTemplateHtml;
      compId = 'ios-barrage';
    } else if (style === 'twotone') {
      templateHtml = this.twotoneTemplateHtml;
      compId = 'tiktok-twotone';
    }
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
          const activeCompId = '${compId}';
          if (window.__timelines && window.__timelines[activeCompId]) {
            // Seek to 1.0s to ensure pop-in transition is 100% complete
            window.__timelines[activeCompId].seek(1.0);
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
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });
      // Ensure fonts and DOM are fully rendered
      await page.evaluate(() => {
        const doc = document as unknown as { fonts?: { ready?: Promise<unknown> } };
        return doc.fonts?.ready ?? Promise.resolve();
      });

      // Also explicitly seek timeline to hold state
      await page.evaluate((activeCompId: string) => {
        const win = window as unknown as { __timelines?: Record<string, { seek: (t: number) => void }> };
        if (win.__timelines && win.__timelines[activeCompId]) {
          win.__timelines[activeCompId].seek(1.0);
        }
      }, compId);

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
      try {
        await page.close();
      } catch {
        // ignore closed page errors
      }
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
   * Discovers system Chrome or Chromium binary across OS locations.
   */
  private findSystemChrome(): string | null {
    if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
      return process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const candidates = [
      // macOS
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      // Linux
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
      // Windows
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  /**
   * Fallback embedded stroke template if HTML file is missing.
   */
  private getFallbackStrokeTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><style>
body { margin:0; width:1080px; height:1920px; background:transparent; display:flex; justify-content:center; align-items:center; }
.caption-stroke { color:#fff; font-family:-apple-system,sans-serif; font-size:44px; font-weight:800; -webkit-text-stroke:4px #000; text-align:center; max-width:85%; }
</style></head>
<body><div class="caption-stroke" id="caption">{{CAPTION}}</div></body>
</html>`;
  }
  private getFallbackCardTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><style>
body { margin:0; width:1080px; height:1920px; background:transparent; display:flex; justify-content:center; align-items:center; }
.caption-card { background:rgba(255,255,255,0.96); border-radius:24px; padding:24px 32px; color:#111; font-family:-apple-system,sans-serif; font-size:42px; font-weight:700; text-align:center; max-width:85%; }
</style></head>
<body><div class="caption-card" id="caption">{{CAPTION}}</div></body>
</html>`;
  }

  /**
  private getFallbackSnapchatTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><style>
body { margin:0; width:1080px; height:1920px; background:transparent; display:flex; justify-content:center; align-items:center; }
.snapchat-bar { width:100%; background:rgba(0,0,0,0.65); padding:24px 48px; color:#fff; font-family:-apple-system,sans-serif; font-size:46px; font-weight:500; text-align:center; }
</style></head>
<body><div class="snapchat-bar" id="caption">{{CAPTION}}</div></body>
</html>`;
  }

  /**
   * Fallback embedded comment template if HTML file is missing.
   */
  private getFallbackCommentTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><style>
body { margin:0; width:1080px; height:1920px; background:transparent; display:flex; justify-content:center; align-items:center; }
.comment-card { background:#fff; border-radius:24px; padding:24px 28px; box-shadow:0 8px 30px rgba(0,0,0,0.3); max-width:85%; color:#161823; font-family:-apple-system,sans-serif; font-size:40px; font-weight:600; }
</style></head>
<body><div class="comment-card" id="caption">{{CAPTION}}</div></body>
</html>`;
  }

  /**
   * Fallback embedded two-tone template if HTML file is missing.
   */
  private getFallbackTwotoneTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><style>
body { margin:0; width:1080px; height:1920px; background:transparent; display:flex; justify-content:center; align-items:center; }
.stack { display:flex; flex-direction:column; align-items:center; gap:10px; }
.top { background:#000; color:#fff; padding:14px 34px; border-radius:20px; font-size:52px; font-weight:900; text-transform:uppercase; font-family:-apple-system,sans-serif; }
.bot { background:#fff; color:#9b27dc; padding:14px 34px; border-radius:20px; font-size:48px; font-weight:800; font-family:-apple-system,sans-serif; }
</style></head>
<body><div class="stack"><div class="top">{{CAPTION}}</div><div class="bot">Check this out</div></div></body>
</html>`;
  }
}
