import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { BatchManifest, CaptionStyle } from './types';

export interface TimestampInfo {
  date: string; // '2026-08-31'
  time: string; // '14:50:22'
  timeSlug: string; // '14-50-22'
  compactDate: string; // '20260831'
  compactTime: string; // '145022'
  stamp: string; // '20260831_145022'
  iso: string;
}

/**
 * Returns formatted date and time representations for deterministic folder and file naming.
 */
export function getTimestampInfo(date: Date = new Date()): TimestampInfo {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');

  const dateStr = `${yyyy}-${mm}-${dd}`;
  const timeStr = `${hh}:${min}:${ss}`;
  const timeSlug = `${hh}-${min}-${ss}`;
  const compactDate = `${yyyy}${mm}${dd}`;
  const compactTime = `${hh}${min}${ss}`;
  const stamp = `${compactDate}_${compactTime}`;

  return {
    date: dateStr,
    time: timeStr,
    timeSlug,
    compactDate,
    compactTime,
    stamp,
    iso: date.toISOString(),
  };
}

/**
 * Creates a clean, filesystem-safe slug from a caption string.
 * Strips emojis and special characters, preserving alphanumeric words.
 */
export function slugify(text: string, index?: number): string {
  // Strip emojis and non-standard symbols
  const clean = text
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);

  const prefix = typeof index === 'number' ? `caption_${String(index + 1).padStart(2, '0')}_` : '';
  return `${prefix}${clean || 'caption'}`;
}

/**
 * Returns a short, concise 2-4 word slug for use in flat video filenames.
 */
export function getShortCaptionSlug(text: string): string {
  const clean = text
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const parts = clean.split('_').filter(Boolean);
  // Pick meaningful words (skip common leading stop words like 'if', 'i', 'the', 'lowkey', 'pov')
  const meaningful = parts.slice(0, 4).join('_');
  return meaningful || 'caption';
}

/**
 * Builds standard filenames following the video naming convention:
 * [DATE]_[TIME]_[VIDEO]_[STYLE]_[CAPTION-ID]_[SLUG].mp4
 */
export function buildStandardVideoNames(params: {
  stamp: string;
  rawVideoName: string;
  style: CaptionStyle;
  captionIndex: number;
  captionText: string;
}): {
  captionFolderFileName: string;
  allVideosFileName: string;
  captionTag: string;
  shortSlug: string;
} {
  const { stamp, rawVideoName, style, captionIndex, captionText } = params;
  const captionTag = `c${String(captionIndex + 1).padStart(2, '0')}`;
  const shortSlug = getShortCaptionSlug(captionText);

  // e.g. 20260831_145022_video_1_stroke_c01.mp4
  const captionFolderFileName = `${stamp}_${rawVideoName}_${style}_${captionTag}.mp4`;
  // e.g. 20260831_145022_video_1_stroke_c01_walmart_receipt.mp4
  const allVideosFileName = `${stamp}_${rawVideoName}_${style}_${captionTag}_${shortSlug}.mp4`;

  return {
    captionFolderFileName,
    allVideosFileName,
    captionTag,
    shortSlug,
  };
}
/**
 * Ensures a directory exists synchronously.
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Formats seconds into MM:SS format.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Formats byte count to human-readable string (KB, MB, etc.).
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Executes a child process command and returns stdout.
 */
export function runCommand(command: string, args: string[], cwd?: string): Promise<{ stdout: string; stderr: string }> {
  const { promise, resolve, reject } = Promise.withResolvers<{ stdout: string; stderr: string }>();
  const proc = spawn(command, args, { cwd });
  let stdout = '';
  let stderr = '';

  proc.stdout?.on('data', (data) => {
    stdout += data.toString();
  });

  proc.stderr?.on('data', (data) => {
    stderr += data.toString();
  });

  proc.on('close', (code) => {
    if (code === 0) {
      resolve({ stdout, stderr });
    } else {
      reject(new Error(`Command "${command} ${args.join(' ')}" exited with code ${code}.\n${stderr}`));
    }
  });

  proc.on('error', (err) => {
    reject(err);
  });

  return promise;
}

/**
 * Inspects a video file using ffprobe.
 */
export async function getVideoMetadata(videoPath: string): Promise<{
  width: number;
  height: number;
  duration: number;
  fps: number;
  sizeBytes: number;
}> {
  const stat = fs.statSync(videoPath);
  try {
    const { stdout } = await runCommand('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,r_frame_rate,duration',
      '-show_entries', 'format=duration',
      '-of', 'json',
      videoPath,
    ]);

    const info = JSON.parse(stdout);
    const stream = info.streams?.[0] || {};
    const format = info.format || {};

    let fps = 30;
    if (stream.r_frame_rate) {
      const [num, den] = stream.r_frame_rate.split('/').map(Number);
      if (den && !isNaN(num / den)) {
        fps = Math.round(num / den);
      }
    }

    const duration = parseFloat(stream.duration || format.duration || '0') || 0;
    const width = stream.width || 1080;
    const height = stream.height || 1920;

    return {
      width,
      height,
      duration,
      fps,
      sizeBytes: stat.size,
    };
  } catch {
    return {
      width: 1080,
      height: 1920,
      duration: 12,
      fps: 30,
      sizeBytes: stat.size,
    };
  }
}

