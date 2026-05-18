'use client';

import Link from 'next/link';
import type { AgendaEvent } from '@estateos/db';

type Props = {
  event: AgendaEvent;
  clientName: string | null;
  objectTitle: string | null;
  nowIso: string;
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function statusLabel(event: AgendaEvent, nowIso: string): string {
  const nowMs = new Date(nowIso).getTime();
  const startsAt = toDate(event.scheduledAt).getTime();
  const endsAt = startsAt + event.durationMin * 60 * 1000;

  if (endsAt < nowMs) return 'Сейчас · завершено';
  if (startsAt <= nowMs && endsAt >= nowMs) return 'Сейчас · идёт';

  const minutes = Math.max(0, Math.ceil((startsAt - nowMs) / 60000));
  return `Сейчас · через ${minutes} мин`;
}

export function HeroNow({ event, clientName, objectTitle, nowIso }: Props) {
  const href = `/agent/event/${event.id}`;
  const meta = [clientName, event.address].filter(Boolean).join(' · ');

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, var(--brand-50), #F6E0D2)',
        border: '1px solid var(--brand-100)',
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div
        style={{
          color: 'var(--brand-700)',
          fontFamily: 'var(--mono)',
          fontSize: 12,
          letterSpacing: 0,
          textTransform: 'uppercase',
        }}
      >
        {statusLabel(event, nowIso)}
      </div>
      <div style={{ color: 'var(--ink)', fontSize: 20, fontWeight: 600, marginTop: 8 }}>
        {objectTitle || event.title}
      </div>
      {meta && (
        <div style={{ color: 'var(--ink-3)', fontSize: 14, marginTop: 6 }}>
          {meta}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <Link
          href={href as never}
          style={{
            background: 'var(--brand-500, #C8613A)',
            borderRadius: 12,
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            padding: '10px 14px',
            textDecoration: 'none',
          }}
        >
          Еду →
        </Link>
        <Link
          href={href as never}
          style={{
            background: 'transparent',
            border: '1px solid var(--brand-100)',
            borderRadius: 12,
            color: 'var(--ink)',
            fontSize: 14,
            fontWeight: 500,
            padding: '10px 14px',
            textDecoration: 'none',
          }}
        >
          Открыть
        </Link>
      </div>
    </section>
  );
}
