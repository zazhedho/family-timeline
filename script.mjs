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
const weddingDateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const dayMonthFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'long',
});
const nowTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export const PEOPLE = [
  { id: 'papa', role: 'Daddy', name: 'Zaidus Zhuhur', birthAt: '1996-03-02T10:00:00+07:00' },
  { id: 'mama', role: 'Mommy', name: 'Zaqia Khana Meriza', birthAt: '1997-09-18T00:30:00+07:00' },
  { id: 'anak', role: 'Anak', name: 'Zeia Elora Zhane', birthAt: '2026-09-02T09:30:00+07:00' },
];

export const WEDDING = { at: '2025-04-27T15:00:00+07:00' };

const TOTAL_UNITS = [
  ['months', 'Total bulan'],
  ['weeks', 'Total minggu'],
  ['days', 'Total hari'],
  ['hours', 'Total jam'],
  ['minutes', 'Total menit'],
  ['seconds', 'Total detik'],
];

const CHILD_ORDINALS = ['pertama', 'kedua', 'ketiga', 'keempat', 'kelima'];

export function formatNumber(value) {
  return numberFormatter.format(value);
}

export function interpolateCount(target, progress) {
  const boundedProgress = Math.min(Math.max(progress, 0), 1);
  return Math.floor(target * (1 - (1 - boundedProgress) ** 3));
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
  let birthdayDate = { ...birthday, hour: 0, minute: 0, second: 0 };

  // The whole WIB calendar day of the birthday counts as "today".
  if (calendarMilliseconds(birthdayDate) < calendarMilliseconds(currentDate)) {
    year += 1;
    birthday = {
      ...birth,
      year,
      day: Math.min(birth.day, daysInMonth(year, birth.month)),
    };
    birthdayDate = { ...birthday, hour: 0, minute: 0, second: 0 };
  }

  const nextMilliseconds = calendarMilliseconds(birthday) - WIB_OFFSET;
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

export function formatWeddingDate(date) {
  return weddingDateFormatter.format(date);
}

export function formatWeddingTime(date) {
  return `pukul ${birthTimeFormatter.format(date)} WIB`;
}

export function getNextAnniversary(weddingDate, nowDate = new Date()) {
  const next = getNextBirthday(weddingDate, nowDate);
  if (next.error) return next;

  const ordinal = getWibParts(next.date).year - getWibParts(weddingDate).year;
  return { ...next, ordinal };
}

export function formatNextAnniversary(weddingDate, nowDate = new Date()) {
  const next = getNextAnniversary(weddingDate, nowDate);
  if (next.error) return next.error;
  if (next.daysUntil === 0) return `Anniversary ke-${next.ordinal} hari ini`;

  return `Anniversary ke-${next.ordinal} · ${nextBirthdayDateFormatter.format(next.date)} · ${formatNumber(next.daysUntil)} hari lagi`;
}

export function coupleTitle(people) {
  const firstName = (id) => people.find((person) => person.id === id)?.name.split(' ')[0];
  return `${firstName('papa')} & ${firstName('mama')}`;
}

const CELEBRATION_DAYS = 3;

function isAnniversaryOf(eventParts, date) {
  return date.year > eventParts.year
    && date.month === eventParts.month
    && date.day === Math.min(eventParts.day, daysInMonth(date.year, eventParts.month));
}

export function getCelebrations(people, wedding, nowDate = new Date()) {
  const events = [
    ...people.map((person) => ({ kind: 'birthday', id: person.id, at: person.birthAt })),
    ...(wedding ? [{ kind: 'anniversary', id: 'wedding', at: wedding.at }] : []),
  ];
  const now = getWibParts(nowDate);
  const today = calendarMilliseconds({ ...now, hour: 0, minute: 0, second: 0 });
  const celebrations = [];

  for (let offset = 0; offset < CELEBRATION_DAYS; offset += 1) {
    const shifted = new Date(today - offset * DAY);
    const date = {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
    };

    for (const event of events) {
      const eventParts = getWibParts(new Date(event.at));
      if (isAnniversaryOf(eventParts, date)) {
        celebrations.push({
          kind: event.kind,
          id: event.id,
          ordinal: date.year - eventParts.year,
          day: offset + 1,
        });
      }
    }
  }

  return celebrations;
}

export function celebrationKey(celebrations) {
  return celebrations
    .map(({ kind, id, ordinal, day }) => `${kind}:${id}:${ordinal}:${day}`)
    .join('|');
}

export function celebrationCopy(celebration, people) {
  const { kind, id, ordinal, day } = celebration;
  const isToday = day === 1;
  const badge = isToday ? 'HARI INI!' : `HARI KE-${day}`;
  const dayDetail = `hari ke-${day} dari ${CELEBRATION_DAYS}`;

  if (kind === 'anniversary') {
    const lead = `${isToday ? 'Happy' : 'Masih merayakan'} Anniversary ke-${ordinal}, `;
    const tap = 'ketuk untuk lihat kartu';
    return {
      titleParts: [lead, 'Daddy & Mommy', isToday ? '!' : ''],
      detail: isToday
        ? `${dayMonthFormatter.format(new Date(WEDDING.at))} · hari ini · ${tap}`
        : `${dayDetail} · ${tap}`,
      badge,
    };
  }

  const person = people.find((member) => member.id === id);
  const age = ordinal === 1 ? 'pertama' : `ke-${ordinal}`;
  return {
    titleParts: [
      `${isToday ? 'Selamat' : 'Masih merayakan'} ulang tahun ${age}, `,
      person.name.split(' ')[0],
      isToday ? '!' : '',
    ],
    detail: isToday ? `${dayMonthFormatter.format(new Date(person.birthAt))} · hari ini` : dayDetail,
    badge,
  };
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

function ageMarkup(yearLabel, label) {
  return `
      <div class="calendar-age" data-age role="timer" aria-live="off" aria-label="${label}">
        <div aria-hidden="true">
          <p class="age-years"><span data-age-unit="years">0</span> <span class="age-year-label">${yearLabel}</span> <span class="heartbeat-dot" title="Detak kehidupan" aria-hidden="true"></span></p>
          <p class="age-remainder"><span data-age-unit="months">0</span> bulan <span class="age-dot">·</span> <span data-age-unit="days">0</span> hari</p>
          <div class="age-clock">
            <div><span class="age-clock-value" data-age-unit="hours">00</span><span class="age-clock-label">jam</span></div>
            <span class="age-clock-separator">:</span>
            <div><span class="age-clock-value" data-age-unit="minutes">00</span><span class="age-clock-label">menit</span></div>
            <span class="age-clock-separator">:</span>
            <div><span class="age-clock-value" data-age-unit="seconds">00</span><span class="age-clock-label">detik</span></div>
          </div>
        </div>
      </div>
      <p class="age-error" data-age-error hidden></p>`;
}

function totalsMarkup(title) {
  const totals = TOTAL_UNITS
    .map(([unit, label]) => `<div><dt>${label}</dt><dd data-total="${unit}">0</dd></div>`)
    .join('');

  return `
      <details class="totals-disclosure" data-totals-disclosure>
        <summary>
          <span class="totals-summary-copy">
            <span class="totals-summary-title">${title}</span>
            <span class="totals-summary-hint">Rincian 6 satuan waktu</span>
          </span>
          <span class="totals-summary-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" focusable="false">
              <path d="m5 7.5 5 5 5-5" />
            </svg>
          </span>
        </summary>
        <dl class="totals" data-totals>${totals}</dl>
      </details>`;
}

function cardMarkup(person, displayRole = person.role) {
  return `
    <article class="person-card" data-person="${person.id}">
      <p class="person-role">${displayRole}</p>
      <h2>${person.name}</h2>
      <p class="birth-date">
        <span class="birth-label">Hari lahir</span>
        <time datetime="${person.birthAt}">
          <strong>${birthDateFormatter.format(new Date(person.birthAt))}</strong>
          <span class="birth-time">pukul ${birthTimeFormatter.format(new Date(person.birthAt))} WIB</span>
        </time>
      </p>
      <p class="next-birthday" data-next-birthday></p>
      ${ageMarkup('tahun', 'Menghitung umur')}
      ${totalsMarkup('Jejak Waktu yang Dilalui')}
    </article>
  `;
}

function heartMarkup() {
  const weddingAt = new Date(WEDDING.at);

  return `
      <div class="family-heart-wrap">
        <button type="button" class="family-heart" data-wedding-open aria-haspopup="dialog" aria-label="Lihat kartu pernikahan Daddy dan Mommy">♡</button>
        <span class="family-heart-caption" data-wedding-open aria-hidden="true">Menikah ${nextBirthdayDateFormatter.format(weddingAt)} · lihat</span>
      </div>`;
}

function weddingDialogMarkup() {
  const weddingAt = new Date(WEDDING.at);

  return `
    <dialog class="wedding-dialog" data-wedding-dialog aria-labelledby="wedding-title">
      <article class="wedding-card" data-wedding-card>
        <span class="wedding-grab" aria-hidden="true"></span>
        <button type="button" class="wedding-close" data-wedding-close aria-label="Tutup">✕</button>
        <p class="person-role">Ikatan Kasih</p>
        <h2 id="wedding-title">${coupleTitle(PEOPLE)}</h2>
        <p class="birth-date wedding-date">
          <span class="birth-label">Hari pernikahan</span>
          <time datetime="${WEDDING.at}">
            <strong>${formatWeddingDate(weddingAt)}</strong>
            <span class="birth-time">${formatWeddingTime(weddingAt)}</span>
          </time>
        </p>
        <p class="next-birthday" data-next-anniversary></p>
        ${ageMarkup('tahun bersama', 'Menghitung waktu bersama')}
        ${totalsMarkup('Jejak Waktu Bersama')}
      </article>
    </dialog>`;
}

function childRole(index, total) {
  if (total === 1) return 'Buah Hati';
  return `Buah Hati ${CHILD_ORDINALS[index] ?? `ke-${index + 1}`}`;
}

const totalCountFrames = new WeakMap();

function stopTotalCount(disclosure) {
  const frame = totalCountFrames.get(disclosure);
  if (frame) cancelAnimationFrame(frame);
  totalCountFrames.delete(disclosure);
  delete disclosure.dataset.counting;
}

function animateTotals(disclosure) {
  stopTotalCount(disclosure);

  const values = [...disclosure.querySelectorAll('[data-total]')];
  const showFinalValues = () => {
    for (const value of values) {
      value.textContent = formatNumber(Number(value.dataset.countValue));
    }
    totalCountFrames.delete(disclosure);
    delete disclosure.dataset.counting;
  };

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showFinalValues();
    return;
  }

  disclosure.dataset.counting = 'true';
  values.forEach((value) => { value.textContent = '0'; });
  const startedAt = performance.now();
  const duration = 900;

  function update(timestamp) {
    const progress = Math.min((timestamp - startedAt) / duration, 1);
    for (const value of values) {
      value.textContent = formatNumber(
        interpolateCount(Number(value.dataset.countValue), progress)
      );
    }

    if (progress < 1) {
      totalCountFrames.set(disclosure, requestAnimationFrame(update));
    }
    else showFinalValues();
  }

  totalCountFrames.set(disclosure, requestAnimationFrame(update));
}

function setupTotalsDisclosure(disclosure) {
  const summary = disclosure.querySelector('summary');
  let heightAnimation;
  let targetOpen = disclosure.open;

  summary.addEventListener('click', (event) => {
    event.preventDefault();
    targetOpen = !targetOpen;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || typeof disclosure.animate !== 'function') {
      heightAnimation?.cancel();
      disclosure.open = targetOpen;
      disclosure.classList.remove('is-closing');
      if (targetOpen) animateTotals(disclosure);
      else stopTotalCount(disclosure);
      return;
    }

    const startHeight = disclosure.offsetHeight;
    if (targetOpen) {
      disclosure.open = true;
      disclosure.classList.remove('is-closing');
      animateTotals(disclosure);
    } else {
      disclosure.classList.add('is-closing');
      stopTotalCount(disclosure);
    }

    const borderHeight = disclosure.offsetHeight - disclosure.clientHeight;
    const endHeight = targetOpen
      ? disclosure.scrollHeight + borderHeight
      : summary.offsetHeight + borderHeight;

    heightAnimation?.cancel();
    disclosure.style.overflow = 'hidden';
    heightAnimation = disclosure.animate(
      { height: [`${startHeight}px`, `${endHeight}px`] },
      { duration: 360, easing: 'cubic-bezier(.22, 1, .36, 1)' }
    );
    heightAnimation.onfinish = () => {
      disclosure.open = targetOpen;
      disclosure.classList.remove('is-closing');
      disclosure.style.overflow = '';
      heightAnimation = null;
    };
  });
}

