'use client';

import { useEffect, useMemo, useState } from 'react';

type AgentSettingsResponse = {
  dayOffDate: string | null;
  briefAt: string;
};

const BRIEF_TIMES = ['06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30'];

function todayIsoDate() {
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  return `${byType.get('year')}-${byType.get('month')}-${byType.get('day')}`;
}

export default function AgentSettingsPage() {
  const [dayOffDate, setDayOffDate] = useState<string | null>(null);
  const [briefAt, setBriefAt] = useState('08:30');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const today = useMemo(() => todayIsoDate(), []);
  const isDayOff = dayOffDate === today;

  useEffect(() => {
    let cancelled = false;

    fetch('/api/agent/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AgentSettingsResponse | null) => {
        if (!data || cancelled) return;
        setDayOffDate(data.dayOffDate ?? null);
        setBriefAt(data.briefAt ?? '08:30');
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  async function patch(updates: { dayOffDate?: string | null; briefAt?: string }) {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/agent/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) return;

      const data = (await res.json()) as AgentSettingsResponse;
      setDayOffDate(data.dayOffDate ?? null);
      setBriefAt(data.briefAt ?? '08:30');
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Личный режим</div>
          <h1 className="page-title">Настройки</h1>
          <p className="page-subtitle">Выходной и время утреннего разбора.</p>
        </div>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
        <div className="surface-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>Выходной сегодня</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
                В админке будет видно, что вы недоступны.
              </div>
            </div>
            <button
              type="button"
              onClick={() => patch({ dayOffDate: isDayOff ? null : today })}
              disabled={saving}
              style={{
                width: 48,
                height: 28,
                borderRadius: 999,
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                background: isDayOff ? 'var(--success)' : 'var(--line)',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              aria-label={isDayOff ? 'Выключить выходной' : 'Включить выходной'}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  left: isDayOff ? 24 : 4,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.16)',
                }}
              />
            </button>
          </div>
        </div>

        <div className="surface-card" style={{ padding: 18 }}>
          <label
            htmlFor="brief-at"
            style={{ display: 'block', fontWeight: 600, fontSize: 15, marginBottom: 10, color: 'var(--ink)' }}
          >
            Время утреннего разбора
          </label>
          <select
            id="brief-at"
            value={briefAt}
            onChange={(e) => {
              const next = e.target.value;
              setBriefAt(next);
              void patch({ briefAt: next });
            }}
            disabled={saving}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--line)',
              fontSize: 15,
              color: 'var(--ink)',
              background: '#fff',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {BRIEF_TIMES.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        {saved && (
          <div style={{ color: 'var(--success)', fontSize: 14, textAlign: 'center' }}>
            Сохранено
          </div>
        )}
      </section>
    </div>
  );
}
