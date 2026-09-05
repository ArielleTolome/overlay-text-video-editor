import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CLIProxyClient, FishAudioClient } from './ai';
import { downloadTikTokMusic, mixAudioWithDucking, prepareMusicBed } from './audio';
import { OverlayRenderer } from './renderer';
import type { StitchOptions } from './types';

function runFFmpeg(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const { promise, resolve, reject } = Promise.withResolvers<{ stdout: string; stderr: string }>();
  const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  proc.stdout.on('data', (d) => { stdout += d.toString(); });
  proc.stderr.on('data', (d) => { stderr += d.toString(); });
  proc.on('close', (code) => {
    if (code === 0) resolve({ stdout, stderr });
    else reject(new Error(`ffmpeg failed (${code}): ${stderr.slice(-600)}`));
  });
  return promise;
}

export function listAvailableReactionHooks(searchDir?: string): Array<{ name: string; emotion: string; path: string }> {
  const baseDir = searchDir || path.resolve(process.cwd(), 'assets/reference_videos');
  if (!fs.existsSync(baseDir)) return [];

  const files = fs.readdirSync(baseDir);
  return files
    .filter((f) => f.startsWith('hero-sp-') && f.endsWith('.mp4'))
    .map((f) => {
      const emotion = f.replace(/^hero-sp-\d+-/, '').replace(/\.mp4$/, '');
      return {
        name: f,
        emotion,
        path: path.join(baseDir, f),
      };
    });
}

export class UGCStitcher {
  public readonly overlayRenderer: OverlayRenderer;
  public readonly ttsClient: FishAudioClient;
  public readonly aiClient: CLIProxyClient;

  constructor() {
    this.overlayRenderer = new OverlayRenderer();
    this.ttsClient = new FishAudioClient();
    this.aiClient = new CLIProxyClient();
  }

  /**
   * Normalizes an individual video clip (scale, crop/pad to 1080x1920 30fps) and trims.
   */
  async prepareSegment(options: {
    inputPath: string;
    start?: number;
    duration?: number;
    speed?: number;
    outputPath: string;
  }): Promise<string> {
    const { inputPath, start = 0, duration, speed = 1.0, outputPath } = options;
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const vf = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30';
    const { promise: audioPromise, resolve: resolveAudio } = Promise.withResolvers<boolean>();
    const probeProc = spawn('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_name', '-of', 'json', inputPath]);
    let probeOut = '';
    probeProc.stdout.on('data', (d) => { probeOut += d.toString(); });
    probeProc.on('close', () => {
      try {
        const parsed = JSON.parse(probeOut);
        resolveAudio(Boolean(parsed.streams && parsed.streams.length > 0));
      } catch {
        resolveAudio(false);
      }
    });
    const hasAudio = await audioPromise;

