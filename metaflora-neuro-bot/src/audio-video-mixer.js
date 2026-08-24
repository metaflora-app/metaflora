import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function mixDubbedVideo({ dubbedAudio, originalVideo, sourcePercent = 0, mix = false, timeoutMs = 120_000 }) {
  if (!Buffer.isBuffer(dubbedAudio) || !dubbedAudio.length) throw new TypeError('Dubbed audio is required.');
  if (!Buffer.isBuffer(originalVideo) || !originalVideo.length) throw new TypeError('Original video is required.');
  if (!Number.isInteger(sourcePercent) || sourcePercent < 0 || sourcePercent > 100) {
    throw new RangeError('Source audio percent must be between 0 and 100.');
  }
  const directory = await mkdtemp(join(tmpdir(), 'metaflora-dub-'));
  const dubbedPath = join(directory, 'dubbed.mp3');
  const sourcePath = join(directory, 'source.mp4');
  const outputPath = join(directory, 'mixed.mp4');
  try {
    await Promise.all([
      writeFile(dubbedPath, dubbedAudio, { mode: 0o600 }),
      writeFile(sourcePath, originalVideo, { mode: 0o600 })
    ]);
    const sourceVolume = (sourcePercent / 100).toFixed(2);
    await new Promise((resolve, reject) => {
      const audioArgs = mix ? [
        '-filter_complex', `[0:a]volume=1[a0];[1:a]volume=${sourceVolume}[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=0[a]`,
        '-map', '1:v:0', '-map', '[a]'
      ] : ['-map', '1:v:0', '-map', '0:a:0'];
      const child = spawn('ffmpeg', [
        '-nostdin', '-hide_banner', '-loglevel', 'error', '-y',
        '-i', dubbedPath, '-i', sourcePath,
        ...audioArgs, '-c:v', 'copy', '-c:a', 'aac', '-movflags', '+faststart',
        '-t', '1800', outputPath
      ], { stdio: ['ignore', 'ignore', 'pipe'] });
      let stderr = '';
      child.stderr.on('data', (chunk) => { stderr = `${stderr}${chunk}`.slice(-2_000); });
      const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
      child.once('error', reject);
      child.once('close', (code) => {
        clearTimeout(timer);
        code === 0 ? resolve() : reject(new Error(`ffmpeg mix failed (${code}): ${stderr}`));
      });
    });
    return await readFile(outputPath);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
