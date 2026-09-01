#!/usr/bin/env bun
import * as path from 'node:path';
import { VideoEditor } from './editor';
import type { CaptionStyle, EditorOptions } from './types';
import { DEFAULT_CAPTIONS } from './types';

function printHelp(): void {
  console.log(`
🎬 TikTok Video Caption Overlay Generator CLI

Usage:
  bun run src/cli.ts [options]
  bun run start [options]

Options:
  --captions <list>        Comma-separated captions (surround with quotes)
  --captions-file, -f <p>  Path to text file (one per line) or JSON array of captions
  --videos <list>          Comma-separated list of raw video file paths
  --videos-dir, -d <path>  Directory containing raw video cuts (default: assets/raw_cuts)
  --styles <styles>        Overlay styles: 'stroke', 'card', 'snapchat', 'comment', 'ios-barrage', 'twotone' (default: all)
  --sfx <path>             Custom audio chime SFX for iOS notifications (default: authentic iPhone sound)
  --output, -o <dir>       Output directory (default: output)
  --organize-by-date       Organize batches into YYYY-MM-DD/batch_HH-MM-SS folders (default: true)
  --no-date-folder         Disable date/time folder hierarchy and render directly into output dir
  --batch-name <name>      Custom name or campaign tag for this batch
  --zip                    Create zip archive of generated output (default: true)
  --no-zip                 Disable zip archive creation
  --zip-name <filename>    Custom zip filename (default: tiktok_caption_videos.zip)
  --concurrency, -c <num>  Number of concurrent FFmpeg renders (default: 3)
  --verbose, -v            Enable verbose output
  --help, -h               Show this help message

Video Naming Convention:
  • In caption folders: [YYYYMMDD]_[HHMMSS]_[RAW_VIDEO]_[STYLE]_[CAPTION_TAG].mp4
    Example: 20260831_145022_video_1_stroke_c01.mp4
  • In flat all_videos: [YYYYMMDD]_[HHMMSS]_[RAW_VIDEO]_[STYLE]_[CAPTION_TAG]_[SLUG].mp4
    Example: 20260831_145022_video_1_stroke_c01_walmart_receipt.mp4

Examples:
  # Run standard batch with all 6 default captions and 3 raw video cuts:
  bun run src/cli.ts

  # Run custom captions with a batch name:
  bun run src/cli.ts --batch-name grocery_promo --captions "Stop scrolling 💀, Claim your card now 💸"

  # Run specific style only without date folders:
  bun run src/cli.ts --styles stroke --no-date-folder --concurrency 4

  # Use custom videos directory and output path:
  bun run src/cli.ts -d ./my_cuts -o ./dist
`);
}

export function parseArgs(args: string[]): EditorOptions & { showHelp?: boolean } {
  const options: EditorOptions & { showHelp?: boolean } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.showHelp = true;
      return options;
    }

    if (arg === '--captions') {
      const val = args[++i];
      if (val) {
        if (val.trim().startsWith('[') && val.trim().endsWith(']')) {
          try {
            options.captions = JSON.parse(val);
          } catch {
            options.captions = val.split(',').map((s) => s.trim()).filter(Boolean);
          }
        } else {
          options.captions = val.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }
    } else if (arg === '--captions-file' || arg === '-f') {
      options.captionsFile = args[++i];
    } else if (arg === '--videos') {
      const val = args[++i];
      if (val) {
        options.videos = val.split(',').map((s) => s.trim()).filter(Boolean);
      }
    } else if (arg === '--videos-dir' || arg === '-d') {
      options.videosDir = args[++i];
    } else if (arg === '--styles') {
      const val = args[++i];
      if (val) {
        const validStyles: CaptionStyle[] = ['stroke', 'card', 'snapchat', 'comment', 'ios-barrage', 'twotone'];
        const parsed = val.split(',').map((s) => s.trim().toLowerCase().replace(/^barrage$/, 'ios-barrage')) as CaptionStyle[];
        options.styles = parsed.filter((s) => validStyles.includes(s));
      }
    } else if (arg === '--sfx') {
      options.sfxPath = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.outputDir = args[++i];
    } else if (arg === '--organize-by-date') {
      options.organizeByDate = true;
    } else if (arg === '--no-date-folder' || arg === '--no-date') {
      options.organizeByDate = false;
    } else if (arg === '--batch-name' || arg === '-b') {
      options.batchName = args[++i];
    } else if (arg === '--zip') {
      options.zip = true;
    } else if (arg === '--no-zip') {
      options.zip = false;
    } else if (arg === '--zip-name') {
      options.zipName = args[++i];
    } else if (arg === '--concurrency' || arg === '-c') {
      const num = parseInt(args[++i], 10);
      if (!isNaN(num) && num > 0) {
        options.concurrency = num;
      }
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    }
  }

  return options;
}

async function run(): Promise<void> {
  const rawArgs = process.argv.slice(2);
  const parsed = parseArgs(rawArgs);

  if (parsed.showHelp) {
    printHelp();
    process.exit(0);
  }

  try {
    const editor = new VideoEditor(parsed);
    await editor.renderBatch();
  } catch (error) {
    console.error('\n❌ Batch Execution Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (import.meta.main || process.argv[1]?.endsWith('cli.ts')) {
  run();
}