export interface CompositeOptions {
  preset?: string;
  crf?: number;
  bitrate?: string;
  sfxAudioPath?: string;
  sfxDelaysMs?: number[];
  secondaryOverlayPath?: string;
  secondaryDelaySeconds?: number;
}

/**
 * Composites a transparent PNG overlay over a base video using FFmpeg.
 * Optionally mixes in synchronized SFX chimes at specified millisecond delays.
 */
export async function compositeOverlay(
  videoPath: string,
  overlayImagePath: string,
  outputPath: string,
  options?: CompositeOptions
): Promise<void> {
  ensureDir(path.dirname(outputPath));

  const isDarwin = process.platform === 'darwin';
  const hasSecondary = Boolean(options?.secondaryOverlayPath && fs.existsSync(options.secondaryOverlayPath));
  const hasSfx = Boolean(options?.sfxAudioPath && fs.existsSync(options.sfxAudioPath) && options.sfxDelaysMs && options.sfxDelaysMs.length > 0);

  const inputArgs: string[] = ['-y', '-i', videoPath, '-i', overlayImagePath];
  if (hasSecondary) {
    inputArgs.push('-i', options!.secondaryOverlayPath!);
  }
  const sfxInputIdx = hasSecondary ? 3 : 2;
  if (hasSfx) {
    inputArgs.push('-i', options!.sfxAudioPath!);
  }

  let filterComplex = '[0:v][1:v]overlay=0:0[vout]';
  if (hasSecondary) {
    const secDelay = options?.secondaryDelaySeconds !== undefined ? options.secondaryDelaySeconds : 4.0;
    filterComplex = `[0:v][1:v]overlay=0:0[vbase];[vbase][2:v]overlay=0:0:enable='gte(t,${secDelay})'[vout]`;
  }

  let mapArgs: string[] = ['-map', '[vout]'];
  let audioArgs: string[] = ['-c:a', 'copy'];

  if (hasSfx) {
    const delays = options!.sfxDelaysMs!;
    const sfxFilterParts: string[] = [];
    const mixInputs: string[] = ['[0:a]'];

    delays.forEach((delayMs, idx) => {
      const label = `sfx${idx + 1}`;
      sfxFilterParts.push(`[${sfxInputIdx}:a]adelay=${delayMs}|${delayMs},volume=1.8[${label}]`);
      mixInputs.push(`[${label}]`);
    });

    const amixStr = `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first:dropout_transition=2[aout]`;
    filterComplex = `${filterComplex};${sfxFilterParts.join(';')};${amixStr}`;
    mapArgs = ['-map', '[vout]', '-map', '[aout]'];
    audioArgs = ['-c:a', 'aac', '-b:a', '192k'];
  }

  if (isDarwin) {
    try {
      const bitrate = options?.bitrate || '10M';
      await runCommand('ffmpeg', [
        ...inputArgs,
        '-filter_complex', filterComplex,
        ...mapArgs,
        '-c:v', 'h264_videotoolbox',
        '-b:v', bitrate,
        '-pix_fmt', 'yuv420p',
        ...audioArgs,
        '-movflags', '+faststart',
        outputPath,
      ]);
      return;
    } catch {
      // Fallback to libx264
    }
  }

  const preset = options?.preset || 'veryfast';
  const crf = options?.crf !== undefined ? String(options.crf) : '19';

  await runCommand('ffmpeg', [
    ...inputArgs,
    '-filter_complex', filterComplex,
    ...mapArgs,
    '-c:v', 'libx264',
    '-preset', preset,
    '-crf', crf,
    '-pix_fmt', 'yuv420p',
    ...audioArgs,
    '-movflags', '+faststart',
    outputPath,
  ]);
}
/**
 * Creates a zip archive of a directory using system zip.
 */
export async function createZipArchive(
  sourceDir: string,
  zipFilePath: string,
  includedItems?: string[]
): Promise<void> {
  ensureDir(path.dirname(zipFilePath));

  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
  }

  const absSource = path.resolve(sourceDir);
  const absZip = path.resolve(zipFilePath);
  const zipFileName = path.basename(absZip);

  const itemsToZip = includedItems && includedItems.length > 0
    ? includedItems.filter((item) => fs.existsSync(path.join(absSource, item)))
    : ['captions', 'all_videos', 'manifest.json', 'README.md'].filter((item) => fs.existsSync(path.join(absSource, item)));

  if (itemsToZip.length > 0) {
    await runCommand('zip', ['-r', '-q', absZip, ...itemsToZip], absSource);
  } else {
    await runCommand('zip', ['-r', '-q', absZip, '.', '-x', `*${zipFileName}*`], absSource);
  }
}

