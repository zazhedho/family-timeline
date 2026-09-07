const TIME_ZONE = 'Asia/Jakarta';
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const WIB_OFFSET = 7 * HOUR;

const numberFormatter = new Intl.NumberFormat('id-ID');
const wibPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  calendar: 'gregory',
  numberingSystem: 'latn',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
const birthDateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const nextBirthdayDateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const birthTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const todayFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const nowTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const PEOPLE = [
  { id: 'papa', role: 'Papa', name: 'Zaidus Zhuhur', birthAt: '1996-03-02T10:00:00+07:00' },
  { id: 'mama', role: 'Mama', name: 'Zaqia Khana Meriza', birthAt: '1997-09-18T00:30:00+07:00' },
  { id: 'anak', role: 'Anak', name: 'Zeia Elora Zhane', birthAt: '2026-09-02T09:30:00+07:00' },
];

const TOTAL_UNITS = [
  ['seconds', 'Total detik'],
  ['minutes', 'Total menit'],
  ['hours', 'Total jam'],
  ['days', 'Total hari'],
  ['weeks', 'Total minggu'],
  ['months', 'Total bulan'],
  ['years', 'Total tahun'],
];

export function formatNumber(value) {
  return numberFormatter.format(value);
}

function getWibParts(date) {
  const parts = Object.fromEntries(
    wibPartsFormatter
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)])
  );

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function calendarMilliseconds(parts) {
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  date.setUTCHours(parts.hour, parts.minute, parts.second, 0);
  return date.getTime();
}

function daysInMonth(year, month) {
  const date = new Date(0);
  date.setUTCFullYear(year, month, 0);
  date.setUTCHours(0, 0, 0, 0);
  return date.getUTCDate();
}

function addCalendarMonths(parts, count) {
  const monthIndex = parts.year * 12 + parts.month - 1 + count;
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex - year * 12 + 1;

  return {
    ...parts,
    year,
    month,
    day: Math.min(parts.day, daysInMonth(year, month)),
  };
}

export function calculateAge(birthDate, nowDate = new Date()) {
  const birthMilliseconds = birthDate?.getTime?.();
  const nowMilliseconds = nowDate?.getTime?.();

  if (!Number.isFinite(birthMilliseconds) || !Number.isFinite(nowMilliseconds)) {
    return { error: 'Tanggal lahir tidak valid.' };
  }

  const currentSecond = Math.floor(nowMilliseconds / SECOND) * SECOND;
  if (currentSecond < birthMilliseconds) {
    return { error: 'Belum lahir.' };
  }

  const birth = getWibParts(new Date(birthMilliseconds));
  const now = getWibParts(new Date(currentSecond));
  const nowCalendarMilliseconds = calendarMilliseconds(now);

  let years = now.year - birth.year;
  let anchor = addCalendarMonths(birth, years * 12);

  if (calendarMilliseconds(anchor) > nowCalendarMilliseconds) {
    years -= 1;
    anchor = addCalendarMonths(birth, years * 12);
  }

  let months = 0;
  while (months < 11) {
    const next = addCalendarMonths(anchor, months + 1);
    if (calendarMilliseconds(next) > nowCalendarMilliseconds) break;
    months += 1;
  }

  anchor = addCalendarMonths(anchor, months);
  let remainderSeconds = Math.floor(
    (nowCalendarMilliseconds - calendarMilliseconds(anchor)) / SECOND
  );
  const days = Math.floor(remainderSeconds / (DAY / SECOND));
  remainderSeconds %= DAY / SECOND;
  const hours = Math.floor(remainderSeconds / (HOUR / SECOND));
  remainderSeconds %= HOUR / SECOND;
  const minutes = Math.floor(remainderSeconds / (MINUTE / SECOND));
  const seconds = remainderSeconds % (MINUTE / SECOND);
  const totalSeconds = Math.floor((currentSecond - birthMilliseconds) / SECOND);

  return {
    calendar: { years, months, days, hours, minutes, seconds },
    totals: {
      seconds: totalSeconds,
      minutes: Math.floor(totalSeconds / (MINUTE / SECOND)),
      hours: Math.floor(totalSeconds / (HOUR / SECOND)),
      days: Math.floor(totalSeconds / (DAY / SECOND)),
      weeks: Math.floor(totalSeconds / (WEEK / SECOND)),
      months: years * 12 + months,
      years,
    },
  };
}

