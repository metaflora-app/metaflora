import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMediaRuntimeConfig,
  getMediaResultKind
} from '../src/media-runtime-config.js';
import { TOOL_CATALOG } from '../src/tool-catalog.js';

const expectedKinds = Object.freeze({
  photo_generate: 'image',
  photo_edit: 'image',
  photo_pose_transfer: 'image',
  photo_colorize: 'image',
  photo_restore: 'image',
  photo_remove_bg: 'image',
  photo_object_remove: 'image',
  photo_expand: 'image',
  photo_face_restore: 'image',
  photo_try_on: 'image',
  photo_product: 'image',
  photo_ocr: 'text',
  photo_upscale: 'image',
  video_generate: 'video',
  video_image_to_video: 'video',
  video_extend: 'video',
  video_understand: 'text',
  video_edit: 'video',
  video_live_photo: 'video',
  video_lipsync: 'video',
  video_talking_head: 'video',
  video_remove_bg: 'video',
  video_remove_object: 'video',
  video_upscale: 'video',
  audio_stt: 'text',
  audio_tts: 'audio',
  audio_voice_clone: 'audio',
  audio_isolation: 'audio',
  audio_stems: 'audio',
  audio_sfx: 'audio',
  audio_music: 'audio',
  audio_voice_change: 'audio',
  document_ocr: 'text',
  document_table: 'text',
  document_formula: 'text',
  document_chart: 'text',
  data_extract: 'text',
  data_image_description: 'text',
  three_d_image: '3d',
  three_d_text: '3d',
  three_d_extract: '3d',
  three_d_multi_image: '3d'
});

test('builds an invokeMediaTool route for every catalog tool', () => {
  const config = buildMediaRuntimeConfig({
    fal: 'fal-secret',
    elevenlabs: 'xi-secret',
    polza: 'polza-secret'
  });

  assert.deepEqual(config.providers, {
    fal: { apiKey: 'fal-secret' },
    elevenlabs: { apiKey: 'xi-secret' },
    polza: { apiKey: 'polza-secret' }
  });
  assert.deepEqual(Object.keys(config.routes), TOOL_CATALOG.map(({ id }) => id));

  for (const tool of TOOL_CATALOG) {
    const routes = config.routes[tool.id];
    assert.equal(routes.length, tool.routes.length, tool.id);

    for (const [index, route] of routes.entries()) {
      assert.deepEqual(
        {
          provider: route.provider,
          endpoint: route.endpoint,
          role: route.role,
          verified: route.verified
        },
        {
          provider: tool.routes[index].provider,
          endpoint: tool.routes[index].endpoint,
          role: tool.routes[index].role,
          verified: tool.routes[index].verified
        },
        tool.id
      );
      assert.deepEqual(route.runtime, {
        ...tool.runtime,
        ...(tool.routes[index].runtime ?? {})
      }, tool.id);
      assert.notEqual(route.runtime, tool.runtime, tool.id);
      assert.notEqual(route.runtime.inputMap, tool.runtime.inputMap, tool.id);
      assert.equal(route.resultKind, expectedKinds[tool.id], tool.id);
    }
  }
});

test('assigns result types and MIME types from each tool output', () => {
  const { routes } = buildMediaRuntimeConfig({ fal: 'fal-secret' });
  const routeFor = (id) => routes[id][0];

  for (const tool of TOOL_CATALOG) {
    assert.equal(getMediaResultKind(tool), expectedKinds[tool.id], tool.id);
  }

  assert.deepEqual(
    [routeFor('photo_restore').type, routeFor('photo_restore').mimeType],
    ['image', 'image/jpeg']
  );
  assert.deepEqual(
    [routeFor('video_edit').type, routeFor('video_edit').mimeType],
    ['video', 'video/mp4']
  );
  assert.deepEqual(
    [routeFor('audio_tts').type, routeFor('audio_tts').mimeType],
    ['audio', 'audio/mpeg']
  );
  assert.deepEqual(
    [routeFor('photo_ocr').type, routeFor('photo_ocr').mimeType],
    ['text', 'text/plain']
  );
  assert.deepEqual(
    [routeFor('audio_stt').type, routeFor('audio_stt').mimeType],
    ['text', 'text/plain']
  );
  assert.deepEqual(
    [
      routeFor('three_d_text').resultKind,
      routeFor('three_d_text').type,
      routeFor('three_d_text').mimeType
    ],
    ['3d', 'document', 'model/gltf-binary']
  );
});

test('copies provider keys and nested runtime records without mutating inputs', () => {
  const providerKeys = { fal: 'fal-secret', elevenlabs: 'xi-secret' };
  const originalRuntime = TOOL_CATALOG.find(({ id }) => id === 'photo_restore').runtime;
  const config = buildMediaRuntimeConfig(providerKeys);

  providerKeys.fal = 'changed';
  config.routes.photo_restore[0].runtime.inputMap.image = 'changed_field';

  assert.equal(config.providers.fal.apiKey, 'fal-secret');
  assert.equal(config.providers.elevenlabs.apiKey, 'xi-secret');
  assert.equal(originalRuntime.inputMap.image, 'image_url');
});

test('rejects invalid provider key containers', () => {
  for (const providerKeys of [null, [], 'fal-secret']) {
    assert.throws(
      () => buildMediaRuntimeConfig(providerKeys),
      /providerKeys must be an object/i
    );
  }
});