function openWeddingDialog() {
  const dialog = document.querySelector('[data-wedding-dialog]');
  if (dialog && !dialog.open) dialog.showModal();
}

function setupWeddingDialog(dialog) {
  setupTotalsDisclosure(dialog.querySelector('[data-totals-disclosure]'));
  dialog.querySelector('[data-wedding-close]').addEventListener('click', () => dialog.close());
  // The card fills the dialog, so a click on the dialog itself is a backdrop click.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-wedding-open]')) openWeddingDialog();
  });
}

function updateAgeBlock(scope, result) {
  const ageElement = scope.querySelector('[data-age]');
  const errorElement = scope.querySelector('[data-age-error]');
  const totalsDisclosure = scope.querySelector('[data-totals-disclosure]');

  ageElement.hidden = Boolean(result.error);
  errorElement.hidden = !result.error;
  totalsDisclosure.hidden = Boolean(result.error);

  if (result.error) {
    errorElement.textContent = result.error;
    return;
  }

  ageElement.setAttribute('aria-label', formatCalendarAge(result.calendar));
  for (const [unit, value] of Object.entries(result.calendar)) {
    scope.querySelector(`[data-age-unit="${unit}"]`).textContent =
      ['hours', 'minutes', 'seconds'].includes(unit) ? String(value).padStart(2, '0') : formatNumber(value);
  }
  for (const [unit] of TOTAL_UNITS) {
    const total = scope.querySelector(`[data-total="${unit}"]`);
    total.dataset.countValue = result.totals[unit];
    if (!totalsDisclosure.open) {
      total.textContent = '0';
    } else if (!totalsDisclosure.dataset.counting) {
      total.textContent = formatNumber(result.totals[unit]);
    }
  }
}

