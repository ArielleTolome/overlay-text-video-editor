import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { applyZoomPunch, generateHighlightRingSvg } from '../src/animation';
import { getReactionHookForEmotion, REACTION_HOOK_PRESETS } from '../src/types';
import { SessionMemory } from '../src/session';
import { analyzeAndComputeAutoGrade, COLOR_GRADE_PRESETS, getColorGradeFilter } from '../src/grade';
import { SelfEvaluator } from '../src/evaluator';

describe('Video-Use Inspired Advanced Features', () => {
  const testDir = path.resolve(process.cwd(), 'output/test_features');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

  const sampleVideo = path.resolve(process.cwd(), 'assets/raw_cuts/video_1.mp4');

  describe('1. Auto Color Grades & Presets', () => {
    it('should have all standard color grade presets available', () => {
      expect(COLOR_GRADE_PRESETS['warm_cinematic']).toBeDefined();
      expect(COLOR_GRADE_PRESETS['neutral_punch']).toBeDefined();
      expect(COLOR_GRADE_PRESETS['vibrant_pop']).toBeDefined();
      expect(COLOR_GRADE_PRESETS['moody']).toBeDefined();
      expect(COLOR_GRADE_PRESETS['subtle']).toBeDefined();

      const filter = getColorGradeFilter('warm_cinematic');
      expect(filter).toContain('colorbalance');
    });

    it('should analyze video frames and compute bounded auto-grade filter', async () => {
      const autoFilter = await analyzeAndComputeAutoGrade(sampleVideo, 0, 3.0);
      expect(autoFilter).toContain('eq=contrast=');
      expect(autoFilter).toContain('saturation=');
    });
  });

  describe('2. Animation Overlays (Zoom Punch & Highlight Ring)', () => {
    it('should generate valid SVG highlight rings with specified coordinates', () => {
      const svg = generateHighlightRingSvg({
        x: 540,
        y: 960,
        radius: 80,
        color: '#ff0055',
        label: 'HOT',
      });

      expect(svg).toContain('<svg');
      expect(svg).toContain('cx="540"');
      expect(svg).toContain('cy="960"');
      expect(svg).toContain('stroke="#ff0055"');
      expect(svg).toContain('HOT');
    });

    it('should apply dynamic zoom-punch without errors', async () => {
      const out = path.join(testDir, 'test_zoom.mp4');
      await applyZoomPunch(sampleVideo, out, {
        startTime: 0.5,
        duration: 0.5,
        zoomFactor: 1.06,
      });

      expect(fs.existsSync(out)).toBe(true);
      const stat = fs.statSync(out);
      expect(stat.size).toBeGreaterThan(10000);
    });
  });

  describe('3. Persistent Session Memory', () => {
    it('should record runs and persist markdown log', () => {
      const session = new SessionMemory(testDir);
      session.updatePreferences({
        defaultColorGrade: 'vibrant_pop',
        defaultMusicVolume: 0.25,
      });

      expect(session.getPreferences().defaultColorGrade).toBe('vibrant_pop');

      const record = session.recordRun({
        outputVideo: path.join(testDir, 'test_run.mp4'),
        duration: 8.5,
        hookEmotion: 'jaw-drop',
        colorGrade: 'vibrant_pop',
        evalPassed: true,
      });

      expect(record.id.startsWith('run_')).toBe(true);
      expect(session.getRuns().length).toBeGreaterThan(0);

      const md = session.exportMarkdown();
      expect(md).toContain('Project Session Memory & Learning Log');
      expect(md).toContain('jaw-drop');
      expect(md).toContain('vibrant_pop');
    });
  });

  describe('4. Automated Self-Evaluation Engine', () => {
    it('should evaluate video resolution, framerate, audio loudness and timeline', async () => {
      const evaluator = new SelfEvaluator();
      const report = await evaluator.evaluate(sampleVideo, 12.0);

      expect(report.score).toBeGreaterThan(50);
      expect(report.checks.length).toBeGreaterThanOrEqual(3);

      const resCheck = report.checks.find((c) => c.name.includes('1080x1920'));
      expect(resCheck).toBeDefined();
      expect(resCheck?.passed).toBe(true);

      const fpsCheck = report.checks.find((c) => c.name.includes('30fps'));
      expect(fpsCheck).toBeDefined();
      expect(fpsCheck?.passed).toBe(true);
    });
  });

  describe('5. Authentic Reaction Hook Presets', () => {
    it('should provide authentic reaction overlays tailored to specific emotions', () => {
      const emotions = ['jaw-drop', 'shook', 'belly-laugh', 'hyped', 'mind-blown', 'obsessed', 'emotional'];
      for (const emotion of emotions) {
        const hook = getReactionHookForEmotion(emotion);
        expect(hook).toBeDefined();
        expect(hook.length).toBeGreaterThan(10);
        expect(REACTION_HOOK_PRESETS[emotion]?.length).toBeGreaterThanOrEqual(3);
      }

      expect(getReactionHookForEmotion('jaw-drop')).toContain('honest reaction');
      expect(getReactionHookForEmotion('hyped')).toContain('gatekeeping');
      expect(getReactionHookForEmotion('shook')).toContain('POV:');
    });
  });
});
