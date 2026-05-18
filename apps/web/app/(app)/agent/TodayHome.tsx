'use client';

import type { AgendaEvent } from '@estateos/db';
import { EventRow } from './components/EventRow';
import { HeroNow } from './components/HeroNow';

type TodayEvent = {
  e: AgendaEvent;
  clientName: string | null;
  objectTitle: string | null;
};

type Props = {
  events: TodayEvent[];
  nowIso: string;
  briefNarrative?: {
    id: string;
    audioPath: string | null;
    narrativeText: string | null;
  } | null;
};

function formatToday(nowIso: string): string {
  return new Date(nowIso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Moscow',
  });
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function eventEndMs(event: AgendaEvent): number {
  return toDate(event.scheduledAt).getTime() + event.durationMin * 60 * 1000;
}

function findHeroEvent(events: TodayEvent[], nowIso: string): TodayEvent | null {
  const nowMs = new Date(nowIso).getTime();
  const afterWindow = nowMs + 90 * 60 * 1000;
  const beforeWindow = nowMs - 5 * 60 * 1000;

  return (
    events.find(({ e }) => {
      const startsAt = toDate(e.scheduledAt).getTime();
      return startsAt <= afterWindow && eventEndMs(e) >= beforeWindow;
    }) ?? null
  );
}

export function TodayHome({ events, nowIso, briefNarrative }: Props) {
  const hero = findHeroEvent(events, nowIso);
  const nowMs = new Date(nowIso).getTime();
  const remainingCount = events.filter(({ e }) => eventEndMs(e) >= nowMs).length;
  const audioUrl = briefNarrative?.audioPath ? `/audio/${briefNarrative.audioPath}` : null;

  return (
    <div>
      {briefNarrative && (
        <section
          aria-label="Утренний разбор"
          style={{
            background: '#f3f0ff',
            border: '1px solid #c4b5fd',
            borderRadius: 8,
            marginBottom: 18,
            padding: 14,
          }}
        >
          <div
            style={{
              color: '#6d5aa8',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            AI · утренний разбор
          </div>
          {audioUrl ? (
            <audio
              controls
              src={audioUrl}
              style={{ display: 'block', width: '100%' }}
            />
          ) : (
            <div style={{ color: 'var(--ink-3)', fontSize: 14 }}>Аудио готовится</div>
          )}
          {briefNarrative.narrativeText && (
            <p
              style={{
                color: 'var(--ink-2)',
                fontSize: 14,
                lineHeight: 1.5,
                margin: '10px 0 0',
              }}
            >
              {briefNarrative.narrativeText}
            </p>
          )}
        </section>
      )}

      <div className="page-head">
        <div>
          <div className="page-eyebrow">{formatToday(nowIso)}</div>
          <h1 className="page-title">Сегодня</h1>
        </div>
      </div>

      {hero && (
        <div style={{ marginBottom: 18 }}>
          <HeroNow
            event={hero.e}
            clientName={hero.clientName}
            objectTitle={hero.objectTitle}
            nowIso={nowIso}
          />
        </div>
      )}

      <section>
        <div
          style={{
            color: 'var(--ink-3)',
            fontFamily: 'var(--mono)',
            fontSize: 12,
            marginBottom: 10,
            textTransform: 'uppercase',
          }}
        >
          До конца дня · {remainingCount}
        </div>

        {events.length === 0 ? (
          <div
            className="surface-card"
            style={{ color: 'var(--ink-3)', fontSize: 14, padding: 24, textAlign: 'center' }}
          >
            Свободно. Нажмите{' '}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
              style={{ display: 'inline-block', verticalAlign: '-1px' }}
            >
              <circle cx="6" cy="6" r="4" fill="currentColor" />
            </svg>{' '}
            для добавления события
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.map(({ e, clientName, objectTitle }) => (
              <EventRow
                key={e.id}
                event={e}
                clientName={clientName}
                objectTitle={objectTitle}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