const CONFETTI_COLORS = ['#dca492', '#8fa996', '#dec889', '#c98f7a'];
let renderedCelebrationKey = null;

function celebrationBannerMarkup(celebration) {
  const { titleParts: [lead, name, tail], detail } = celebrationCopy(celebration, PEOPLE);
  const isAnniversary = celebration.kind === 'anniversary';
  const tag = isAnniversary ? 'button' : 'div';
  const attributes = isAnniversary ? ' type="button" data-wedding-open' : '';

  return `
        <${tag} class="celebration-banner"${attributes}>
          <span class="celebration-emoji" aria-hidden="true">${isAnniversary ? '💞' : '🎉'}</span>
          <span class="celebration-copy">
            <strong>${lead.replace(/ke-\d+/, '<span class="celebration-name">$&</span>')}<span class="celebration-name">${name}</span>${tail}</strong>
            <small>${detail}</small>
          </span>
        </${tag}>`;
}

function renderCelebrations(celebrations) {
  const key = celebrationKey(celebrations);
  if (key === renderedCelebrationKey) return;
  renderedCelebrationKey = key;

  document.querySelector('[data-celebrations]').innerHTML = celebrations.map(celebrationBannerMarkup).join('');
  document.querySelectorAll('.person-card').forEach((card) => {
    card.classList.remove('is-celebrating');
    card.querySelector('.celebration-badge')?.remove();
  });
  for (const celebration of celebrations) {
    if (celebration.kind !== 'birthday') continue;
    const card = document.querySelector(`[data-person="${celebration.id}"]`);
    card.classList.add('is-celebrating');
    card.insertAdjacentHTML('afterbegin', `<span class="celebration-badge">${celebrationCopy(celebration, PEOPLE).badge}</span>`);
  }
  document.querySelector('.family-heart')
    .classList.toggle('is-celebrating', celebrations.some(({ kind }) => kind === 'anniversary'));
  document.querySelector('[data-bunting]').hidden = !celebrations.length;
  document.body.toggleAttribute('data-celebrating', celebrations.length > 0);
}

function launchConfetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const count = matchMedia('(max-width: 480px)').matches ? 16 : 40;
  const layer = document.createElement('div');
  layer.className = 'confetti';
  layer.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement('span');
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
    piece.style.animationDelay = `${Math.random() * 1.2}s`;
    piece.style.setProperty('--drift', `${Math.round((Math.random() - 0.5) * 120)}px`);
    piece.style.setProperty('--spin', `${Math.round(360 + Math.random() * 540)}deg`);
    layer.append(piece);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 4200);
}

function render(now = new Date()) {
  const grid = document.querySelector('[data-family-grid]');
  if (!grid) return;

  if (!grid.children.length) {
    const parents = PEOPLE.filter((person) => ['papa', 'mama'].includes(person.id));
    const children = PEOPLE.filter((person) => !['papa', 'mama'].includes(person.id));

    grid.innerHTML = `
      <svg class="family-connections" aria-hidden="true"></svg>
      <p class="generation-label">Awal Mula: Daddy & Mommy</p>
      <div class="parents-row" role="group" aria-label="Orang tua">${parents.map((person) => cardMarkup(person)).join('')}</div>
      ${heartMarkup()}
      <p class="generation-label">Buah Hati Tercinta</p>
      <div class="children-row" role="group" aria-label="Anak-anak">${children.map((person, index) => cardMarkup(person, childRole(index, children.length))).join('')}</div>`;
    const observer = new ResizeObserver(() => drawConnections(grid));
    observer.observe(grid);
    grid.querySelectorAll('.person-card').forEach((card) => observer.observe(card));
    grid.querySelectorAll('[data-totals-disclosure]').forEach(setupTotalsDisclosure);
    grid.insertAdjacentHTML('afterend', weddingDialogMarkup());
    setupWeddingDialog(document.querySelector('[data-wedding-dialog]'));
  }

  document.querySelector('[data-today]').textContent = todayFormatter.format(now);
  document.querySelector('[data-now-time]').textContent = `${nowTimeFormatter.format(now)} WIB`;

  for (const person of PEOPLE) {
    const card = grid.querySelector(`[data-person="${person.id}"]`);
    const result = calculateAge(new Date(person.birthAt), now);
    card.querySelector('[data-next-birthday]').textContent =
      result.error ?? formatNextBirthday(new Date(person.birthAt), now);
    updateAgeBlock(card, result);
  }

  renderCelebrations(getCelebrations(PEOPLE, WEDDING, now));

  const weddingCard = document.querySelector('[data-wedding-card]');
  const weddingAt = new Date(WEDDING.at);
  weddingCard.querySelector('[data-next-anniversary]').textContent = formatNextAnniversary(weddingAt, now);
  updateAgeBlock(weddingCard, calculateAge(weddingAt, now));
}

