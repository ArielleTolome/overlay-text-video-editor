import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

function runFFmpeg(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const { promise, resolve, reject } = Promise.withResolvers<{ stdout: string; stderr: string }>();
  const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  proc.stdout.on('data', (d) => { stdout += d.toString(); });
  proc.stderr.on('data', (d) => { stderr += d.toString(); });
  proc.on('close', (code) => {
    if (code === 0) resolve({ stdout, stderr });
    else reject(new Error(`ffmpeg animation failed (${code}): ${stderr.slice(-500)}`));
  });
  return promise;
}

export interface ZoomPunchOptions {
  startTime: number; // in seconds
  duration?: number; // default 0.6s
  zoomFactor?: number; // default 1.08 (8% zoom punch)
}

export interface HighlightRingOptions {
  x: number; // 0 to 1080
  y: number; // 0 to 1920
  radius?: number; // default 60px
  color?: string; // default '#ffe600' (yellow)
  label?: string; // optional text label next to ring
}

/**
 * Applies a smooth dynamic zoom-punch (punch-in & ease-out) at a specified timestamp using FFmpeg crop math.
 */
export async function applyZoomPunch(
  inputVideo: string,
  outputVideo: string,
  options: ZoomPunchOptions
): Promise<string> {
  const { startTime, duration = 0.6, zoomFactor = 1.08 } = options;
  const zoomFraction = (zoomFactor - 1.0).toFixed(3);

  // Expression computes smooth half-sine pulse: 1 - fraction * sin(progress * PI)
  const cropExpr =
    `crop=w='iw*(1-${zoomFraction}*sin(min(max((t-${startTime.toFixed(2)})/${duration.toFixed(2)},0),1)*PI))':` +
    `h='ih*(1-${zoomFraction}*sin(min(max((t-${startTime.toFixed(2)})/${duration.toFixed(2)},0),1)*PI))',` +
    `scale=1080:1920:flags=lanczos,setsar=1`;

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
      '-vf', cropExpr,
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
      '-vf', cropExpr,
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

/**
 * Creates an SVG pulsing highlight ring overlay at (x, y) to draw attention to UI buttons or products.
 */
export function generateHighlightRingSvg(options: HighlightRingOptions): string {
  const { x, y, radius = 60, color = '#ffe600', label = '' } = options;
  const pulseRadius = radius + 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Outer Pulsing Halo -->
  <circle cx="${x}" cy="${y}" r="${pulseRadius}" fill="none" stroke="${color}" stroke-width="4" opacity="0.6" filter="url(#glow)"/>

  <!-- Inner Solid Ring -->
  <circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="${color}" stroke-width="6" filter="url(#glow)"/>

  <!-- Center Dot -->
  <circle cx="${x}" cy="${y}" r="6" fill="${color}"/>

  ${label ? `
  <!-- Label Tag -->
  <g transform="translate(${x + radius + 15}, ${y - 15})">
    <rect x="0" y="0" width="${label.length * 18 + 24}" height="42" rx="21" fill="rgba(0,0,0,0.85)" stroke="${color}" stroke-width="2"/>
    <text x="12" y="27" fill="#ffffff" font-family="-apple-system, system-ui, sans-serif" font-size="20" font-weight="bold">${label}</text>
  </g>` : ''}
</svg>`;
}

/**
 * Burns an attention highlight ring into a video over a specific time window.
 */
export async function applyHighlightRing(
  inputVideo: string,
  outputVideo: string,
  options: HighlightRingOptions & { startTime: number; endTime: number }
): Promise<string> {
  const { startTime, endTime, ...ringOpts } = options;
  const workDir = path.dirname(outputVideo);
  if (!fs.existsSync(workDir)) {
    fs.mkdirSync(workDir, { recursive: true });
  }

  const svgPath = path.join(workDir, `ring_${Date.now()}.svg`);
  const pngPath = path.join(workDir, `ring_${Date.now()}.png`);
  fs.writeFileSync(svgPath, generateHighlightRingSvg(ringOpts));

  const { promise: sipsPromise, resolve: resolveSips } = Promise.withResolvers<void>();
  const sipsProc = spawn('sips', ['-s', 'format', 'png', svgPath, '--out', pngPath], { stdio: 'ignore' });
  sipsProc.on('close', () => resolveSips());
  await sipsPromise;

  const overlayImg = fs.existsSync(pngPath) ? pngPath : svgPath;

  const filter = `[0:v][1:v]overlay=0:0:enable='between(t,${startTime.toFixed(2)},${endTime.toFixed(2)})'[vout]`;
  const isDarwin = process.platform === 'darwin';

  try {
    await runFFmpeg([
      '-y',
      '-i', inputVideo,
      '-i', overlayImg,
      '-filter_complex', filter,
      '-map', '[vout]',
      '-map', '0:a?',
      '-c:v', isDarwin ? 'h264_videotoolbox' : 'libx264',
      '-b:v', '8M',
      '-c:a', 'copy',
      '-movflags', '+faststart',
      outputVideo,
    ]);
  } finally {
    if (fs.existsSync(svgPath)) fs.unlinkSync(svgPath);
    if (fs.existsSync(pngPath)) fs.unlinkSync(pngPath);
  }

  return outputVideo;
}
