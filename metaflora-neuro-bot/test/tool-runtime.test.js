import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildToolProviderPayload,
  extractToolOutput,
  normalizeTelegramInputs,
  validateToolInputs,
  validateToolSettings
} from '../src/tool-runtime.js';
import { TOOL_CATALOG } from '../src/tool-catalog.js';

const inputSamples = Object.freeze({
  image: 'https://input.example.test/image.png',
  images: [
    'https://input.example.test/page-1.png',
    'https://input.example.test/page-2.png'
  ],
  person_image: 'https://input.example.test/person.png',
  garment_image: 'https://input.example.test/garment.png',
  text: 'sample text',
  video: 'https://input.example.test/video.mp4',
  audio: 'https://input.example.test/audio.mp3',
  reference_images: ['https://input.example.test/reference.png'],
  keyterms: ['Metaflora'],
  reference_audio: 'https://input.example.test/reference.mp3',
  reference_text: 'reference transcript',
  media: { type: 'audio', value: 'https://input.example.test/media.mp3' },
  masks: ['https://input.example.test/mask.png'],
  points: [{ x: 10, y: 20, label: 1 }],
  boxes: [{ x_min: 1, y_min: 2, x_max: 30, y_max: 40 }]
});

function providerOutputAt(path, value) {
  return path.split('.').toReversed().reduce((nested, segment) => {
    if (/^(?:0|[1-9]\d*)$/u.test(segment)) {
      const output = [];
      output[Number(segment)] = nested;
      return output;
    }
    return { [segment]: nested };
  }, value);
}

test('Telegram photos are assigned to catalog keys in required order', () => {
  const messages = [
    {
      photo: [{ file_id: 'person-small' }, { file_id: 'person-large' }],
      caption: 'summer jacket'
    },
    {
      document: { file_id: 'garment-file', mime_type: 'image/png' }
    }
  ];

  assert.deepEqual(normalizeTelegramInputs('photo_try_on', messages), {
    person_image: 'person-large',
    garment_image: 'garment-file'
  });
  assert.deepEqual(messages[0].photo, [
    { file_id: 'person-small' },
    { file_id: 'person-large' }
  ]);
});

test('Telegram albums and MIME typed documents normalize to plural catalog inputs', () => {
  const messages = [
    { photo: [{ file_id: 'page-1' }] },
    { document: { file_id: 'page-2', mime_type: 'image/jpeg' } }
  ];

  assert.deepEqual(normalizeTelegramInputs('photo_ocr', messages), {
    images: ['page-1', 'page-2']
  });
});

test('captions, voice notes, animations and generic media use catalog keys', () => {
  assert.deepEqual(normalizeTelegramInputs('video_edit', {
    animation: { file_id: 'clip', duration: 4 },
    caption: 'make it rain',
    photo: [{ file_id: 'reference' }]
  }), {
    video: 'clip',
    text: 'make it rain',
    reference_images: ['reference'],
    durationSeconds: 4
  });

  assert.deepEqual(normalizeTelegramInputs('audio_isolation', {
    voice: { file_id: 'voice-note', duration: 12 }
  }), {
    media: { type: 'audio', value: 'voice-note' },
    durationSeconds: 12
  });
});

test('direct catalog-key values survive normalization and are not mutated', () => {
  const source = {
    text: 'hello',
    reference_audio: 'https://cdn.example.test/voice.mp3',
    reference_text: 'sample',
    ignored: 'not a catalog input'
  };

  assert.deepEqual(normalizeTelegramInputs('audio_voice_clone', source), {
    text: 'hello',
    reference_audio: 'https://cdn.example.test/voice.mp3',
    reference_text: 'sample'
  });
  assert.equal(source.ignored, 'not a catalog input');
});

test('input validation enforces required, optional, unknown and catalog constraints', () => {
  assert.deepEqual(
    validateToolInputs('photo_expand', { image: 'image-id' }),
    { image: 'image-id' }
  );
  assert.throws(
    () => validateToolInputs('photo_expand', {}),
    /required input "image"/i
  );
  assert.throws(
    () => validateToolInputs('photo_expand', { image: 'id', unexpected: true }),
    /unknown input "unexpected"/i
  );
  assert.throws(
    () => validateToolInputs('photo_ocr', { images: [] }),
    /at least 1/i
  );
  assert.throws(
    () => validateToolInputs('video_remove_bg', {
      video: 'clip',
      durationSeconds: 31
    }),
    /durationSeconds.*30/i
  );
  assert.throws(
    () => validateToolInputs('audio_isolation', {
      media: { type: 'image', value: 'photo' }
    }),
    /media.*audio.*video/i
  );
});

