import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Runs a command and returns a promise with stdout/stderr.
 */
function runCommand(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  const { promise, resolve, reject } = Promise.withResolvers<{ stdout: string; stderr: string }>();
  const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  proc.stdout.on('data', (d) => { stdout += d.toString(); });
  proc.stderr.on('data', (d) => { stderr += d.toString(); });
  proc.on('close', (code) => {
    if (code === 0) {
      resolve({ stdout, stderr });
    } else {
      reject(new Error(`${cmd} failed with exit code ${code}: ${stderr.slice(-600)}`));
    }
  });
  return promise;
}

/**
 * Downloads TikTok/YouTube/URL audio track using yt-dlp.
 * If input is already a local file, resolves and returns the local path.
 */
export async function downloadTikTokMusic(urlOrPath: string, outputMp3: string): Promise<string> {
  if (fs.existsSync(urlOrPath)) {
    return path.resolve(urlOrPath);
  }

  const outDir = path.dirname(outputMp3);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const ytdlpBin = fs.existsSync('/opt/homebrew/bin/yt-dlp') ? '/opt/homebrew/bin/yt-dlp' : 'yt-dlp';
  await runCommand(ytdlpBin, [
    '-x',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
    '-o', outputMp3,
    '--no-playlist',
    urlOrPath
  ]);

  if (!fs.existsSync(outputMp3)) {
    // yt-dlp might have appended .mp3 automatically
    const alt = outputMp3.endsWith('.mp3') ? outputMp3 : `${outputMp3}.mp3`;
    if (fs.existsSync(alt)) return alt;
    throw new Error(`Failed to locate downloaded audio from ${urlOrPath}`);
  }

  return outputMp3;
}

/**
 * Prepares a loudness-normalized background music bed looped to target duration (-16 LUFS).
 */
export async function prepareMusicBed(
  inputAudio: string,
  targetDuration: number,
  outputAudio: string
): Promise<string> {
  const outDir = path.dirname(outputAudio);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const safeDuration = Math.max(1, targetDuration);
  const fadeOutStart = Math.max(0, safeDuration - 1.5);
  const afFilter = `loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.5,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=1.5`;

  await runCommand('ffmpeg', [
    '-y',
    '-stream_loop', '-1',
    '-i', inputAudio,
    '-t', safeDuration.toFixed(2),
    '-af', afFilter,
    '-c:a', 'libmp3lame',
    '-q:a', '2',
    outputAudio
  ]);

  return outputAudio;
}

/**
 * Mixes video with voiceover (full volume) and music bed (ducked volume) with audio limiter.
 */
export async function mixAudioWithDucking(options: {
  videoPath: string;
  voiceoverPath?: string | null;
  musicPath?: string | null;
  musicVolume?: number;
  targetDuration: number;
  outputPath: string;
}): Promise<void> {
  const { videoPath, voiceoverPath, musicPath, musicVolume = 0.2, targetDuration, outputPath } = options;

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const hasVo = voiceoverPath && fs.existsSync(voiceoverPath);
  const hasMusic = musicPath && fs.existsSync(musicPath);

  if (hasVo && hasMusic) {
    const fadeOutStart = Math.max(0, targetDuration - 1.5);
    const filterComplex = [
      `[1:a]volume=1.0[vo];`,
      `[2:a]atrim=0:${targetDuration.toFixed(2)},asetpts=PTS-STARTPTS,volume=${musicVolume.toFixed(2)},afade=t=out:st=${fadeOutStart.toFixed(2)}:d=1.5[m];`,
      `[vo][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.97[a]`
    ].join('');

    await runCommand('ffmpeg', [
      '-y',
      '-i', videoPath,
      '-i', voiceoverPath!,
      '-i', musicPath!,
      '-filter_complex', filterComplex,
      '-map', '0:v',
      '-map', '[a]',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-t', targetDuration.toFixed(2),
      '-movflags', '+faststart',
      outputPath
    ]);
  } else if (hasVo) {
    await runCommand('ffmpeg', [
      '-y',
      '-i', videoPath,
      '-i', voiceoverPath!,
      '-map', '0:v',
      '-map', '1:a',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-t', targetDuration.toFixed(2),
      '-movflags', '+faststart',
      outputPath
    ]);
  } else if (hasMusic) {
    const fadeOutStart = Math.max(0, targetDuration - 1.5);
    const filterComplex = `[1:a]atrim=0:${targetDuration.toFixed(2)},asetpts=PTS-STARTPTS,volume=${musicVolume.toFixed(2)},afade=t=out:st=${fadeOutStart.toFixed(2)}:d=1.5,alimiter=limit=0.97[a]`;
    await runCommand('ffmpeg', [
      '-y',
      '-i', videoPath,
      '-i', musicPath!,
      '-filter_complex', filterComplex,
      '-map', '0:v',
      '-map', '[a]',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-t', targetDuration.toFixed(2),
      '-movflags', '+faststart',
      outputPath
    ]);
  } else {
    // Keep original audio or silent
    await runCommand('ffmpeg', [
      '-y',
      '-i', videoPath,
      '-c:v', 'copy',
      '-c:a', 'copy',
      '-t', targetDuration.toFixed(2),
      '-movflags', '+faststart',
      outputPath
    ]);
  }
}
