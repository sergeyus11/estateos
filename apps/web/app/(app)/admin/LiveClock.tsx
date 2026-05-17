'use client';

import { useEffect, useState } from 'react';

function nowMSK() {
  const d = new Date();
  const fmt = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
    hour12: false,
  });
  // formatToParts → ['HH', ':', 'MM']
  const parts = fmt.formatToParts(d);
  const hh = parts.find((p) => p.type === 'hour')?.value ?? '--';
  const mm = parts.find((p) => p.type === 'minute')?.value ?? '--';
  return { hh, mm };
}

export function LiveClock() {
  const [{ hh, mm }, setT] = useState(nowMSK);

  useEffect(() => {
    const t = setInterval(() => setT(nowMSK()), 1000);
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