export function getNextBirthday(birthDate, nowDate = new Date()) {
  const birthMilliseconds = birthDate?.getTime?.();
  const nowMilliseconds = nowDate?.getTime?.();

  if (!Number.isFinite(birthMilliseconds) || !Number.isFinite(nowMilliseconds)) {
    return { error: 'Tanggal lahir tidak valid.' };
  }

  const currentSecond = Math.floor(nowMilliseconds / SECOND) * SECOND;
  if (currentSecond < birthMilliseconds) {
    return { error: 'Belum lahir.' };
  }

  const birth = getWibParts(new Date(birthMilliseconds));
  const now = getWibParts(new Date(currentSecond));
  const currentDate = { ...now, hour: 0, minute: 0, second: 0 };
  let year = now.year;
  let birthday = {
    ...birth,
    year,
    day: Math.min(birth.day, daysInMonth(year, birth.month)),
  };
  let nextMilliseconds = calendarMilliseconds(birthday) - WIB_OFFSET;

  if (nextMilliseconds <= currentSecond) {
    year += 1;
    birthday = {
      ...birth,
      year,
      day: Math.min(birth.day, daysInMonth(year, birth.month)),
    };
    nextMilliseconds = calendarMilliseconds(birthday) - WIB_OFFSET;
  }

  const birthdayDate = { ...birthday, hour: 0, minute: 0, second: 0 };
  const daysUntil = Math.round(
    (calendarMilliseconds(birthdayDate) - calendarMilliseconds(currentDate)) / DAY
  );

  return { date: new Date(nextMilliseconds), daysUntil };
}

export function formatNextBirthday(birthDate, nowDate = new Date()) {
  const nextBirthday = getNextBirthday(birthDate, nowDate);
  if (nextBirthday.error) return nextBirthday.error;
  if (nextBirthday.daysUntil === 0) return 'Ulang tahun hari ini';

  return `${nextBirthdayDateFormatter.format(nextBirthday.date)} · ${formatNumber(nextBirthday.daysUntil)} hari lagi`;
}

export function formatCalendarAge(calendar) {
  return [
    `${calendar.years} tahun`,
    `${calendar.months} bulan`,
    `${calendar.days} hari`,
    `${String(calendar.hours).padStart(2, '0')} jam`,
    `${String(calendar.minutes).padStart(2, '0')} menit`,
    `${String(calendar.seconds).padStart(2, '0')} detik`,
  ].join(' · ');
}

function cardMarkup(person, index) {
  const totals = TOTAL_UNITS
    .map(([unit, label]) => `<div><dt>${label}</dt><dd data-total="${unit}">0</dd></div>`)
    .join('');

  return `
    <article class="person-card" data-person="${person.id}">
      <p class="person-number">${String(index + 1).padStart(2, '0')} · ${person.role.toUpperCase()}</p>
      <h2>${person.name}</h2>
      <p class="birth-date">
        <span class="birth-label">Hari lahir</span>
        <time datetime="${person.birthAt}">
          <strong>${birthDateFormatter.format(new Date(person.birthAt))}</strong>
          <span class="birth-time">pukul ${birthTimeFormatter.format(new Date(person.birthAt))} WIB</span>
        </time>
      </p>
      <p class="next-birthday" data-next-birthday></p>
      <p class="calendar-age" data-age aria-live="polite">Menghitung...</p>
      <details class="totals-disclosure" data-totals-disclosure open>
        <summary>Total umur dalam semua unit</summary>
        <dl class="totals" data-totals>${totals}</dl>
      </details>
    </article>
  `;
}

function render(now = new Date()) {
  const grid = document.querySelector('[data-family-grid]');
  if (!grid) return;

  if (!grid.children.length) {
    grid.innerHTML = PEOPLE.map(cardMarkup).join('');
  }

  document.querySelector('[data-today]').textContent = todayFormatter.format(now);
  document.querySelector('[data-now-time]').textContent = `${nowTimeFormatter.format(now)} WIB`;

  for (const person of PEOPLE) {
    const card = grid.querySelector(`[data-person="${person.id}"]`);
    const result = calculateAge(new Date(person.birthAt), now);
    const nextBirthdayElement = card.querySelector('[data-next-birthday]');
    const ageElement = card.querySelector('[data-age]');
    const totalsDisclosure = card.querySelector('[data-totals-disclosure]');
    const totalsElement = card.querySelector('[data-totals]');

    if (result.error) {
      nextBirthdayElement.textContent = result.error;
      ageElement.textContent = result.error;
      totalsDisclosure.hidden = true;
      continue;
    }

    nextBirthdayElement.textContent = formatNextBirthday(new Date(person.birthAt), now);
    ageElement.textContent = formatCalendarAge(result.calendar);
    totalsDisclosure.hidden = false;
    totalsElement.hidden = false;
    for (const [unit] of TOTAL_UNITS) {
      card.querySelector(`[data-total="${unit}"]`).textContent = formatNumber(result.totals[unit]);
    }
  }
}

if (typeof document !== 'undefined') {
  render();
  setInterval(render, 1000);
}
