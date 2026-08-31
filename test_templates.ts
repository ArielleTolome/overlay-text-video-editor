import puppeteer, { Browser } from "puppeteer";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, join } from "path";

export interface RenderOptions {
  width?: number;
  height?: number;
  top?: string | number;
  fontSize?: string | number;
  time?: number;
  caption?: string;
  transparent?: boolean;
  backgroundImagePath?: string;
  outputPath?: string;
}

export const CAPTIONS = [
  "lowkey thought this $500 grocery card was fake until my Walmart receipt literally said $0.00 😭💀",
  "if u buy groceries and haven't claimed ur $500 allowance card yet u are literally throwing away money 😭",
  "literally just got $500 worth of groceries for free because of this allowance card 😭🛒",
  "stop paying full price for groceries when everyone is using this $500 grocery card 💀💸",
  "pov: you finally claimed the $500 grocery allowance card before it ran out 😭✨",
  "i was today years old when i found out anyone can get this $500 grocery card 💀🛒"
];

let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--font-render-hinting=none"
      ]
    });
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Renders a transparent overlay PNG or composited image using the given HTML template and caption.
 */
export async function renderOverlayBuffer(
  templatePath: string,
  caption: string,
  options: RenderOptions = {}
): Promise<Buffer> {
  const width = options.width || 1080;
  const height = options.height || 1920;
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1
    });

    const fullPath = resolve(templatePath);
    let html = readFileSync(fullPath, "utf-8");

    // Replace placeholder if present
    html = html.replace(/\{\{CAPTION\}\}/g, caption);

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 10000
    });

    // If background image is requested, inject as background
    if (options.backgroundImagePath && existsSync(options.backgroundImagePath)) {
      const bgBuffer = readFileSync(options.backgroundImagePath);
      const bgBase64 = `data:image/jpeg;base64,${bgBuffer.toString("base64")}`;
      await page.evaluate((bgData) => {
        const stage = document.getElementById("stage");
        if (stage) {
          stage.style.backgroundImage = `url("${bgData}")`;
          stage.style.backgroundSize = "cover";
          stage.style.backgroundPosition = "center";
        }
      }, bgBase64);
    }

    // Inject parameters via DOM
    await page.evaluate(
      (text, top, size, time) => {
        const captionEl = document.getElementById("caption-text");
        const cardEl = document.getElementById("caption-card");
        const wrapperEl = document.getElementById("caption-wrapper");
        if (captionEl) {
          captionEl.textContent = text;
          if (size) {
            captionEl.style.setProperty("--caption-font-size", String(size).includes("px") ? String(size) : `${size}px`);
          }
        }
        if (wrapperEl && top) {
          wrapperEl.style.setProperty(
            "--caption-top",
            String(top).includes("%") || String(top).includes("px") ? String(top) : `${top}%`
          );
        }

        // Advance GSAP timeline for full visibility
        const targetTime = time !== undefined ? time : 0.5;
        const win = window as Window & { __timelines?: Record<string, { seek: (t: number) => void }> };
        if (win.__timelines) {
          for (const key of Object.keys(win.__timelines)) {
            win.__timelines[key]?.seek(targetTime);
          }
        }
        if (captionEl) captionEl.style.opacity = "1";
        if (cardEl) cardEl.style.opacity = "1";
      },
      caption,
      options.top,
      options.fontSize,
      options.time
    );

    // Wait for fonts & layout stabilization
    await page.evaluate(() => {
      return new Promise((res) => requestAnimationFrame(() => setTimeout(res, 80)));
    });

    const isTransparent = !options.backgroundImagePath && options.transparent !== false;
    const screenshot = await page.screenshot({
      omitBackground: isTransparent,
      type: "png"
    });

    return Buffer.from(screenshot);
  } finally {
    await page.close();
  }
}

/**
 * Main test suite execution
 */
export async function runTests() {
  console.log("🚀 Starting HyperFrames template rendering tests...\n");

  const outputDir = resolve("output/previews");
  const compositeDir = resolve("output/previews/composites");
  mkdirSync(outputDir, { recursive: true });
  mkdirSync(compositeDir, { recursive: true });

  const templates = [
    {
      name: "tiktok_stroke",
      path: "templates/tiktok_stroke.html",
      style: "Classic TikTok Stroke",
      sampleBg: "analysis/raw_frames/raw2_2s.jpg"
    },
    {
      name: "tiktok_card",
      path: "templates/tiktok_card.html",
      style: "TikTok Rounded Card",
      sampleBg: "analysis/raw_frames/raw3_2s.jpg"
    }
  ];

  const generatedFiles: string[] = [];

  for (const tpl of templates) {
    console.log(`\n========================================`);
    console.log(`Rendering style: ${tpl.style} (${tpl.name})`);
    console.log(`========================================`);

    for (let i = 0; i < CAPTIONS.length; i++) {
      const caption = CAPTIONS[i];
      const filename = `${tpl.name}_caption_${i + 1}.png`;
      const outPath = join(outputDir, filename);

      console.log(`[${i + 1}/${CAPTIONS.length}] Rendering: "${caption.slice(0, 45)}..."`);

      const start = performance.now();
      const buffer = await renderOverlayBuffer(tpl.path, caption, {
        transparent: true
      });
      const duration = (performance.now() - start).toFixed(0);

      // Validate PNG buffer
      if (buffer.length === 0) {
        throw new Error(`Generated buffer is empty for ${filename}`);
      }
      if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
        throw new Error(`Generated file is not a valid PNG for ${filename}`);
      }

      writeFileSync(outPath, buffer);
      generatedFiles.push(outPath);
      console.log(`  ✓ Transparent overlay: ${filename} (${buffer.length} bytes, ${duration}ms)`);

      // Also generate a composite preview on raw frame for sample captions (1 and 2)
      if (i < 2 && existsSync(tpl.sampleBg)) {
        const compFilename = `${tpl.name}_composite_${i + 1}.png`;
        const compOutPath = join(compositeDir, compFilename);
        const compBuffer = await renderOverlayBuffer(tpl.path, caption, {
          backgroundImagePath: tpl.sampleBg,
          transparent: false
        });
        writeFileSync(compOutPath, compBuffer);
        generatedFiles.push(compOutPath);
        console.log(`  ✓ Video composite: ${compFilename} (${compBuffer.length} bytes)`);
      }
    }
  }

  await closeBrowser();

  console.log(`\n========================================`);
  console.log(`Validation & Acceptance Summary:`);
  console.log(`========================================`);
  console.log(`- Templates validated: templates/tiktok_stroke.html, templates/tiktok_card.html`);
  console.log(`- Captions tested: ${CAPTIONS.length} captions`);
  console.log(`- Total rendered previews: ${generatedFiles.length} files`);
  console.log(`- Emojis tested: 😭, 💀, 🛒, 💸, ✨`);
  console.log(`- Canvas resolution: 1080x1920 (9:16 Portrait)`);
  console.log(`- Output directory: ${outputDir}`);
  console.log(`\n✅ All tests and previews completed successfully!\n`);
}

// If run directly: `bun run test_templates.ts`
if (import.meta.main || process.argv[1]?.endsWith("test_templates.ts")) {
  runTests().catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });
}
