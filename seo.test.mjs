import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const DOMAIN = 'https://family.imyourz.com/';

test('publishes consistent SEO metadata for the production URL', async () => {
  const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');

  assert.match(html, /<title>I'M YOURZ Family — Silsilah dan Umur Keluarga<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /<meta name="robots" content="index, follow, max-image-preview:large">/);
  assert.ok(html.includes(`<link rel="canonical" href="${DOMAIN}">`));
  assert.ok(html.includes(`<meta property="og:url" content="${DOMAIN}">`));

  const structuredData = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(structuredData, 'WebSite structured data is missing');
  const website = JSON.parse(structuredData[1]);
  assert.equal(website['@type'], 'WebSite');
  assert.equal(website.url, DOMAIN);
  assert.equal(website.inLanguage, 'id-ID');
});

test('publishes crawler files without an SPA catch-all rewrite', async () => {
  const [robots, sitemap, vercelSource] = await Promise.all([
    readFile(new URL('./robots.txt', import.meta.url), 'utf8'),
    readFile(new URL('./sitemap.xml', import.meta.url), 'utf8'),
    readFile(new URL('./vercel.json', import.meta.url), 'utf8'),
  ]);

  assert.match(robots, /^User-agent: \*\nAllow: \/$/m);
  assert.ok(robots.includes(`Sitemap: ${DOMAIN}sitemap.xml`));
  assert.ok(sitemap.includes(`<loc>${DOMAIN}</loc>`));

  const vercel = JSON.parse(vercelSource);
  assert.equal(vercel.trailingSlash, true);
  assert.equal(vercel.rewrites, undefined);
});
