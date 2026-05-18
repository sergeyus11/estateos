'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import type { AgendaEvent } from '@estateos/db';

type Props = {
  event: AgendaEvent;
  clientName: string | null;
  objectTitle: string | null;
};

const TYPE_STYLE: Record<AgendaEvent['eventType'], { background: string; color: string }> = {
  showing: { background: 'var(--brand-50)', color: 'var(--brand-700)' },
  meeting: { background: '#F0E8F7', color: '#6B4F8E' },
  call: { background: '#E8F1E5', color: '#4E7A3C' },
  task: { background: '#FAF1DD', color: '#8A6B1F' },
};

function IconSvg({ children }: { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function EventIcon({ eventType }: { eventType: AgendaEvent['eventType'] }) {
  if (eventType === 'meeting') {
    return (
      <IconSvg>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </IconSvg>
    );
  }

  if (eventType === 'call') {
    return (
      <IconSvg>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.92 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </IconSvg>
    );
  }

  if (eventType === 'task') {
    return (
      <IconSvg>
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </IconSvg>
    );
  }

  return (
    <IconSvg>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </IconSvg>
  );
}

function formatTime(date: Date | string): string {
  const value = date instanceof Date ? date : new Date(date);
  return value.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
}

export function EventRow({ event, clientName, objectTitle }: Props) {
  const typeStyle = TYPE_STYLE[event.eventType];
  const iconStyle: CSSProperties = {
    alignItems: 'center',
    background: typeStyle.background,
    borderRadius: 8,
    color: typeStyle.color,
    display: 'flex',
    flexShrink: 0,
    height: 32,
    justifyContent: 'center',
    width: 32,
  };

  return (
    <Link
      href={`/agent/event/${event.id}` as never}
      className="surface-card"
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: 12,
        padding: 12,
        textDecoration: 'none',
      }}
    >
      <div style={iconStyle}>
        <EventIcon eventType={event.eventType} />
      </div>
      <div
        style={{
          color: 'var(--ink)',
          flexShrink: 0,
          fontFamily: 'var(--mono)',
          fontSize: 12,
          minWidth: 44,
        }}
      >
        {formatTime(event.scheduledAt)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: 'var(--ink)',
            fontSize: 14,
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {objectTitle || event.title}
        </div>
        <div
          style={{
            color: 'var(--ink-3)',
            fontSize: 12,
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {clientName || event.address || event.eventType}
        </div>
      </div>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: 'var(--ink-3)', flexShrink: 0 }}
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}
