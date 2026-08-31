import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  BatchManifest,
  CaptionGroupResult,
  CaptionStyle,
  EditorOptions,
  RenderedVideoItem,
} from './types';
import { DEFAULT_CAPTIONS } from './types';
import { OverlayRenderer } from './renderer';
import {
  buildStandardVideoNames,
  compositeOverlay,
  createZipArchive,
  ensureDir,
  formatBytes,
  formatDuration,
  generateMarkdownReport,
  getShortCaptionSlug,
  getTimestampInfo,
  getVideoMetadata,
  slugify,
} from './utils';

export class VideoEditor {
  private options: Required<EditorOptions>;
  private renderer: OverlayRenderer;

  constructor(options: EditorOptions = {}) {
    const defaultOutput = path.resolve(process.cwd(), 'output');
    const defaultVideosDir = path.resolve(process.cwd(), 'assets/raw_cuts');

    this.options = {
      captions: options.captions && options.captions.length > 0 ? options.captions : DEFAULT_CAPTIONS,
      captionsFile: options.captionsFile || '',
      videos: options.videos || [],
      videosDir: options.videosDir || defaultVideosDir,
      styles: options.styles && options.styles.length > 0 ? options.styles : ['stroke', 'card', 'snapchat', 'comment'],
      outputDir: options.outputDir || defaultOutput,
      organizeByDate: options.organizeByDate !== undefined ? options.organizeByDate : true,
      batchName: options.batchName || '',
      zip: options.zip !== undefined ? options.zip : true,
      zipName: options.zipName || 'tiktok_caption_videos.zip',
      concurrency: options.concurrency && options.concurrency > 0 ? options.concurrency : 3,
      strokeTemplatePath: options.strokeTemplatePath || '',
      cardTemplatePath: options.cardTemplatePath || '',
      snapchatTemplatePath: options.snapchatTemplatePath || '',
      commentTemplatePath: options.commentTemplatePath || '',
      verbose: options.verbose || false,
    };

    this.renderer = new OverlayRenderer({
      strokeTemplatePath: this.options.strokeTemplatePath,
      cardTemplatePath: this.options.cardTemplatePath,
      snapchatTemplatePath: this.options.snapchatTemplatePath,
      commentTemplatePath: this.options.commentTemplatePath,
    });
  }

