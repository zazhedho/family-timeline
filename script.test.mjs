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

test('keeps desktop cards independent when a sibling expands', async () => {
  const css = await readFile(new URL('./style.css', import.meta.url), 'utf8');

  assert.match(css, /\.family-grid\s*\{[^}]*align-items:\s*start;/s);
});

test('interpolates count-up values from zero to the current total', () => {
  assert.equal(typeof timeline.interpolateCount, 'function');
  assert.equal(timeline.interpolateCount(100, 0), 0);
  assert.equal(timeline.interpolateCount(100, 0.5), 87);
  assert.equal(timeline.interpolateCount(100, 1), 100);
});
