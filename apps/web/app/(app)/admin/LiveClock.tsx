'use client';

import { useEffect, useState } from 'react';

type Parts = { hh: string; mm: string };

function nowInZone(timeZone?: string): Parts {
  const d = new Date();
  const fmt = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone, // undefined = local browser zone
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const hh = parts.find((p) => p.type === 'hour')?.value ?? '--';
  const mm = parts.find((p) => p.type === 'minute')?.value ?? '--';
  return { hh, mm };
}

function browserTzAbbrev(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    // Москва даёт «Europe/Moscow» — для неё показываем «МСК», для других — короткий offset «UTC+3»
    if (tz === 'Europe/Moscow') return 'МСК';
    const offsetMin = -new Date().getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '−';
    const hrs = Math.floor(Math.abs(offsetMin) / 60);
    const min = Math.abs(offsetMin) % 60;
    return `UTC${sign}${hrs}${min ? ':' + String(min).padStart(2, '0') : ''}`;
  } catch {
    return '';
  }
}

/** Локальное время браузера, обновляется каждую секунду, с моргающим двоеточием. */
export function LiveClock() {
  const [{ hh, mm }, setT] = useState<Parts>(() => nowInZone());

  useEffect(() => {
    const tick = () => setT(nowInZone());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="live-clock" suppressHydrationWarning>
      {hh}
      <span className="live-clock__colon" aria-hidden="true">:</span>
      {mm}
    </span>
  );
}

/** Короткий бейдж «МСК HH:MM» (или UTC+X), пригоден для top-bar справа сверху. */
export function MoscowTimeBadge() {
  const [{ hh, mm }, setT] = useState<Parts>(() => nowInZone('Europe/Moscow'));
  const [localTz, setLocalTz] = useState<string>('');

  useEffect(() => {
    const tick = () => setT(nowInZone('Europe/Moscow'));
    tick();
    setLocalTz(browserTzAbbrev());
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Если пользователь уже в МСК — не показываем badge (избыточно)
  if (localTz === 'МСК') return null;

  return (
    <span className="msk-badge" suppressHydrationWarning title="Московское время">
      <span className="msk-badge__label">МСК</span>
      {hh}<span className="live-clock__colon" aria-hidden="true">:</span>{mm}
    </span>
  );
}

/** Локальный TZ-suffix для KPI «Сейчас» — «(local)» или название. */
export function LocalTimezoneLabel() {
  const [tz, setTz] = useState<string>('');
  useEffect(() => setTz(browserTzAbbrev()), []);
  if (!tz) return null;
  return <span className="kpi__value-suffix">{tz}</span>;
}