/**
 * Generates a clean markdown report for the batch output.
 */
export function generateMarkdownReport(manifest: BatchManifest): string {
  const lines: string[] = [];

  lines.push('# TikTok Video Caption Overlays — Batch Generation Report');
  lines.push('');
  lines.push(`- **Batch ID**: \`${manifest.batchId}\``);
  lines.push(`- **Date Created**: \`${manifest.date}\``);
  lines.push(`- **Time Created**: \`${manifest.time}\` (Timestamp: \`${manifest.timestamp}\`)`);
  lines.push(`- **ISO Timestamp**: ${manifest.createdAt}`);
  lines.push(`- **Total Captions**: ${manifest.totalCaptions}`);
  lines.push(`- **Raw Video Cuts**: ${manifest.totalRawVideos}`);
  lines.push(`- **Total Rendered Videos**: ${manifest.totalVideos}`);
  lines.push(`- **Styles**: ${manifest.styles.join(', ')}`);
  lines.push(`- **Batch Directory**: \`${manifest.batchDirectory}\``);
  if (manifest.zipFile) {
    lines.push(`- **Zip Deliverable**: \`${path.basename(manifest.zipFile)}\` (${formatBytes(manifest.zipSizeBytes || 0)})`);
  }
  lines.push('');

  lines.push('## Video Naming Conventions');
  lines.push('');
  lines.push('All output videos adhere to standardized, timestamped naming conventions for automated sorting and media buying:');
  lines.push('');
  lines.push('1. **In Caption Folders (`captions/<caption_slug>/`)**:');
  lines.push('   - Format: `[YYYYMMDD]_[HHMMSS]_[RAW_VIDEO]_[STYLE]_[CAPTION_TAG].mp4`');
  lines.push(`   - Pattern: \`${manifest.namingConvention?.captionFolderPattern || '[YYYYMMDD]_[HHMMSS]_[VIDEO]_[STYLE]_[CAPTION_TAG].mp4'}\``);
  lines.push(`   - Example: \`${manifest.namingConvention?.exampleCaptionFolder || '20260831_145022_video_1_stroke_c01.mp4'}\``);
  lines.push('');
  lines.push('2. **In Flat Directory (`all_videos/`)**:');
  lines.push('   - Format: `[YYYYMMDD]_[HHMMSS]_[RAW_VIDEO]_[STYLE]_[CAPTION_TAG]_[SLUG].mp4`');
  lines.push(`   - Pattern: \`${manifest.namingConvention?.allVideosPattern || '[YYYYMMDD]_[HHMMSS]_[VIDEO]_[STYLE]_[CAPTION_TAG]_[SLUG].mp4'}\``);
  lines.push(`   - Example: \`${manifest.namingConvention?.exampleAllVideos || '20260831_145022_video_1_stroke_c01_walmart_receipt.mp4'}\``);
  lines.push('');

  lines.push('## Summary Table');
  lines.push('');
  lines.push('| # | Caption Tag | Caption Text | Style | Raw Video | File Size | Output Filename |');
  lines.push('|---|---|---|---|---|---|---|');

  let rowIdx = 1;
  for (const cap of manifest.captions) {
    const tag = `c${String(cap.index).padStart(2, '0')}`;
    for (const v of cap.videos) {
      lines.push(
        `| ${rowIdx++} | \`${tag}\` | "${cap.text.replace(/\|/g, '\\|')}" | \`${v.style}\` | \`${path.basename(v.rawVideo)}\` | ${formatBytes(v.sizeBytes)} | \`${path.basename(v.outputVideo)}\` |`
      );
    }
  }

  lines.push('');
  lines.push('## Output Directory Structure');
  lines.push('');
  lines.push('```');
  lines.push(`${path.basename(manifest.batchDirectory)}/`);
  lines.push('├── captions/');
  for (const cap of manifest.captions) {
    lines.push(`│   ├── ${cap.slug}/`);
    lines.push(`│   │   ├── caption.txt`);
    lines.push(`│   │   ├── metadata.json`);
    for (const v of cap.videos) {
      lines.push(`│   │   ├── ${path.basename(v.outputVideo)}`);
    }
  }
  lines.push('├── all_videos/');
  for (const item of manifest.allVideos) {
    lines.push(`│   ├── ${item.filename}`);
  }
  lines.push('├── manifest.json');
  lines.push('├── README.md');
  if (manifest.zipFile) {
    lines.push(`└── ${path.basename(manifest.zipFile)}`);
  }
  lines.push('```');
  lines.push('');

  lines.push('## Captions List');
  lines.push('');
  manifest.captions.forEach((cap, i) => {
    lines.push(`${i + 1}. **\`c${String(i + 1).padStart(2, '0')}\`** (\`${cap.slug}\`): "${cap.text}"`);
  });
  lines.push('');

  return lines.join('\n');
}