    if (speed !== 1.0) {
      // Two-pass speed up
      const tempTrim = outputPath.replace(/\.mp4$/, '_trim.mp4');
      const trimArgs = ['-y', '-i', inputPath, '-ss', start.toFixed(2)];
      if (duration) trimArgs.push('-t', (duration * speed).toFixed(2));
      trimArgs.push('-c', 'copy', tempTrim);
      await runFFmpeg(trimArgs);

      const ptsMult = (1 / speed).toFixed(4);
      const speedVf = `setpts=${ptsMult}*PTS,${vf}`;

      if (hasAudio) {
        await runFFmpeg([
          '-y', '-i', tempTrim,
          '-vf', speedVf,
          '-af', `atempo=${speed.toFixed(4)}`,
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-crf', '20',
          '-c:a', 'aac',
          '-ar', '44100',
          '-ac', '2',
          '-b:a', '192k',
          '-pix_fmt', 'yuv420p',
          outputPath
        ]);
      } else {
        await runFFmpeg([
          '-y', '-i', tempTrim,
          '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
          '-vf', speedVf,
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-crf', '20',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-shortest',
          '-pix_fmt', 'yuv420p',
          outputPath
        ]);
      }
      if (fs.existsSync(tempTrim)) fs.unlinkSync(tempTrim);
    } else {
      if (hasAudio) {
        const args = ['-y', '-ss', start.toFixed(2), '-i', inputPath];
        if (duration) args.push('-t', duration.toFixed(2));
        args.push(
          '-vf', vf,
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-crf', '20',
          '-c:a', 'aac',
          '-ar', '44100',
          '-ac', '2',
          '-b:a', '192k',
          '-pix_fmt', 'yuv420p',
          outputPath
        );
        await runFFmpeg(args);
      } else {
        const args = [
          '-y', '-ss', start.toFixed(2), '-i', inputPath,
          '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100'
        ];
        if (duration) args.push('-t', duration.toFixed(2));
        args.push(
          '-vf', vf,
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-crf', '20',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-shortest',
          '-pix_fmt', 'yuv420p',
          outputPath
        );
        await runFFmpeg(args);
      }
    }
    return outputPath;
  }

  /**
   * Concatenates prepared segment files using the FFmpeg concat demuxer.
   */
  async concatSegments(segmentPaths: string[], outputPath: string): Promise<string> {
    const listFile = outputPath + '.concat.txt';
    const content = segmentPaths.map((p) => `file '${path.resolve(p)}'`).join('\n');
    fs.writeFileSync(listFile, content);

    try {
      await runFFmpeg([
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', listFile,
        '-c', 'copy',
        '-movflags', '+faststart',
        outputPath
      ]);
    } finally {
      if (fs.existsSync(listFile)) fs.unlinkSync(listFile);
    }

    return outputPath;
  }

  /**
   * Assembles a multi-clip UGC video:
   * Block 1: Reaction Hook clip (e.g. 0-3s)
   * Block 2: Demo clips (e.g. app gameplay, grocery b-roll, 3-12s)
   * Block 3: Climax / CTA clip (e.g. 12-15s)
   * With text overlays, voiceover, and ducked TikTok music bed.
   */
  async stitch(options: StitchOptions): Promise<{ outputPath: string; totalDuration: number }> {
    const {
      hookClip,
      demoClips = [],
      ctaClip,
      hookDuration,
      demoDuration = 8.0,
      ctaDuration = 3.0,
      outputVideo,
      textOverlays = [],
      ttsText,
      musicSource,
      musicVolume = 0.2,
      verbose = false,
    } = options;

    const workDir = path.resolve(path.dirname(outputVideo), '.stitch_temp_' + Date.now());
    fs.mkdirSync(workDir, { recursive: true });

    try {
      const preparedSegments: string[] = [];

      // 1. Prepare Reaction Hook Clip
      const hookPath = typeof hookClip === 'string' ? hookClip : hookClip.path;
      const hookStart = typeof hookClip === 'object' && hookClip.start !== undefined ? hookClip.start : 0;
      const isMultiSegment = demoClips.length > 0 || Boolean(ctaClip);
      const defaultHookDur = isMultiSegment ? 3.0 : undefined;
      const hookDur = typeof hookClip === 'object' && hookClip.duration !== undefined
        ? hookClip.duration
        : (hookDuration !== undefined ? hookDuration : defaultHookDur);
      const hookOut = path.join(workDir, '01_hook.mp4');

      if (verbose) console.log(`[Stitcher] Preparing Hook segment from ${path.basename(hookPath)} (${hookDur}s)...`);
      await this.prepareSegment({
        inputPath: hookPath,
        start: hookStart,
        duration: hookDur,
        outputPath: hookOut,
      });
      preparedSegments.push(hookOut);

      // 2. Prepare Demo Clips
      let demoIndex = 0;
      for (const demo of demoClips) {
        demoIndex++;
        const demoPath = typeof demo === 'string' ? demo : demo.path;
        const demoStart = typeof demo === 'object' && demo.start !== undefined ? demo.start : 0;
        const demoDur = typeof demo === 'object' && demo.duration !== undefined ? demo.duration : demoDuration;
        const demoSpeed = typeof demo === 'object' && demo.speed !== undefined ? demo.speed : 1.0;
        const demoOut = path.join(workDir, `02_demo_${demoIndex}.mp4`);

        if (verbose) console.log(`[Stitcher] Preparing Demo segment #${demoIndex} (${demoDur}s)...`);
        await this.prepareSegment({
          inputPath: demoPath,
          start: demoStart,
          duration: demoDur,
          speed: demoSpeed,
          outputPath: demoOut,
        });
        preparedSegments.push(demoOut);
      }

      // 3. Prepare CTA Clip (if provided)
      if (ctaClip) {
        const ctaPath = typeof ctaClip === 'string' ? ctaClip : ctaClip.path;
        const ctaStart = typeof ctaClip === 'object' && ctaClip.start !== undefined ? ctaClip.start : 0;
        const ctaDur = typeof ctaClip === 'object' && ctaClip.duration !== undefined ? ctaClip.duration : ctaDuration;
        const ctaOut = path.join(workDir, '03_cta.mp4');

        if (verbose) console.log(`[Stitcher] Preparing CTA segment (${ctaDur}s)...`);
        await this.prepareSegment({
          inputPath: ctaPath,
          start: ctaStart,
          duration: ctaDur,
          outputPath: ctaOut,
        });
        preparedSegments.push(ctaOut);
      }

      // 4. Concat video clips if multi-segment
      let rawConcatVideo = preparedSegments[0]!;
      if (preparedSegments.length > 1) {
        const concatOut = path.join(workDir, 'concatenated_raw.mp4');
        await this.concatSegments(preparedSegments, concatOut);
        rawConcatVideo = concatOut;
      }
      // 5. Determine total video duration
      const probeProc = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        rawConcatVideo
      ]);
      let probeOut = '';
      probeProc.stdout.on('data', (d) => { probeOut += d.toString(); });
      const { promise: probePromise, resolve: resolveProbe } = Promise.withResolvers<number>();
      probeProc.on('close', () => resolveProbe(parseFloat(probeOut.trim()) || (hookDur + demoDuration + (ctaClip ? ctaDuration : 0))));
      const totalDuration = await probePromise;

      // 6. Apply Text Overlays (Green Zone compliance)
      let videoWithOverlays = rawConcatVideo;
      if (textOverlays.length > 0) {
        await this.overlayRenderer.init();
        const overlayVideoOut = path.join(workDir, 'video_with_overlays.mp4');
        const overlayInputs: string[] = ['-y', '-i', rawConcatVideo];
        const filterParts: string[] = [];
        let currentInputLabel = '0:v';

        for (const [i, item] of textOverlays.entries()) {
          const overlayPng = path.join(workDir, `overlay_${i}.png`);
          const overlayStyle = item.style || 'stroke';
          await this.overlayRenderer.renderOverlay(item.text, overlayStyle, overlayPng, {
            placement: item.placement || 'top',
          });

          overlayInputs.push('-i', overlayPng);
          const nextLabel = i === textOverlays.length - 1 ? 'vout' : `v${i + 1}`;
          const safeStart = item.start.toFixed(2);
          const safeEnd = Math.min(item.end, totalDuration).toFixed(2);

          filterParts.push(
            `[${currentInputLabel}][${i + 1}:v]overlay=0:0:enable='between(t,${safeStart},${safeEnd})'[${nextLabel}]`
          );
          currentInputLabel = nextLabel;
        }

        const isDarwin = process.platform === 'darwin';
        const ffmpegArgs = [
          ...overlayInputs,
          '-filter_complex', filterParts.join(';'),
          '-map', '[vout]',
          '-c:v', isDarwin ? 'h264_videotoolbox' : 'libx264',
          '-b:v', '8M',
          '-pix_fmt', 'yuv420p',
          '-an',
          overlayVideoOut,
        ];

        try {
          await runFFmpeg(ffmpegArgs);
        } catch {
          await runFFmpeg([
            ...overlayInputs,
            '-filter_complex', filterParts.join(';'),
            '-map', '[vout]',
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', '20',
            '-pix_fmt', 'yuv420p',
            '-an',
            overlayVideoOut,
          ]);
        }
        videoWithOverlays = overlayVideoOut;
      }

      // 7. Handle Audio (Voiceover + Music Ducking)
      let voPath: string | null = null;
      if (ttsText) {
        const rawVo = path.join(workDir, 'vo_raw.mp3');
        const fitVo = path.join(workDir, 'vo_fit.mp3');
        await this.ttsClient.generateSpeech(ttsText, rawVo);
        await this.ttsClient.fitDuration(rawVo, totalDuration, fitVo);
        voPath = fitVo;
      }

      let musicPath: string | null = null;
      if (musicSource) {
        const downloadedMusic = path.join(workDir, 'music_downloaded.mp3');
        const localSource = await downloadTikTokMusic(musicSource, downloadedMusic);
        const musicBed = path.join(workDir, 'music_bed.mp3');
        await prepareMusicBed(localSource, totalDuration, musicBed);
        musicPath = musicBed;
      }

      // 8. Final audio mux with ducking
      const finalOutDir = path.dirname(outputVideo);
      if (!fs.existsSync(finalOutDir)) {
        fs.mkdirSync(finalOutDir, { recursive: true });
      }

      await mixAudioWithDucking({
        videoPath: videoWithOverlays,
        voiceoverPath: voPath,
        musicPath,
        musicVolume,
        targetDuration: totalDuration,
        outputPath: outputVideo,
      });

      return {
        outputPath: outputVideo,
        totalDuration,
      };
    } finally {
      try {
        await this.overlayRenderer.close();
      } catch {}
      if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true, force: true });
      }
    }
  }
}
