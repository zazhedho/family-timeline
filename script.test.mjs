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

const ZEIA = [{ id: 'anak', role: 'Anak', name: 'Zeia Elora Zhane', birthAt: '2026-09-02T09:30:00+07:00' }];
const NO_WEDDING = null;

test('celebrates a birthday for three WIB days only', () => {
  const at = (iso) => timeline.getCelebrations(ZEIA, NO_WEDDING, new Date(iso));
  assert.deepEqual(at('2027-09-02T00:00:00+07:00'), [{ kind: 'birthday', id: 'anak', ordinal: 1, day: 1 }]);
  assert.deepEqual(at('2027-09-04T23:59:59+07:00'), [{ kind: 'birthday', id: 'anak', ordinal: 1, day: 3 }]);
  assert.deepEqual(at('2027-09-05T00:00:00+07:00'), []);
  assert.deepEqual(at('2027-09-04T17:00:00Z'), []); // 5 Sep 00.00 WIB
  assert.deepEqual(at('2027-09-01T16:59:59Z'), []); // 1 Sep 23.59 WIB
  assert.deepEqual(at('2026-09-02T12:00:00+07:00'), []); // day of birth itself
});

test('celebrates the wedding anniversary with its ordinal', () => {
  const wedding = { at: '2025-04-27T15:00:00+07:00' };
  assert.deepEqual(
    timeline.getCelebrations([], wedding, new Date('2027-04-27T08:00:00+07:00')),
    [{ kind: 'anniversary', id: 'wedding', ordinal: 2, day: 1 }]
  );
});

test('celebrates a 29 February birthday on 28 February in non-leap years', () => {
  const leap = [{ id: 'x', role: 'Anak', name: 'Leap Kid', birthAt: '2000-02-29T08:00:00+07:00' }];
  const at = (iso) => timeline.getCelebrations(leap, NO_WEDDING, new Date(iso));
  assert.deepEqual(at('2027-02-28T10:00:00+07:00'), [{ kind: 'birthday', id: 'x', ordinal: 27, day: 1 }]);
  assert.deepEqual(at('2027-03-01T10:00:00+07:00'), [{ kind: 'birthday', id: 'x', ordinal: 27, day: 2 }]);
  assert.deepEqual(at('2028-02-28T10:00:00+07:00'), []);
  assert.deepEqual(at('2028-02-29T10:00:00+07:00'), [{ kind: 'birthday', id: 'x', ordinal: 28, day: 1 }]);
});

test('orders overlapping celebrations by most recent day first', () => {
  const people = [
    { id: 'a', role: 'Anak', name: 'Satu', birthAt: '2020-05-01T08:00:00+07:00' },
    { id: 'b', role: 'Anak', name: 'Dua', birthAt: '2021-05-02T08:00:00+07:00' },
  ];
  const celebrations = timeline.getCelebrations(people, NO_WEDDING, new Date('2027-05-02T12:00:00+07:00'));
  assert.deepEqual(celebrations.map(({ id, day }) => [id, day]), [['b', 1], ['a', 2]]);
  assert.equal(timeline.celebrationKey(celebrations), 'birthday:b:6:1|birthday:a:7:2');
  assert.equal(timeline.celebrationKey([]), '');
});

test('writes celebration copy for every day of the window', () => {
  const copy = (c) => timeline.celebrationCopy(c, timeline.PEOPLE);
  assert.deepEqual(copy({ kind: 'birthday', id: 'anak', ordinal: 1, day: 1 }), {
    titleParts: ['Selamat ulang tahun pertama, ', 'Zeia', '!'],
    detail: '2 September · hari ini',
    badge: 'HARI INI!',
  });
  assert.deepEqual(copy({ kind: 'birthday', id: 'papa', ordinal: 31, day: 2 }), {
    titleParts: ['Masih merayakan ulang tahun ke-31, ', 'Zaidus', ''],
    detail: 'hari ke-2 dari 3',
    badge: 'HARI KE-2',
  });
  assert.deepEqual(copy({ kind: 'anniversary', id: 'wedding', ordinal: 2, day: 1 }), {
    titleParts: ['Happy Anniversary ke-2, ', 'Daddy & Mommy', '!'],
    detail: '27 April · hari ini · ketuk untuk lihat kartu',
    badge: 'HARI INI!',
  });
  assert.deepEqual(copy({ kind: 'anniversary', id: 'wedding', ordinal: 2, day: 3 }), {
    titleParts: ['Masih merayakan Anniversary ke-2, ', 'Daddy & Mommy', ''],
    detail: 'hari ke-3 dari 3 · ketuk untuk lihat kartu',
    badge: 'HARI KE-3',
  });
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

test('opens the wedding card as a native dialog from the heart', async () => {
  const [css, script] = await Promise.all([
    readFile(new URL('./style.css', import.meta.url), 'utf8'),
    readFile(new URL('./script.mjs', import.meta.url), 'utf8'),
  ]);
  assert.match(script, /<button[^>]*class="family-heart"[^>]*data-wedding-open/);
  assert.match(script, /<dialog class="wedding-dialog"/);
  assert.match(script, /showModal\(\)/);
  assert.match(css, /\.wedding-card h2\s*\{[^}]*white-space:\s*nowrap;/s);
  assert.match(css, /\.family-heart-caption\s*\{[^}]*white-space:\s*nowrap;/s);
  assert.match(css, /@media \(max-width: 480px\)[\s\S]*\.wedding-dialog\s*\{[^}]*margin:\s*auto 0 0;/);
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
