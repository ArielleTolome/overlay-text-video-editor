import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

export type ColorGradePreset =
  | 'subtle'
  | 'neutral_punch'
  | 'warm_cinematic'
  | 'vibrant_pop'
  | 'moody'
  | 'retro_glow'
  | 'auto'
  | 'none';

export const COLOR_GRADE_PRESETS: Record<string, string> = {
  subtle: 'eq=contrast=1.04:saturation=1.02',
  neutral_punch: "eq=contrast=1.08:brightness=0.01:saturation=1.05,curves=master='0/0 0.25/0.23 0.75/0.78 1/1'",
  warm_cinematic: "eq=contrast=1.12:brightness=-0.02:saturation=0.92,colorbalance=rs=0.03:bs=-0.03:rm=0.04:bm=-0.02:rh=0.06:bh=-0.04,curves=master='0/0 0.25/0.22 0.75/0.78 1/1'",
  vibrant_pop: 'eq=contrast=1.10:brightness=0.02:saturation=1.18,colorbalance=gh=0.02:bh=0.04',
  moody: "eq=contrast=1.15:brightness=-0.04:saturation=0.85,curves=master='0/0.02 0.3/0.22 0.7/0.75 1/0.95'",
  retro_glow: 'eq=contrast=1.06:saturation=0.90,colorbalance=rs=0.04:gs=0.01:bs=-0.02:rh=0.05:gh=0.03:bh=-0.03',
  none: '',
};

function runFFmpeg(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const { promise, resolve, reject } = Promise.withResolvers<{ stdout: string; stderr: string }>();
  const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  proc.stdout.on('data', (d) => { stdout += d.toString(); });
  proc.stderr.on('data', (d) => { stderr += d.toString(); });
  proc.on('close', (code) => {
    if (code === 0) resolve({ stdout, stderr });
    else reject(new Error(`ffmpeg color grade failed (${code}): ${stderr.slice(-500)}`));
  });
  return promise;
}

/**
 * Resolves the FFmpeg filter chain for a given color grade preset name.
 */
export function getColorGradeFilter(presetName: string): string {
  const key = presetName.toLowerCase().trim();
  if (key in COLOR_GRADE_PRESETS) {
    return COLOR_GRADE_PRESETS[key] || '';
  }
  return COLOR_GRADE_PRESETS['neutral_punch']!;
}

/**
 * Analyzes video frames with signalstats and derives bounded automatic color grading adjustments.
 */
export async function analyzeAndComputeAutoGrade(
  videoPath: string,
  start: number = 0,
  duration: number = 5.0
): Promise<string> {
  const { promise, resolve } = Promise.withResolvers<string>();

  // Probe duration if needed
  const fps = 2; // sample 2 frames per second
  const proc = spawn('ffmpeg', [
    '-y',
    '-hide_banner',
    '-nostats',
    '-ss', start.toFixed(2),
    '-i', videoPath,
    '-t', duration.toFixed(2),
    '-vf', `fps=${fps},signalstats,metadata=print:file=-`,
    '-f', 'null',
    '-'
  ]);

  let stdout = '';
  proc.stdout.on('data', (d) => { stdout += d.toString(); });
  proc.on('close', (code) => {
    if (code !== 0) {
      return resolve(COLOR_GRADE_PRESETS['neutral_punch']!);
    }

    const yAvgs: number[] = [];
    const satAvgs: number[] = [];

    for (const line of stdout.split('\n')) {
      if (line.includes('lavfi.signalstats.YAVG=')) {
        const val = parseFloat(line.split('lavfi.signalstats.YAVG=')[1] || '');
        if (!isNaN(val)) yAvgs.push(val / 255);
      } else if (line.includes('lavfi.signalstats.SATAVG=')) {
        const val = parseFloat(line.split('lavfi.signalstats.SATAVG=')[1] || '');
        if (!isNaN(val)) satAvgs.push(val / 255);
      }
    }

    if (yAvgs.length === 0) {
      return resolve(COLOR_GRADE_PRESETS['neutral_punch']!);
    }

    const meanY = yAvgs.reduce((a, b) => a + b, 0) / yAvgs.length;
    const meanSat = satAvgs.length > 0 ? (satAvgs.reduce((a, b) => a + b, 0) / satAvgs.length) : 0.4;

    // Target ideal luma: ~0.48, ideal saturation: ~0.35
    let brightnessAdj = (0.48 - meanY) * 0.25;
    brightnessAdj = Math.max(-0.06, Math.min(0.06, brightnessAdj));

    let contrastAdj = meanY < 0.4 ? 1.08 : (meanY > 0.6 ? 1.04 : 1.06);
    let satAdj = meanSat < 0.3 ? 1.12 : (meanSat > 0.5 ? 0.95 : 1.04);

    const filter = `eq=contrast=${contrastAdj.toFixed(2)}:brightness=${brightnessAdj.toFixed(2)}:saturation=${satAdj.toFixed(2)}`;
    resolve(filter);
  });

  return promise;
}

/**
 * Applies color grading to a video file.
 */
export async function applyColorGrade(options: {
  inputVideo: string;
  presetOrFilter: string;
  outputVideo: string;
}): Promise<string> {
  const { inputVideo, presetOrFilter, outputVideo } = options;

  let filter = '';
  if (presetOrFilter.toLowerCase() === 'auto') {
    filter = await analyzeAndComputeAutoGrade(inputVideo);
  } else if (presetOrFilter.includes('=')) {
    filter = presetOrFilter;
  } else {
    filter = getColorGradeFilter(presetOrFilter);
  }

  if (!filter) {
    // No-op copy
    fs.copyFileSync(inputVideo, outputVideo);
    return outputVideo;
  }

  const outDir = path.dirname(outputVideo);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const isDarwin = process.platform === 'darwin';
  const vCodec = isDarwin ? 'h264_videotoolbox' : 'libx264';

  try {
    await runFFmpeg([
      '-y',
      '-i', inputVideo,
      '-vf', filter,
      '-c:v', vCodec,
      '-b:v', '8M',
      '-c:a', 'copy',
      '-movflags', '+faststart',
      outputVideo,
    ]);
  } catch {
    await runFFmpeg([
      '-y',
      '-i', inputVideo,
      '-vf', filter,
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '20',
      '-c:a', 'copy',
      '-movflags', '+faststart',
      outputVideo,
    ]);
  }

  return outputVideo;
}
