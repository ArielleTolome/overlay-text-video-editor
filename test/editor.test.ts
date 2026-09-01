import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseArgs } from '../src/cli';
import { VideoEditor, batchRender } from '../src/editor';
import { OverlayRenderer } from '../src/renderer';
import { DEFAULT_CAPTIONS } from '../src/types';
import {
  buildStandardVideoNames,
  formatBytes,
  formatDuration,
  getShortCaptionSlug,
  getTimestampInfo,
  slugify,
} from '../src/utils';

describe('TikTok Video Editor Engine', () => {
  describe('Utils, Timestamps & Naming Conventions', () => {
    it('should create safe slugs stripping emojis and special characters', () => {
      const text = "lowkey thought this $1400 subsidy card was fake until my Walmart receipt literally said $0.00 😭💀";
      const slug = slugify(text, 0);
      expect(slug).toBe('caption_01_lowkey_thought_this_1400_subsidy_card_was_fake_unt');
      expect(slug).not.toContain('😭');
      expect(slug).not.toContain('$');
    });

    it('should extract short caption slugs and build standard video names', () => {
      const text = "lowkey thought this $1400 subsidy card was fake until my Walmart receipt literally said $0.00 😭💀";
      const shortSlug = getShortCaptionSlug(text);
      expect(shortSlug).toBe('lowkey_thought_this_1400');

      const names = buildStandardVideoNames({
        stamp: '20260831_145022',
        rawVideoName: 'video_1',
        style: 'stroke',
        captionIndex: 0,
        captionText: text,
      });

      expect(names.captionFolderFileName).toBe('20260831_145022_video_1_stroke_c01.mp4');
      expect(names.allVideosFileName).toBe('20260831_145022_video_1_stroke_c01_lowkey_thought_this_1400.mp4');
      expect(names.captionTag).toBe('c01');
    });

    it('should format timestamps deterministically', () => {
      const fixedDate = new Date(2026, 7, 31, 14, 55, 30); // Aug 31, 2026 14:55:30
      const info = getTimestampInfo(fixedDate);
      expect(info.date).toBe('2026-08-31');
      expect(info.time).toBe('14:55:30');
      expect(info.compactDate).toBe('20260831');
      expect(info.compactTime).toBe('145530');
      expect(info.stamp).toBe('20260831_145530');
    });

    it('should format bytes and durations properly', () => {
      expect(formatDuration(75)).toBe('1:15');
      expect(formatDuration(0)).toBe('0:00');
      expect(formatBytes(1024 * 1024 * 15)).toBe('15.00 MB');
    });
  });

  describe('CLI Argument Parsing', () => {
    it('should parse styles and custom options correctly', () => {
      const parsed = parseArgs(['--styles', 'stroke,snapchat,comment', '--concurrency', '4', '--no-zip', '--batch-name', 'summer_campaign']);
      expect(parsed.styles).toEqual(['stroke', 'snapchat', 'comment']);
      expect(parsed.concurrency).toBe(4);
      expect(parsed.zip).toBe(false);
      expect(parsed.batchName).toBe('summer_campaign');
    });
    it('should parse date organization flags', () => {
      const parsed1 = parseArgs(['--no-date-folder']);
      expect(parsed1.organizeByDate).toBe(false);
      const parsed2 = parseArgs(['--organize-by-date']);
      expect(parsed2.organizeByDate).toBe(true);
    });

    it('should parse custom comma-separated captions', () => {
      const parsed = parseArgs(['--captions', 'Caption 1 😭, Caption 2 💸']);
      expect(parsed.captions).toEqual(['Caption 1 😭', 'Caption 2 💸']);
    });
  });

  describe('Overlay Rendering Engine', () => {
    it('should render transparent 1080x1920 overlay PNGs for all 13 styles', async () => {
      const renderer = new OverlayRenderer();
      await renderer.init();

      const testDir = path.resolve(process.cwd(), 'output/test_unit');
      const strokePng = path.join(testDir, 'unit_stroke.png');
      const cardPng = path.join(testDir, 'unit_card.png');
      const snapchatPng = path.join(testDir, 'unit_snapchat.png');
      const commentPng = path.join(testDir, 'unit_comment.png');
      const barragePng = path.join(testDir, 'unit_barrage.png');
      const twotonePng = path.join(testDir, 'unit_twotone.png');
      const blackContourPng = path.join(testDir, 'unit_black_contour.png');
      const bwStackedPng = path.join(testDir, 'unit_bw_stacked.png');
      const minimalVlogPng = path.join(testDir, 'unit_minimal_vlog.png');
      const typewriterPng = path.join(testDir, 'unit_typewriter.png');
      const neonPng = path.join(testDir, 'unit_neon.png');
      const bouncePng = path.join(testDir, 'unit_bounce.png');
      const redboxPng = path.join(testDir, 'unit_redbox.png');

      await renderer.renderOverlay(DEFAULT_CAPTIONS[0], 'stroke', strokePng);
      await renderer.renderOverlay(DEFAULT_CAPTIONS[1], 'card', cardPng);
      await renderer.renderOverlay(DEFAULT_CAPTIONS[2], 'snapchat', snapchatPng);
      await renderer.renderOverlay(DEFAULT_CAPTIONS[3], 'comment', commentPng);
      await renderer.renderOverlay(DEFAULT_CAPTIONS[4], 'ios-barrage', barragePng);
      await renderer.renderOverlay(DEFAULT_CAPTIONS[5], 'twotone', twotonePng);
      await renderer.renderOverlay(DEFAULT_CAPTIONS[0], 'black-contour', blackContourPng);
      await renderer.renderOverlay(DEFAULT_CAPTIONS[1], 'bw-stacked', bwStackedPng);
      await renderer.renderOverlay(DEFAULT_CAPTIONS[2], 'minimal-vlog', minimalVlogPng);
      await renderer.renderOverlay(DEFAULT_CAPTIONS[3], 'typewriter', typewriterPng);
      await renderer.renderOverlay(DEFAULT_CAPTIONS[4], 'neon', neonPng);
      await renderer.renderOverlay(DEFAULT_CAPTIONS[5], 'capcut-bounce', bouncePng);
      await renderer.renderOverlay(DEFAULT_CAPTIONS[0], 'capcut-redbox', redboxPng);

      expect(fs.existsSync(strokePng)).toBe(true);
      expect(fs.existsSync(cardPng)).toBe(true);
      expect(fs.existsSync(snapchatPng)).toBe(true);
      expect(fs.existsSync(commentPng)).toBe(true);
      expect(fs.existsSync(barragePng)).toBe(true);
      expect(fs.existsSync(twotonePng)).toBe(true);
      expect(fs.existsSync(blackContourPng)).toBe(true);
      expect(fs.existsSync(bwStackedPng)).toBe(true);
      expect(fs.existsSync(minimalVlogPng)).toBe(true);
      expect(fs.existsSync(typewriterPng)).toBe(true);
      expect(fs.existsSync(neonPng)).toBe(true);
      expect(fs.existsSync(bouncePng)).toBe(true);
      expect(fs.existsSync(redboxPng)).toBe(true);

      expect(fs.statSync(strokePng).size).toBeGreaterThan(1000);
      expect(fs.statSync(cardPng).size).toBeGreaterThan(1000);
      expect(fs.statSync(snapchatPng).size).toBeGreaterThan(1000);
      expect(fs.statSync(commentPng).size).toBeGreaterThan(1000);
      expect(fs.statSync(barragePng).size).toBeGreaterThan(1000);
      expect(fs.statSync(twotonePng).size).toBeGreaterThan(1000);
      expect(fs.statSync(blackContourPng).size).toBeGreaterThan(1000);
      expect(fs.statSync(bwStackedPng).size).toBeGreaterThan(1000);
      expect(fs.statSync(minimalVlogPng).size).toBeGreaterThan(1000);
      expect(fs.statSync(typewriterPng).size).toBeGreaterThan(1000);
      expect(fs.statSync(neonPng).size).toBeGreaterThan(1000);
      expect(fs.statSync(bouncePng).size).toBeGreaterThan(1000);
      expect(fs.statSync(redboxPng).size).toBeGreaterThan(1000);

      await renderer.close();
    }, 30000);
  });

  describe('Batch Video Editing Pipeline', () => {
    it('should execute batch rendering across sample captions and video cuts with timestamps and naming conventions', async () => {
      const testOutputDir = path.resolve(process.cwd(), 'output/test_batch');
      if (fs.existsSync(testOutputDir)) {
        fs.rmSync(testOutputDir, { recursive: true, force: true });
      }

      const sampleCaptions = [DEFAULT_CAPTIONS[0]];
      const sampleVideos = [path.resolve(process.cwd(), 'assets/raw_cuts/video_1.mp4')];

      const editor = new VideoEditor({
        captions: sampleCaptions,
        videos: sampleVideos,
        styles: ['stroke', 'card', 'black-contour', 'twotone', 'bw-stacked', 'minimal-vlog', 'typewriter', 'neon', 'capcut-bounce', 'capcut-redbox', 'snapchat', 'comment', 'ios-barrage'],
        outputDir: testOutputDir,
        organizeByDate: false, // test direct output mode
        zip: true,
        zipName: 'test_bundle.zip',
        concurrency: 2,
      });

      const manifest = await editor.renderBatch();

      expect(manifest.totalCaptions).toBe(1);
      expect(manifest.totalVideos).toBe(13);
      expect(manifest.zipFile).toBeDefined();
      expect(manifest.timestamp).toBeDefined();

      const captionSlug = slugify(sampleCaptions[0], 0);
      const captionFolder = path.join(testOutputDir, 'captions', captionSlug);

      expect(fs.existsSync(path.join(captionFolder, 'caption.txt'))).toBe(true);
      expect(fs.existsSync(path.join(captionFolder, 'metadata.json'))).toBe(true);
      expect(fs.existsSync(path.join(testOutputDir, 'manifest.json'))).toBe(true);
      expect(fs.existsSync(path.join(testOutputDir, 'README.md'))).toBe(true);
      const filesInCaptionDir = fs.readdirSync(captionFolder);
      const strokeVideo = filesInCaptionDir.find((f) => f.includes('stroke') && f.endsWith('.mp4'));
      const cardVideo = filesInCaptionDir.find((f) => f.includes('card') && f.endsWith('.mp4'));
      const snapchatVideo = filesInCaptionDir.find((f) => f.includes('snapchat') && f.endsWith('.mp4'));
      const commentVideo = filesInCaptionDir.find((f) => f.includes('comment') && f.endsWith('.mp4'));
      const barrageVideo = filesInCaptionDir.find((f) => f.includes('ios-barrage') && f.endsWith('.mp4'));
      const twotoneVideo = filesInCaptionDir.find((f) => f.includes('twotone') && f.endsWith('.mp4'));

      expect(strokeVideo).toBeDefined();
      expect(cardVideo).toBeDefined();
      expect(snapchatVideo).toBeDefined();
      expect(commentVideo).toBeDefined();
      expect(barrageVideo).toBeDefined();
      expect(twotoneVideo).toBeDefined();
      expect(strokeVideo).toMatch(/^\d{8}_\d{6}_video_1_stroke_c01\.mp4$/);
      expect(cardVideo).toMatch(/^\d{8}_\d{6}_video_1_card_c01\.mp4$/);
      expect(snapchatVideo).toMatch(/^\d{8}_\d{6}_video_1_snapchat_c01\.mp4$/);
      expect(commentVideo).toMatch(/^\d{8}_\d{6}_video_1_comment_c01\.mp4$/);
      expect(barrageVideo).toMatch(/^\d{8}_\d{6}_video_1_ios-barrage_c01\.mp4$/);
      expect(twotoneVideo).toMatch(/^\d{8}_\d{6}_video_1_twotone_c01\.mp4$/);

      // Verify metadata.json contents
      const metadata = JSON.parse(fs.readFileSync(path.join(captionFolder, 'metadata.json'), 'utf8'));
      expect(metadata.captionText).toBe(sampleCaptions[0]);
      expect(metadata.videos.length).toBe(13);
      expect(metadata.batchId).toBeDefined();
      expect(metadata.namingConvention).toBeDefined();
    }, 60000);
  });
});
