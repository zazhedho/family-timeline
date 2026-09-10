import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const APP_SHELL = [
  '/',
  '/index.html',
  '/style.css',
  '/script.mjs',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
];

async function pngInfo(path) {
  const image = await readFile(new URL(path, import.meta.url));
  assert.equal(image.subarray(1, 4).toString(), 'PNG');
  return {
    width: image.readUInt32BE(16),
    height: image.readUInt32BE(20),
    colorType: image[25],
  };
}

test('links the web app manifest and Apple touch icon', async () => {
  const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');

  assert.match(html, /<link rel="manifest" href="\.\/manifest\.webmanifest">/);
  assert.match(html, /<link rel="apple-touch-icon" href="\.\/icons\/apple-touch-icon\.png">/);
});

test('publishes an installable standalone manifest', async () => {
  const manifest = JSON.parse(
    await readFile(new URL('./manifest.webmanifest', import.meta.url), 'utf8')
  );

  assert.equal(manifest.id, '/');
  assert.equal(manifest.name, "I'M YOURZ Family");
  assert.equal(manifest.short_name, 'YOURZ Family');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.lang, 'id-ID');
  assert.equal(manifest.theme_color, '#f4f5ef');
  assert.equal(manifest.background_color, '#f4f5ef');
  assert.deepEqual(
    manifest.icons.map(({ src, sizes, purpose }) => ({ src, sizes, purpose })),
    [
      { src: '/icons/icon-192.png', sizes: '192x192', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', purpose: 'maskable' },
    ]
  );
});

test('provides opaque installation icons at their declared sizes', async () => {
  const icons = await Promise.all([
    pngInfo('./icons/icon-192.png'),
    pngInfo('./icons/icon-512.png'),
    pngInfo('./icons/icon-maskable-512.png'),
    pngInfo('./icons/apple-touch-icon.png'),
  ]);

  assert.deepEqual(icons.map(({ width, height }) => [width, height]), [
    [192, 192],
    [512, 512],
    [512, 512],
    [180, 180],
  ]);
  icons.forEach(({ colorType }) => assert.ok(![4, 6].includes(colorType)));
});

test('registers a service worker that caches the complete app shell', async () => {
  const [script, worker] = await Promise.all([
    readFile(new URL('./script.mjs', import.meta.url), 'utf8'),
    readFile(new URL('./sw.js', import.meta.url), 'utf8'),
  ]);

  assert.match(script, /navigator\.serviceWorker\.register\('\/sw\.js'\)/);
  APP_SHELL.forEach((asset) => assert.ok(worker.includes(`'${asset}'`), asset));
  assert.match(worker, /fetch\(event\.request\)/);
  assert.match(worker, /caches\.match\(event\.request\)/);
});
