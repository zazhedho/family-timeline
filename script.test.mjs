import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as timeline from './script.mjs';

const { calculateAge, formatNextBirthday, formatNumber, getNextBirthday } = timeline;

test('calculates calendar age and full totals in WIB', () => {
  const birth = new Date('1996-03-02T10:00:00+07:00');
  const now = new Date('2026-09-07T13:12:36+07:00');

  assert.deepEqual(calculateAge(birth, now), {
    calendar: {
      years: 30,
      months: 6,
      days: 5,
      hours: 3,
      minutes: 12,
      seconds: 36,
    },
    totals: {
      seconds: 963025956,
      minutes: 16050432,
      hours: 267507,
      days: 11146,
      weeks: 1592,
      months: 366,
      years: 30,
    },
  });

  assert.equal(formatNumber(963025956), '963.025.956');
});

test('uses WIB calendar parts when the viewer time is UTC', () => {
  const birth = new Date('1996-03-02T10:00:00+07:00');
  const now = new Date('2026-09-07T06:12:36Z');

  assert.deepEqual(calculateAge(birth, now).calendar, {
    years: 30,
    months: 6,
    days: 5,
    hours: 3,
    minutes: 12,
    seconds: 36,
  });
});

test('returns a readable error for an invalid or future birth date', () => {
  const now = new Date('2026-09-07T00:00:00+07:00');

  assert.equal(calculateAge(new Date('not-a-date'), now).error, 'Tanggal lahir tidak valid.');
  assert.equal(
    calculateAge(new Date('2026-09-08T00:00:00+07:00'), now).error,
    'Belum lahir.'
  );
});

test('calculates the next birthday and days remaining in WIB', () => {
  const birth = new Date('1996-03-02T10:00:00+07:00');
  const now = new Date('2026-09-07T13:12:36+07:00');

  assert.equal(getNextBirthday(birth, now).daysUntil, 176);
  assert.equal(
    formatNextBirthday(birth, now),
    '2 Mar 2027 · 176 hari lagi'
  );
});

test('treats the whole WIB birthday as today, before and after the birth hour', () => {
  const birth = new Date('1996-03-02T10:00:00+07:00');

  assert.equal(formatNextBirthday(birth, new Date('2027-03-02T00:00:00+07:00')), 'Ulang tahun hari ini');
  assert.equal(formatNextBirthday(birth, new Date('2027-03-02T16:00:00+07:00')), 'Ulang tahun hari ini');
  assert.equal(formatNextBirthday(birth, new Date('2027-03-02T23:59:59+07:00')), 'Ulang tahun hari ini');
  assert.equal(formatNextBirthday(birth, new Date('2027-03-03T00:00:00+07:00')), '2 Mar 2028 · 365 hari lagi');
  // UTC viewer: 2027-03-02T17:00Z is already 3 Mar in WIB
  assert.equal(getNextBirthday(birth, new Date('2027-03-02T17:00:00Z')).daysUntil, 365);
});

const WEDDING_AT = new Date('2025-04-27T15:00:00+07:00');

test('formats the wedding date with its Indonesian weekday', () => {
  assert.equal(timeline.formatWeddingDate(WEDDING_AT), 'Minggu, 27 April 2025');
  assert.equal(timeline.formatWeddingTime(WEDDING_AT), 'pukul 15.00 WIB');
  assert.equal(timeline.WEDDING.at, '2025-04-27T15:00:00+07:00');
});

test('counts time together since the wedding', () => {
  assert.deepEqual(
    calculateAge(WEDDING_AT, new Date('2026-10-25T18:12:45+07:00')).calendar,
    { years: 1, months: 5, days: 28, hours: 3, minutes: 12, seconds: 45 }
  );
});

test('rolls the anniversary ordinal forward every year', () => {
  const f = (iso) => timeline.formatNextAnniversary(WEDDING_AT, new Date(iso));
  assert.equal(f('2026-10-25T12:00:00+07:00'), 'Anniversary ke-2 · 27 Apr 2027 · 184 hari lagi');
  assert.equal(f('2027-04-27T09:00:00+07:00'), 'Anniversary ke-2 hari ini');
  assert.equal(f('2027-04-27T20:00:00+07:00'), 'Anniversary ke-2 hari ini');
  assert.equal(f('2027-04-28T00:00:00+07:00'), 'Anniversary ke-3 · 27 Apr 2028 · 365 hari lagi');
  assert.equal(timeline.getNextAnniversary(WEDDING_AT, new Date('2031-01-01T00:00:00+07:00')).ordinal, 6);
});

test('builds the couple title from the parents first names', () => {
  assert.equal(timeline.coupleTitle(timeline.PEOPLE), 'Zaidus & Zaqia');
});

test('keeps desktop cards independent when a sibling expands', async () => {
  const css = await readFile(new URL('./style.css', import.meta.url), 'utf8');

  assert.match(css, /\.family-grid\s*\{[^}]*align-items:\s*start;/s);
});

test('keeps family names on one line and uses Daddy and Mommy labels', async () => {
  const [css, script] = await Promise.all([
    readFile(new URL('./style.css', import.meta.url), 'utf8'),
    readFile(new URL('./script.mjs', import.meta.url), 'utf8'),
  ]);

  assert.match(css, /\.person-card h2\s*\{[^}]*white-space:\s*nowrap;/s);
  assert.match(script, /id: 'papa', role: 'Daddy'/);
  assert.match(script, /id: 'mama', role: 'Mommy'/);
  assert.match(script, /Awal Mula: Daddy & Mommy/);
  assert.doesNotMatch(script, /person-avatar|person-identity|const initial/);
});

test('keeps the clock beside the calendar age on mobile', async () => {
  const css = await readFile(new URL('./style.css', import.meta.url), 'utf8');

  assert.doesNotMatch(css, /\.age-clock\s*\{[^}]*grid-row:\s*auto;/s);
  assert.doesNotMatch(css, /\.calendar-age > div\s*\{[^}]*grid-template-columns:\s*1fr;/s);
});

test('interpolates count-up values from zero to the current total', () => {
  assert.equal(typeof timeline.interpolateCount, 'function');
  assert.equal(timeline.interpolateCount(100, 0), 0);
  assert.equal(timeline.interpolateCount(100, 0.5), 87);
  assert.equal(timeline.interpolateCount(100, 1), 100);
});