  /**
   * Resolves the list of captions from array or file.
   */
  private resolveCaptions(): string[] {
    if (this.options.captionsFile && fs.existsSync(this.options.captionsFile)) {
      const content = fs.readFileSync(this.options.captionsFile, 'utf8').trim();
      if (content.startsWith('[') && content.endsWith(']')) {
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) return parsed.map(String);
        } catch {
          // fallback to lines
        }
      }
      return content.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    }
    return this.options.captions;
  }

  /**
   * Resolves the list of raw video paths.
   */
  private resolveVideos(): string[] {
    if (this.options.videos && this.options.videos.length > 0) {
      return this.options.videos.filter((v) => fs.existsSync(v));
    }

    if (fs.existsSync(this.options.videosDir)) {
      const files = fs.readdirSync(this.options.videosDir)
        .filter((f) => f.endsWith('.mp4') || f.endsWith('.mov') || f.endsWith('.mkv'))
        .sort()
        .map((f) => path.join(this.options.videosDir, f));
      if (files.length > 0) return files;
    }

    throw new Error(`No raw videos found in "${this.options.videosDir}". Please provide video files.`);
  }

  /**
   * Executes the full batch rendering and packaging pipeline.
   */
  public async renderBatch(): Promise<BatchManifest> {
    const startTime = Date.now();
    const timestampInfo = getTimestampInfo(new Date(startTime));
    const captions = this.resolveCaptions();
    const videoPaths = this.resolveVideos();
    const styles = this.options.styles;

    const baseOutputDir = path.resolve(this.options.outputDir);
    const batchDirectoryName = this.options.batchName
      ? `batch_${this.options.batchName}_${timestampInfo.timeSlug}`
      : `batch_${timestampInfo.timeSlug}`;

    const batchOutputDir = this.options.organizeByDate
      ? path.join(baseOutputDir, timestampInfo.date, batchDirectoryName)
      : baseOutputDir;

    const captionsOutputDir = path.join(batchOutputDir, 'captions');
    const allVideosOutputDir = path.join(batchOutputDir, 'all_videos');
    const tempOverlaysDir = path.join(batchOutputDir, '.overlays_temp');

    ensureDir(baseOutputDir);
    ensureDir(batchOutputDir);
    ensureDir(captionsOutputDir);
    ensureDir(allVideosOutputDir);
    ensureDir(tempOverlaysDir);

    console.log(`\n🎬 Starting TikTok Caption Video Generator`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`• Date / Time: ${timestampInfo.date} ${timestampInfo.time} (${timestampInfo.stamp})`);
    console.log(`• Captions count: ${captions.length}`);
    console.log(`• Raw video cuts: ${videoPaths.length} (${videoPaths.map((p) => path.basename(p)).join(', ')})`);
    console.log(`• Overlay styles: ${styles.join(', ')}`);
    console.log(`• Expected renders: ${captions.length * videoPaths.length * styles.length} videos`);
    console.log(`• Batch directory: ${batchOutputDir}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // 1. Initialize Overlay Renderer
    console.log(`🎨 Step 1: Initializing overlay renderer & rendering caption overlays...`);
    await this.renderer.init();

    // Map: style -> caption -> overlayImagePath
    const overlayMap: Record<string, Record<string, string>> = {};
    for (const style of styles) {
      overlayMap[style] = {};
    }

    for (let cIdx = 0; cIdx < captions.length; cIdx++) {
      const captionText = captions[cIdx];
      const slug = slugify(captionText, cIdx);

      for (const style of styles) {
        const overlayPath = path.join(tempOverlaysDir, `${slug}_${style}.png`);
        await this.renderer.renderOverlay(captionText, style, overlayPath);
        overlayMap[style][captionText] = overlayPath;
        if (this.options.verbose) {
          console.log(`   [✓] Generated ${style} overlay for [${slug}]`);
        }
      }
    }
    console.log(`   ✓ Rendered all ${captions.length * styles.length} transparent overlay assets.\n`);

    // 2. Video Compositing Tasks with Standard Naming Convention
    console.log(`🎥 Step 2: Compositing video cuts with overlays (concurrency: ${this.options.concurrency})...`);

    interface RenderTask {
      captionIndex: number;
      captionTag: string;
      captionText: string;
      captionSlug: string;
      captionShortSlug: string;
      style: CaptionStyle;
      rawVideoPath: string;
      rawVideoName: string;
      standardFileName: string;
      standardFlatFileName: string;
      overlayPath: string;
      captionFolder: string;
      outputVideoPath: string;
      flatVideoPath: string;
    }

    const tasks: RenderTask[] = [];

    for (let cIdx = 0; cIdx < captions.length; cIdx++) {
      const captionText = captions[cIdx];
      const captionSlug = slugify(captionText, cIdx);
      const captionFolder = path.join(captionsOutputDir, captionSlug);
      ensureDir(captionFolder);

      // Write caption.txt inside caption directory
      const captionTxtPath = path.join(captionFolder, 'caption.txt');
      fs.writeFileSync(captionTxtPath, captionText, 'utf8');

      for (const videoPath of videoPaths) {
        const videoBaseName = path.basename(videoPath, path.extname(videoPath));

        for (const style of styles) {
          const overlayPath = overlayMap[style][captionText];
          const { captionFolderFileName, allVideosFileName, captionTag, shortSlug } = buildStandardVideoNames({
            stamp: timestampInfo.stamp,
            rawVideoName: videoBaseName,
            style,
            captionIndex: cIdx,
            captionText,
          });

          const outputVideoPath = path.join(captionFolder, captionFolderFileName);
          const flatVideoPath = path.join(allVideosOutputDir, allVideosFileName);

          tasks.push({
            captionIndex: cIdx,
            captionTag,
            captionText,
            captionSlug,
            captionShortSlug: shortSlug,
            style,
            rawVideoPath: videoPath,
            rawVideoName: videoBaseName,
            standardFileName: captionFolderFileName,
            standardFlatFileName: allVideosFileName,
            overlayPath,
            captionFolder,
            outputVideoPath,
            flatVideoPath,
          });
        }
      }
    }

    const renderedItems: RenderedVideoItem[] = [];
    let completedCount = 0;
    const totalCount = tasks.length;

    // Worker pool for concurrency control
    const executeTask = async (task: RenderTask): Promise<RenderedVideoItem> => {
      const t0 = Date.now();
      await compositeOverlay(task.rawVideoPath, task.overlayPath, task.outputVideoPath);

      // Create hardlink or copy to all_videos/ directory
      if (fs.existsSync(task.flatVideoPath)) {
        fs.unlinkSync(task.flatVideoPath);
      }
      try {
        fs.linkSync(task.outputVideoPath, task.flatVideoPath);
      } catch {
        fs.copyFileSync(task.outputVideoPath, task.flatVideoPath);
      }

      const meta = await getVideoMetadata(task.outputVideoPath);
      completedCount++;
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

      console.log(
        `   [${completedCount}/${totalCount}] (${elapsed}s) Rendered: ${task.captionTag} -> ${path.basename(task.outputVideoPath)} (${formatBytes(meta.sizeBytes)})`
      );

      const item: RenderedVideoItem = {
        id: `${timestampInfo.stamp}_${task.captionSlug}_${task.rawVideoName}_${task.style}`,
        standardFileName: task.standardFileName,
        standardFlatFileName: task.standardFlatFileName,
        date: timestampInfo.date,
        time: timestampInfo.time,
        timestamp: timestampInfo.stamp,
        captionIndex: task.captionIndex,
        captionText: task.captionText,
        captionSlug: task.captionSlug,
        captionShortSlug: task.captionShortSlug,
        style: task.style,
        rawVideoPath: task.rawVideoPath,
        rawVideoName: task.rawVideoName,
        videoTag: task.rawVideoName,
        outputPath: task.outputVideoPath,
        flatOutputPath: task.flatVideoPath,
        relativeOutput: path.relative(batchOutputDir, task.outputVideoPath),
        relativeFlatOutput: path.relative(batchOutputDir, task.flatVideoPath),
        duration: meta.duration,
        width: meta.width,
        height: meta.height,
        fps: meta.fps,
        sizeBytes: meta.sizeBytes,
        renderedAt: new Date().toISOString(),
      };

      return item;
    };

    // Parallel execution with concurrency limit
    const queue = [...tasks];
    const activeWorkers: Promise<void>[] = [];

    for (let i = 0; i < Math.min(this.options.concurrency, queue.length); i++) {
      const worker = async () => {
        while (queue.length > 0) {
          const nextTask = queue.shift();
          if (nextTask) {
            const result = await executeTask(nextTask);
            renderedItems.push(result);
          }
        }
      };
      activeWorkers.push(worker());
    }

    await Promise.all(activeWorkers);
    await this.renderer.close();
    // 3. Generate Metadata per Caption Group
    console.log(`\n📁 Step 3: Generating per-caption metadata.json files...`);
    const captionGroups: CaptionGroupResult[] = [];

    for (let cIdx = 0; cIdx < captions.length; cIdx++) {
      const captionText = captions[cIdx];
      const captionSlug = slugify(captionText, cIdx);
      const captionFolder = path.join(captionsOutputDir, captionSlug);
      const groupVideos = renderedItems.filter((item) => item.captionSlug === captionSlug);

      const metadataContent = {
        batchId: timestampInfo.stamp,
        date: timestampInfo.date,
        time: timestampInfo.time,
        timestamp: timestampInfo.stamp,
        captionIndex: cIdx + 1,
        captionTag: `c${String(cIdx + 1).padStart(2, '0')}`,
        captionText,
        captionSlug,
        generatedAt: new Date().toISOString(),
        videoCount: groupVideos.length,
        namingConvention: {
          pattern: '[YYYYMMDD]_[HHMMSS]_[RAW_VIDEO]_[STYLE]_[CAPTION_TAG].mp4',
          example: groupVideos[0] ? groupVideos[0].standardFileName : '',
        },
        videos: groupVideos.map((v) => ({
          filename: v.standardFileName,
          flatFilename: v.standardFlatFileName,
          style: v.style,
          rawVideo: path.basename(v.rawVideoPath),
          durationSeconds: v.duration,
          resolution: `${v.width}x${v.height}`,
          fps: v.fps,
          sizeBytes: v.sizeBytes,
          formattedSize: formatBytes(v.sizeBytes),
          path: path.relative(captionFolder, v.outputPath),
        })),
      };

      const metadataPath = path.join(captionFolder, 'metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadataContent, null, 2), 'utf8');

      captionGroups.push({
        index: cIdx + 1,
        slug: captionSlug,
        text: captionText,
        folderPath: captionFolder,
        captionFilePath: path.join(captionFolder, 'caption.txt'),
        metadataFilePath: metadataPath,
        videos: groupVideos,
      });
    }

    // 4. Clean up temporary overlay files
    if (fs.existsSync(tempOverlaysDir)) {
      try {
        fs.rmSync(tempOverlaysDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }
    }

    // 5. Build Master Manifest and README.md
    console.log(`\n📊 Step 4: Building master manifest.json and README.md index report...`);
    const durationMs = Date.now() - startTime;

    const manifest: BatchManifest = {
      batchId: timestampInfo.stamp,
      batchName: this.options.batchName || undefined,
      createdAt: new Date(startTime).toISOString(),
      date: timestampInfo.date,
      time: timestampInfo.time,
      timestamp: timestampInfo.stamp,
      totalVideos: renderedItems.length,
      totalCaptions: captions.length,
      totalRawVideos: videoPaths.length,
      styles,
      outputDirectory: baseOutputDir,
      batchDirectory: batchOutputDir,
      zipFile: undefined,
      zipSizeBytes: undefined,
      namingConvention: {
        captionFolderPattern: '[YYYYMMDD]_[HHMMSS]_[RAW_VIDEO]_[STYLE]_[CAPTION_TAG].mp4',
        allVideosPattern: '[YYYYMMDD]_[HHMMSS]_[RAW_VIDEO]_[STYLE]_[CAPTION_TAG]_[SLUG].mp4',
        exampleCaptionFolder: `${timestampInfo.stamp}_video_1_stroke_c01.mp4`,
        exampleAllVideos: `${timestampInfo.stamp}_video_1_stroke_c01_walmart_receipt.mp4`,
      },
      captions: captionGroups.map((g) => ({
        index: g.index,
        slug: g.slug,
        text: g.text,
        videos: g.videos.map((v) => ({
          style: v.style,
          rawVideo: v.rawVideoPath,
          outputVideo: v.relativeOutput,
          sizeBytes: v.sizeBytes,
          duration: v.duration,
        })),
      })),
      allVideos: renderedItems.map((item) => ({
        filename: item.standardFlatFileName,
        captionSlug: item.captionSlug,
        style: item.style,
        rawVideo: path.basename(item.rawVideoPath),
        path: item.relativeFlatOutput,
        sizeBytes: item.sizeBytes,
        duration: item.duration,
      })),
    };

    const manifestPath = path.join(batchOutputDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    const readmeContent = generateMarkdownReport(manifest);
    const readmePath = path.join(batchOutputDir, 'README.md');
    fs.writeFileSync(readmePath, readmeContent, 'utf8');

    // Also link or copy to baseOutputDir/latest if date organization is enabled
    if (this.options.organizeByDate) {
      const latestDir = path.join(baseOutputDir, 'latest');
      try {
        if (fs.existsSync(latestDir)) {
          const stat = fs.lstatSync(latestDir);
          if (stat.isSymbolicLink()) {
            fs.unlinkSync(latestDir);
          }
        }
        fs.symlinkSync(batchOutputDir, latestDir, 'dir');
      } catch {
        // ignore symlink errors on non-supporting filesystems
      }
    }

    // 6. Create Zip Archive if requested
    if (this.options.zip) {
      const zipBaseName = this.options.zipName.replace(/\.zip$/i, '');
      const timestampedZipName = `${zipBaseName}_${timestampInfo.stamp}.zip`;
      console.log(`📦 Step 5: Packaging outputs into zip archive (${timestampedZipName})...`);

      const batchZipFilePath = path.join(batchOutputDir, timestampedZipName);
      await createZipArchive(batchOutputDir, batchZipFilePath);

      const zipStat = fs.statSync(batchZipFilePath);
      manifest.zipFile = batchZipFilePath;
      manifest.zipSizeBytes = zipStat.size;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

      // Also create/copy root zip for quick direct access
      const rootZipFilePath = path.join(baseOutputDir, this.options.zipName);
      try {
        if (fs.existsSync(rootZipFilePath)) {
          fs.unlinkSync(rootZipFilePath);
        }
        fs.copyFileSync(batchZipFilePath, rootZipFilePath);
      } catch {
        // ignore root copy error
      }

      console.log(`   ✓ Successfully packaged batch: ${batchZipFilePath} (${formatBytes(zipStat.size)})`);
      console.log(`   ✓ Updated root deliverable zip: ${rootZipFilePath}`);
    }

    console.log(`\n🎉 All batch operations completed successfully!`);
    console.log(`• Date / Time: ${timestampInfo.date} ${timestampInfo.time}`);
    console.log(`• Total videos created: ${renderedItems.length}`);
    console.log(`• Time elapsed: ${(durationMs / 1000).toFixed(1)}s`);
    console.log(`• Batch directory: ${batchOutputDir}`);
    if (manifest.zipFile) {
      console.log(`• Zip archive: ${manifest.zipFile}`);
    }

    return manifest;
  }
}

/**
 * Convenience helper to run a batch render.
 */
export async function batchRender(options: EditorOptions = {}): Promise<BatchManifest> {
  const editor = new VideoEditor(options);
  return editor.renderBatch();
}
