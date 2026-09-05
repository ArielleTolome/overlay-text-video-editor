import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CLIProxyClient, FishAudioClient } from '../src/ai';
import { mixAudioWithDucking, prepareMusicBed } from '../src/audio';
import { listAvailableReactionHooks, UGCStitcher } from '../src/stitcher';
import { getVideoMetadata } from '../src/utils';

describe('UGC Video Stitcher & AI Pipeline', () => {
  const testOutputDir = path.resolve(process.cwd(), 'output/test_stitcher');

  if (!fs.existsSync(testOutputDir)) {
    fs.mkdirSync(testOutputDir, { recursive: true });
  }

  describe('Local Reaction Hooks Inventory', () => {
    it('should list all available reaction hooks with extracted emotions', () => {
      const hooks = listAvailableReactionHooks();
      expect(hooks.length).toBeGreaterThanOrEqual(10);

      const emotions = hooks.map((h) => h.emotion);
      expect(emotions).toContain('jaw-drop');
      expect(emotions).toContain('belly-laugh');
      expect(emotions).toContain('hyped');

      for (const hook of hooks) {
        expect(fs.existsSync(hook.path)).toBe(true);
        expect(hook.name.endsWith('.mp4')).toBe(true);
      }
    });
  });

  describe('AI Client (CLIProxyAPI / Gemini & Fish Audio)', () => {
    it('should generate 3-block UGC scripts with hook, demo, and CTA', async () => {
      const ai = new CLIProxyClient();
      const script = await ai.generateUGCScript({
        appName: 'FocusPal',
        niche: 'productivity',
        hookEmotion: 'shocked',
      });

      expect(script.appName).toBe('FocusPal');
      expect(script.hookText.length).toBeGreaterThan(10);
      expect(script.demoVoiceover.length).toBeGreaterThan(15);
      expect(script.ctaText.length).toBeGreaterThan(5);
      expect(Array.isArray(script.emphasisWords)).toBe(true);
    });

    it('should produce structured virality scorecards', async () => {
      const ai = new CLIProxyClient();
      const report = await ai.scoreVirality({
        title: 'test_reel.mp4',
        duration: 12.5,
        hookText: 'POV: You found the secret grocery hack 💸',
      });

      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(report.hookStrength).toBeGreaterThan(0);
      expect(report.textReadability).toBeGreaterThan(0);
      expect(report.topStrength.length).toBeGreaterThan(5);
    });

    it('should generate speech or fallback and fit duration with atempo', async () => {
      const tts = new FishAudioClient();
      const testMp3 = path.join(testOutputDir, 'test_vo_raw.mp3');
      const fitMp3 = path.join(testOutputDir, 'test_vo_fit.mp3');

      await tts.generateSpeech('Testing the video editor voiceover.', testMp3);
      expect(fs.existsSync(testMp3)).toBe(true);

      const tempo = await tts.fitDuration(testMp3, 4.0, fitMp3);
      expect(fs.existsSync(fitMp3)).toBe(true);
      expect(tempo).toBeGreaterThan(0);
    });
  });

  describe('Audio Ducking & Music Bed', () => {
    it('should prepare a normalized looping music bed at -16 LUFS', async () => {
      const sampleAudioSource = path.resolve(process.cwd(), 'assets/sfx/iphone_notification_clean.wav');
      const musicBed = path.join(testOutputDir, 'test_music_bed.mp3');

      const out = await prepareMusicBed(sampleAudioSource, 5.0, musicBed);
      expect(fs.existsSync(out)).toBe(true);

      const stat = fs.statSync(out);
      expect(stat.size).toBeGreaterThan(1000);
    });

    it('should mix video with voiceover and ducked background audio', async () => {
      const baseVideo = path.resolve(process.cwd(), 'assets/raw_cuts/video_1.mp4');
      const voPath = path.resolve(process.cwd(), 'assets/sfx/iphone_notification_clean.wav');
      const musicPath = path.resolve(process.cwd(), 'assets/sfx/iphone_notification_clean.wav');
      const mixedOutput = path.join(testOutputDir, 'test_mixed_audio.mp4');

      await mixAudioWithDucking({
        videoPath: baseVideo,
        voiceoverPath: voPath,
        musicPath: musicPath,
        musicVolume: 0.15,
        targetDuration: 4.0,
        outputPath: mixedOutput,
      });

      expect(fs.existsSync(mixedOutput)).toBe(true);
      const meta = await getVideoMetadata(mixedOutput);
      expect(meta.duration).toBeGreaterThan(0);
    });
  });

  describe('Full Multi-Clip UGC Stitcher Pipeline', () => {
    it('should stitch reaction hook + demo clip + CTA text into 1080x1920 30fps video', async () => {
      const stitcher = new UGCStitcher();
      const hooks = listAvailableReactionHooks();
      const hookClip = hooks[0]?.path ?? path.resolve(process.cwd(), 'assets/raw_cuts/video_1.mp4');
      const demoClip = path.resolve(process.cwd(), 'assets/raw_cuts/video_1.mp4');
      const finalVideo = path.join(testOutputDir, 'stitched_test_final.mp4');

      const result = await stitcher.stitch({
        hookClip,
        demoClips: [demoClip],
        hookDuration: 2.0,
        demoDuration: 3.0,
        outputVideo: finalVideo,
        textOverlays: [
          {
            text: 'When you find the hidden app 😭💀',
            start: 0,
            end: 2.0,
            placement: 'top',
          },
          {
            text: 'Get it on App Store 👇',
            start: 2.0,
            end: 5.0,
            placement: 'bottom',
          },
        ],
        ttsText: 'Check out this app right now.',
      });

      expect(fs.existsSync(result.outputPath)).toBe(true);
      expect(result.totalDuration).toBeGreaterThan(4.0);

      const meta = await getVideoMetadata(result.outputPath);
      expect(meta.width).toBe(1080);
      expect(meta.height).toBe(1920);
      expect(meta.fps).toBe(30);
    }, 45000);
  });
});
