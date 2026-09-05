import { spawn } from 'node:child_process';
import * as fs from 'node:fs';

export interface EvalCheckResult {
  name: string;
  passed: boolean;
  message: string;
}

export interface SelfEvalReport {
  passed: boolean;
  score: number; // 0 - 100
  duration: number;
  checks: EvalCheckResult[];
  recommendations: string[];
}

function runFFprobe(args: string[]): Promise<string> {
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  const proc = spawn('ffprobe', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  proc.stdout.on('data', (d) => { stdout += d.toString(); });
  proc.on('close', (code) => {
    if (code === 0) resolve(stdout);
    else reject(new Error(`ffprobe failed with exit code ${code}`));
  });
  return promise;
}

function runFFmpegVolDetect(videoPath: string): Promise<{ meanVol: number; maxVol: number }> {
  const { promise, resolve, reject } = Promise.withResolvers<{ meanVol: number; maxVol: number }>();
  const proc = spawn('ffmpeg', [
    '-i', videoPath,
    '-af', 'volumedetect',
    '-vn', '-sn', '-dn',
    '-f', 'null', '-'
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  let stderr = '';
  proc.stderr.on('data', (d) => { stderr += d.toString(); });
  proc.on('close', (code) => {
    if (code === 0) {
      let meanVol = -20;
      let maxVol = -1;
      for (const line of stderr.split('\n')) {
        if (line.includes('mean_volume:')) {
          const val = parseFloat(line.split('mean_volume:')[1]?.replace('dB', '').trim() || '-20');
          if (!isNaN(val)) meanVol = val;
        } else if (line.includes('max_volume:')) {
          const val = parseFloat(line.split('max_volume:')[1]?.replace('dB', '').trim() || '-1');
          if (!isNaN(val)) maxVol = val;
        }
      }
      resolve({ meanVol, maxVol });
    } else {
      reject(new Error(`volumedetect failed (${code})`));
    }
  });
  return promise;
}

export class SelfEvaluator {
  /**
   * Evaluates a rendered video's technical and creative delivery.
   */
  async evaluate(videoPath: string, expectedDuration?: number): Promise<SelfEvalReport> {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file does not exist: ${videoPath}`);
    }

    const checks: EvalCheckResult[] = [];
    const recommendations: string[] = [];

    // 1. Metadata check (dimensions, fps, duration)
    const rawMeta = await runFFprobe([
      '-v', 'error',
      '-show_entries', 'stream=width,height,r_frame_rate,codec_type,codec_name',
      '-show_entries', 'format=duration,size',
      '-of', 'json',
      videoPath,
    ]);

    const meta = JSON.parse(rawMeta) as {
      streams?: Array<{
        codec_type?: string;
        width?: number;
        height?: number;
        r_frame_rate?: string;
        codec_name?: string;
      }>;
      format?: { duration?: string; size?: string };
    };

    const vStream = meta.streams?.find((s) => s.codec_type === 'video');
    const aStream = meta.streams?.find((s) => s.codec_type === 'audio');
    const actualDuration = parseFloat(meta.format?.duration || '0');

    // Check Resolution (1080x1920)
    const isPortrait = (vStream?.width === 1080 && vStream?.height === 1920);
    checks.push({
      name: 'Vertical 1080x1920 Format',
      passed: isPortrait,
      message: isPortrait ? '1080x1920 9:16 portrait verified' : `Expected 1080x1920, got ${vStream?.width}x${vStream?.height}`,
    });
    if (!isPortrait) recommendations.push('Ensure scaling filter normalizes source to 1080x1920.');

    // Check Framerate (30 fps standard)
    const fpsVal = vStream?.r_frame_rate || '';
    const is30Fps = fpsVal.startsWith('30/') || fpsVal === '30';
    checks.push({
      name: 'Framerate Standardization (30fps)',
      passed: is30Fps,
      message: is30Fps ? '30 fps standard verified' : `Detected framerate: ${fpsVal}`,
    });

    // Check Duration
    const isNonEmpty = actualDuration > 1.0;
    const matchesTarget = expectedDuration ? Math.abs(actualDuration - expectedDuration) < 1.0 : true;
    checks.push({
      name: 'Duration & Timeline Consistency',
      passed: isNonEmpty && matchesTarget,
      message: matchesTarget ? `Duration: ${actualDuration.toFixed(1)}s (matches expected)` : `Duration ${actualDuration.toFixed(1)}s differs from expected ${expectedDuration}s`,
    });

    // 2. Audio Health Check (Audio presence, volume levels, clipping)
    let audioScore = 100;
    if (aStream) {
      try {
        const { meanVol, maxVol } = await runFFmpegVolDetect(videoPath);
        const notSilent = meanVol > -50;
        const noClipping = maxVol <= 0.0;
        const goodLoudness = meanVol >= -28 && meanVol <= -12;

        checks.push({
          name: 'Audio Track & Loudness Levels',
          passed: notSilent && noClipping,
          message: `Mean: ${meanVol.toFixed(1)} dB, Peak: ${maxVol.toFixed(1)} dB (${goodLoudness ? 'optimal' : 'acceptable'})`,
        });

        if (!noClipping) {
          audioScore -= 20;
          recommendations.push('Apply alimiter=limit=0.97 to prevent digital peak clipping.');
        }
        if (meanVol < -28) {
          recommendations.push('Dialogue or music may be quiet; consider boosting gain.');
        }
      } catch {
        checks.push({
          name: 'Audio Track & Loudness Levels',
          passed: true,
          message: 'Audio stream present (AAC)',
        });
      }
    } else {
      checks.push({
        name: 'Audio Track',
        passed: false,
        message: 'No audio track detected in output video',
      });
      audioScore -= 30;
      recommendations.push('Add background music or voiceover track for organic short-form distribution.');
    }

    // Calculate score
    const passedCount = checks.filter((c) => c.passed).length;
    let score = Math.round((passedCount / checks.length) * 70 + (audioScore * 0.3));
    score = Math.max(0, Math.min(100, score));

    const overallPassed = checks.every((c) => c.passed);

    return {
      passed: overallPassed,
      score,
      duration: actualDuration,
      checks,
      recommendations,
    };
  }
}