function drawConnections(grid) {
  const svg = grid.querySelector('.family-connections');
  if (!svg) return;
  const origin = grid.getBoundingClientRect();
  const bounds = (element) => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height };
  };
  const parents = [...grid.querySelectorAll('.parents-row .person-card')].map(bounds).filter(Boolean);
  const children = [...grid.querySelectorAll('.children-row .person-card')].map(bounds).filter(Boolean);
  const heartEl = grid.querySelector('.family-heart');
  const heart = bounds(heartEl);

  if (!heart || !parents.length || !children.length) {
    svg.innerHTML = '';
    return;
  }

  const heartCenterX = heart.x + heart.width / 2;
  const paths = [];

  if (matchMedia('(max-width: 820px)').matches) {
    const cards = [...parents, ...children];
    if (cards.length) {
      paths.push(`M ${heartCenterX} ${cards[0].y + 44} V ${cards.at(-1).y + 44}`);
      cards.forEach((card) => paths.push(`M ${heartCenterX} ${card.y + 24} Q ${heartCenterX} ${card.y + 44} ${card.x} ${card.y + 44}`));
    }
  } else {
    // Desktop: Parents bottom curves smoothly down into Heart, then Heart curves down to Children
    parents.forEach((card) => {
      const cardBottomX = card.x + card.width / 2;
      const cardBottomY = card.y + card.height;
      const midY = (cardBottomY + heart.y) / 2;
      paths.push(`M ${cardBottomX} ${cardBottomY} C ${cardBottomX} ${midY}, ${heartCenterX} ${midY}, ${heartCenterX} ${heart.y}`);
    });

    const streamStartY = heart.y + heart.height;
    children.forEach((card) => {
      const targetX = card.x + card.width / 2;
      const targetY = card.y;
      const midY = (streamStartY + targetY) / 2;
      paths.push(`M ${heartCenterX} ${streamStartY} C ${heartCenterX} ${midY}, ${targetX} ${midY}, ${targetX} ${targetY}`);
    });
  }

  svg.innerHTML = paths.map((d) => `<path d="${d}" />`).join('');
}

if (typeof document !== 'undefined') {
  render();
  // Confetti greets a page load during a celebration; it does not replay at midnight.
  if (document.body.hasAttribute('data-celebrating')) launchConfetti();
  setInterval(render, 1000);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}
