'use client';

import { useEffect, useState } from 'react';

type Parts = { hh: string; mm: string };

function nowInZone(timeZone?: string): Parts {
  const d = new Date();
  const fmt = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
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

/** Локальное время браузера. SSR-плейсхолдер `--:--` чтобы не было mismatch. */
export function LiveClock() {
  const [mounted, setMounted] = useState(false);
  const [{ hh, mm }, setT] = useState<Parts>({ hh: '--', mm: '--' });

  useEffect(() => {
    setMounted(true);
    const tick = () => setT(nowInZone());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="live-clock" suppressHydrationWarning>
      {mounted ? hh : '--'}
      <span className="live-clock__colon" aria-hidden="true">:</span>
      {mounted ? mm : '--'}
    </span>
  );
}

/** Маленький badge «МСК HH:MM» (head плитки).
 *  Не рендерится:
 *    - до hydration (SSR placeholder)
 *    - если у пользователя браузерное TZ == МСК (дубль с LocalTimezoneLabel)
 */
export function MoscowTimeBadge() {
  const [mounted, setMounted] = useState(false);
  const [{ hh, mm }, setT] = useState<Parts>({ hh: '--', mm: '--' });
  const [isMsk, setIsMsk] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMsk(browserTzAbbrev() === 'МСК');
    const tick = () => setT(nowInZone('Europe/Moscow'));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  if (!mounted || isMsk) return null;

  return (
    <span className="msk-badge" suppressHydrationWarning title="Московское время">
      <span className="msk-badge__label">МСК</span>
      {hh}<span className="live-clock__colon" aria-hidden="true">:</span>{mm}
    </span>
  );
}

/** Local TZ suffix («МСК» / «UTC+3» / «UTC-5») рядом с large time. SSR-skip. */
export function LocalTimezoneLabel() {
  const [tz, setTz] = useState<string>('');
  useEffect(() => setTz(browserTzAbbrev()), []);
  if (!tz) return null;
  return <span className="kpi__value-suffix">{tz}</span>;
}
