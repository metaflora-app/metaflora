import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { mixDubbedVideo } from '../src/audio-video-mixer.js';

test('dubbed audio is muxed onto the original video as a real MP4', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'mixer-fixture-'));
  const videoPath = join(directory, 'source.mp4');
  const audioPath = join(directory, 'dubbed.mp3');
  assert.equal(spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'color=c=black:s=320x240:d=1',
    '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1',
    '-shortest', '-c:v', 'libx264', '-c:a', 'aac', videoPath
  ]).status, 0);
  assert.equal(spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'sine=frequency=880:duration=1', audioPath
  ]).status, 0);

  const output = await mixDubbedVideo({
    dubbedAudio: readFileSync(audioPath),
    originalVideo: readFileSync(videoPath),
    mix: false
  });
  assert.equal(output.subarray(4, 8).toString('ascii'), 'ftyp');
  assert.ok(output.length > 1_000);
});
