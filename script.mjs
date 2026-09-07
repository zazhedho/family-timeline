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

function cardMarkup(person, displayRole = person.role) {
  const totals = TOTAL_UNITS
    .map(([unit, label]) => `<div><dt>${label}</dt><dd data-total="${unit}">0</dd></div>`)
    .join('');

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
      <div class="calendar-age" data-age role="timer" aria-live="off" aria-label="Menghitung umur">
        <div aria-hidden="true">
          <p class="age-years"><span data-age-unit="years">0</span> <span class="age-year-label">tahun</span></p>
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
      <p class="age-error" data-age-error hidden></p>
      <details class="totals-disclosure" data-totals-disclosure>
        <summary>
          <span class="totals-summary-copy">
            <span class="totals-summary-title">Rincian total umur</span>
            <span class="totals-summary-hint">6 satuan waktu</span>
          </span>
          <span class="totals-summary-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" focusable="false">
              <path d="m5 7.5 5 5 5-5" />
            </svg>
          </span>
        </summary>
        <dl class="totals" data-totals>${totals}</dl>
      </details>
    </article>
  `;
}

function childRole(index, total) {
  if (total === 1) return 'Anak';
  return `Anak ${CHILD_ORDINALS[index] ?? `ke-${index + 1}`}`;
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

function render(now = new Date()) {
  const grid = document.querySelector('[data-family-grid]');
  if (!grid) return;

  if (!grid.children.length) {
    const parents = PEOPLE.filter((person) => ['papa', 'mama'].includes(person.id));
    const children = PEOPLE.filter((person) => !['papa', 'mama'].includes(person.id));
    grid.innerHTML = `
      <svg class="family-connections" aria-hidden="true"></svg>
      <p class="generation-label">Orang tua</p>
      <div class="parents-row" role="group" aria-label="Orang tua">${parents.map((person) => cardMarkup(person)).join('')}</div>
      <div class="family-heart" aria-hidden="true">♡</div>
      <p class="generation-label">Anak-anak</p>
      <div class="children-row" role="group" aria-label="Anak-anak">${children.map((person, index) => cardMarkup(person, childRole(index, children.length))).join('')}</div>`;
    const observer = new ResizeObserver(() => drawConnections(grid));
    observer.observe(grid);
    grid.querySelectorAll('.person-card').forEach((card) => observer.observe(card));
    grid.querySelectorAll('[data-totals-disclosure]').forEach(setupTotalsDisclosure);
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
      ageElement.hidden = true;
      card.querySelector('[data-age-error]').hidden = false;
      card.querySelector('[data-age-error]').textContent = result.error;
      totalsDisclosure.hidden = true;
      continue;
    }

    nextBirthdayElement.textContent = formatNextBirthday(new Date(person.birthAt), now);
    ageElement.hidden = false;
    card.querySelector('[data-age-error]').hidden = true;
    ageElement.setAttribute('aria-label', formatCalendarAge(result.calendar));
    for (const [unit, value] of Object.entries(result.calendar)) {
      card.querySelector(`[data-age-unit="${unit}"]`).textContent =
        ['hours', 'minutes', 'seconds'].includes(unit) ? String(value).padStart(2, '0') : formatNumber(value);
    }
    totalsDisclosure.hidden = false;
    totalsElement.hidden = false;
    for (const [unit] of TOTAL_UNITS) {
      const total = card.querySelector(`[data-total="${unit}"]`);
      total.dataset.countValue = result.totals[unit];
      if (!totalsDisclosure.open) {
        total.textContent = '0';
      } else if (!totalsDisclosure.dataset.counting) {
        total.textContent = formatNumber(result.totals[unit]);
      }
    }
  }
}

function drawConnections(grid) {
  const origin = grid.getBoundingClientRect();
  const bounds = (element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height };
  };
  const parents = [...grid.querySelectorAll('.parents-row .person-card')].map(bounds);
  const children = [...grid.querySelectorAll('.children-row .person-card')].map(bounds);
  const heart = bounds(grid.querySelector('.family-heart'));
  const center = heart.x + heart.width / 2;
  const junction = heart.y + heart.height / 2;
  const paths = [];
  if (matchMedia('(max-width: 820px)').matches) {
    const cards = [...parents, ...children];
    if (cards.length) paths.push(`M ${center} ${cards[0].y + 44} V ${cards.at(-1).y + 44}`);
    cards.forEach((card) => paths.push(`M ${center} ${card.y + 24} Q ${center} ${card.y + 44} ${card.x} ${card.y + 44}`));
  } else {
    parents.forEach((card, index) => {
      const edge = index === 0 ? card.x + card.width : card.x;
      const bend = center + (index === 0 ? -16 : 16);
      paths.push(`M ${edge} ${card.y + 48} H ${bend} Q ${center} ${card.y + 48} ${center} ${card.y + 64} V ${junction}`);
    });
    children.forEach((card) => {
      const x = card.x + card.width / 2;
      paths.push(`M ${center} ${junction} C ${center} ${card.y - 24}, ${x} ${card.y - 24}, ${x} ${card.y}`);
    });
  }
  grid.querySelector('.family-connections').innerHTML = paths.map((d) => `<path d="${d}" />`).join('');
}

if (typeof document !== 'undefined') {
  render();
  setInterval(render, 1000);
}
