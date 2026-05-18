'use client';

import type { Client, AgendaEvent, ShowReport } from '@estateos/db';
import { initials, avatarGradient, StatusChip } from '../_shared';

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const EVENT_LABELS: Record<string, string> = {
  showing: 'Показ',
  meeting: 'Встреча',
  call: 'Звонок',
  task: 'Задача',
};

export function ClientCardBody({
  client,
  events,
  reports,
}: {
  client: Client;
  events: AgendaEvent[];
  reports: ShowReport[];
}) {
  const allHistory = [
    ...events.map((event) => ({
      type: 'event' as const,
      date: event.scheduledAt,
      title: `${EVENT_LABELS[event.eventType] ?? event.eventType}: ${event.title}`,
      sub: event.status,
      id: event.id,
    })),
    ...reports.map((report) => ({
      type: 'report' as const,
      date: report.createdAt,
      title: `Отчёт: ${report.fields?.object ?? '—'}`,
      sub: report.status,
      id: report.id,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const prefs = Array.isArray(client.preferences) ? (client.preferences as string[]) : [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div
          className="agent-avatar"
          style={{
            width: 56,
            height: 56,
            fontSize: 18,
            flexShrink: 0,
            background: avatarGradient(client.name),
          }}
        >
          {initials(client.name)}
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
            {client.name}
          </h1>
          <div style={{ marginTop: 6 }}>
            <StatusChip status={client.status} />
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'linear-gradient(180deg, #F0EBF6 0%, #E6DEF0 100%)',
          border: '1px solid #D4C5E3',
          borderRadius: 14,
          padding: '16px 18px',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontFamily: 'var(--mono)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#6B4F8E',
            }}
          >
            AI · резюме
          </span>
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: '#9B85B8' }}>
            {client.aiSummaryUpdatedAt
              ? new Date(client.aiSummaryUpdatedAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                })
              : 'не сгенерировано'}
          </span>
        </div>
        <p
          style={{
            fontSize: 14,
            color: '#4A3566',
            margin: 0,
            fontStyle: client.aiSummary ? 'normal' : 'italic',
          }}
        >
          {client.aiSummary ?? 'AI-резюме будет готово после следующего события.'}
        </p>
        {prefs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {prefs.map((preference, index) => (
              <span
                key={`${preference}-${index}`}
                style={{
                  fontSize: 11,
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: 'rgba(107, 79, 142, 0.12)',
                  color: '#6B4F8E',
                  fontFamily: 'var(--mono)',
                }}
              >
                {preference}
              </span>
            ))}
          </div>
        )}
      </div>

      {(client.phone || client.email || client.telegram) && (
        <div className="surface-card" style={{ padding: '14px 16px', marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontFamily: 'var(--mono)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-3)',
              marginBottom: 10,
            }}
          >
            Контакты
          </div>
          {client.phone && (
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 4 }}>
              Тел: {client.phone}
            </div>
          )}
          {client.email && (
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 4 }}>
              Email: {client.email}
            </div>
          )}
          {client.telegram && (
            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>TG: {client.telegram}</div>
          )}
        </div>
      )}

      {(client.budgetMin !== null || client.budgetMax !== null) && (
        <div className="surface-card" style={{ padding: '14px 16px', marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontFamily: 'var(--mono)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-3)',
              marginBottom: 6,
            }}
          >
            Бюджет
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink)' }}>
            {client.budgetMin !== null &&
              `от ${Number(client.budgetMin).toLocaleString('ru-RU')} ₽`}
            {client.budgetMin !== null && client.budgetMax !== null && ' — '}
            {client.budgetMax !== null &&
              `до ${Number(client.budgetMax).toLocaleString('ru-RU')} ₽`}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            fontSize: 10,
            fontFamily: 'var(--mono)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--ink-3)',
            marginBottom: 12,
          }}
        >
          История · {allHistory.length}{' '}
          {allHistory.length === 1 ? 'событие' : allHistory.length < 5 ? 'события' : 'событий'}
        </div>
        {allHistory.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--ink-3)', fontStyle: 'italic' }}>
            Нет событий или отчётов с этим клиентом.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allHistory.map((history) => (
              <div
                key={`${history.type}-${history.id}`}
                className="surface-card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '8px minmax(0, 1fr) auto',
                  gap: 12,
                  alignItems: 'center',
                  padding: '12px 16px',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--brand-500)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                    {history.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--mono)',
                      color: 'var(--ink-3)',
                      marginTop: 2,
                    }}
                  >
                    {formatDate(history.date)}
                  </div>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--ink-4)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