test('settings validation applies defaults and checks types, ranges, steps and enums', () => {
  const defaults = validateToolSettings('audio_sfx');
  assert.deepEqual(defaults, {
    duration_seconds: 5,
    prompt_influence: 0.3,
    output_format: 'mp3_44100_128'
  });

  assert.deepEqual(validateToolSettings('audio_sfx', {
    duration_seconds: 5.5,
    output_format: 'pcm_44100'
  }), {
    duration_seconds: 5.5,
    prompt_influence: 0.3,
    output_format: 'pcm_44100'
  });
  assert.throws(
    () => validateToolSettings('audio_sfx', { duration_seconds: 5.25 }),
    /step 0.5/i
  );
  assert.throws(
    () => validateToolSettings('audio_sfx', { prompt_influence: 2 }),
    /between 0 and 1/i
  );
  assert.throws(
    () => validateToolSettings('audio_sfx', { output_format: 'flac' }),
    /output_format.*allowed/i
  );
  assert.throws(
    () => validateToolSettings('audio_sfx', { unknown: true }),
    /unknown setting "unknown"/i
  );
});

test('provider payload applies inputMap, dynamic media mapping and validated settings', () => {
  assert.deepEqual(buildToolProviderPayload('photo_object_remove', {
    image: 'https://cdn.example.test/photo.jpg',
    text: 'remove the chair'
  }, {
    model: 'high_quality',
    mask_expansion: 20
  }), {
    image_url: 'https://cdn.example.test/photo.jpg',
    prompt: 'remove the chair',
    model: 'high_quality',
    mask_expansion: 20
  });

  assert.deepEqual(buildToolProviderPayload('audio_isolation', {
    media: { type: 'video', value: 'https://cdn.example.test/clip.mp4' }
  }), {
    audio: 'https://cdn.example.test/clip.mp4'
  });
});

test('provider payload omits absent optional inputs and does not mutate arguments', () => {
  const inputs = { image: 'image-url' };
  const settings = { aspect_ratio: '16:9' };

  assert.deepEqual(buildToolProviderPayload('photo_expand', inputs, settings), {
    image_url: 'image-url',
    aspect_ratio: '16:9',
    negative_prompt: ''
  });
  assert.deepEqual(inputs, { image: 'image-url' });
  assert.deepEqual(settings, { aspect_ratio: '16:9' });
});

test('output extraction follows catalog paths, including array indexes', () => {
  const image = { url: 'https://cdn.example.test/result.png' };

  assert.equal(extractToolOutput('photo_restore', { images: [image] }), image);
  assert.equal(extractToolOutput('audio_stt', { text: 'hello' }), 'hello');
  assert.throws(
    () => extractToolOutput('photo_restore', { images: [] }),
    /output path "images.0"/i
  );
});

test('runtime rejects unknown tools and invalid argument containers', () => {
  assert.throws(() => normalizeTelegramInputs('missing', {}), /unknown tool/i);
  assert.throws(() => validateToolInputs('photo_restore', null), /object/i);
  assert.throws(() => validateToolSettings('photo_restore', []), /object/i);
});

test('all 42 catalog tools produce complete validated payloads and extract configured output', () => {
  assert.equal(TOOL_CATALOG.length, 42);

  for (const tool of TOOL_CATALOG) {
    const keys = [...tool.input.required, ...tool.input.optional];
    const inputs = Object.fromEntries(keys.map((key) => [key, inputSamples[key]]));
    const payload = buildToolProviderPayload(tool, inputs);
    const defaults = validateToolSettings(tool);

    for (const [key, target] of Object.entries(tool.runtime.inputMap)) {
      const providerKey = typeof target === 'string' ? target : target[inputs[key].type];
      const expected = typeof target === 'string' ? inputs[key] : inputs[key].value;
      assert.deepEqual(payload[providerKey], expected, `${tool.id}: input ${key}`);
    }
    for (const [key, value] of Object.entries(defaults)) {
      assert.deepEqual(payload[key], value, `${tool.id}: setting ${key}`);
    }

    const marker = { tool: tool.id };
    assert.equal(
      extractToolOutput(tool, providerOutputAt(tool.runtime.outputPath, marker)),
      marker,
      `${tool.id}: output ${tool.runtime.outputPath}`
    );
  }
});

test('compound media inputs require exactly one non-empty mapped value', () => {
  for (const media of [
    { type: 'audio' },
    { type: 'video', value: '' },
    { type: 'audio', value: ['one', 'two'] },
    { type: 'audio', value: 42 }
  ]) {
    assert.throws(
      () => buildToolProviderPayload('audio_isolation', { media }),
      /input "media"/i
    );
  }
});

test('input validation rejects malformed scalar, plural and metadata values', () => {
  assert.throws(
    () => validateToolInputs('photo_restore', { image: 42 }),
    /input "image".*string/i
  );
  assert.throws(
    () => validateToolInputs('photo_ocr', { images: ['page-1', 2] }),
    /input "images".*strings/i
  );
  assert.throws(
    () => validateToolInputs('video_edit', {
      video: 'clip',
      text: 'edit',
      durationSeconds: '4'
    }),
    /durationSeconds.*number/i
  );
  assert.throws(
    () => validateToolInputs('three_d_extract', {
      image: 'image',
      points: '10,20'
    }),
    /input "points".*array/i
  );
});

test('validated values are detached from nested caller-owned objects', () => {
  const inputs = {
    image: 'image-url',
    points: [{ x: 1, y: 2, label: 1 }]
  };
  const validated = validateToolInputs('three_d_extract', inputs);

  validated.points[0].x = 99;
  assert.equal(inputs.points[0].x, 1);
});
