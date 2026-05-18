'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MicRecorder } from '../../components/MicRecorder';
import { FollowUpDialog } from '../../components/FollowUpDialog';
import type { AgendaEvent, ShowReport } from '@estateos/db';

type NumericValue = number | string | null;

type Row = {
  e: AgendaEvent;
  clientName: string | null;
  clientPhone: string | null;
  clientBudgetMin: NumericValue;
  clientBudgetMax: NumericValue;
  objectTitle: string | null;
  objectAddress: string | null;
  objectPrice: NumericValue;
};

type DynamicFields = Record<string, unknown>;

type TranscribeResult = {
  id: string;
  transcript: string;
  fields: DynamicFields;
  missing: string[];
  followUpQuestion: string | null;
};

const TYPE_LABELS: Record<AgendaEvent['eventType'], string> = {
  showing: 'Показ',
  meeting: 'Встреча',
  call: 'Звонок',
  task: 'Задача',
};

const TYPE_COLORS: Record<AgendaEvent['eventType'], { background: string; color: string }> = {
  showing: { background: 'var(--brand-50)', color: 'var(--brand-700)' },
  meeting: { background: '#F0E8F7', color: '#6B4F8E' },
  call: { background: '#E8F1E5', color: '#4E7A3C' },
  task: { background: '#FAF1DD', color: '#8A6B1F' },
};

const FIELD_LABELS: Record<string, string> = {
  object: 'Объект',
  client: 'Клиент',
  budget: 'Бюджет',
  reaction: 'Реакция',
  nextStep: 'След. шаг',
  topic: 'Тема',
  decisions: 'Договорились',
  result: 'Результат',
  summary: 'Итого',
  followUp: 'Follow-up',
};

function statusText(status: AgendaEvent['status']): string {
  switch (status) {
    case 'planned':
      return 'планируется';
    case 'in_progress':
      return 'идёт';
    case 'done':
      return 'завершено';
    case 'cancelled':
      return 'отменено';
    default:
      return status;
  }
}

function formatTime(dt: Date | string): string {
  const d = dt instanceof Date ? dt : new Date(dt);
  return d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
}

function toNumber(value: NumericValue): number | null {
  if (value === null) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMillions(value: NumericValue): string | null {
  const amount = toNumber(value);
  if (amount === null) return null;
  return `${(amount / 1_000_000).toFixed(1)} М`;
}

function formatBudget(min: NumericValue, max: NumericValue): string | null {
  const minAmount = toNumber(min);
  const maxAmount = toNumber(max);
  if (minAmount === null && maxAmount === null) return null;
  if (minAmount !== null && maxAmount !== null) {
    return `${(minAmount / 1_000_000).toFixed(1)}-${(maxAmount / 1_000_000).toFixed(1)} М`;
  }
  if (maxAmount !== null) return `до ${(maxAmount / 1_000_000).toFixed(1)} М`;
  return `от ${(minAmount! / 1_000_000).toFixed(1)} М`;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'да' : 'нет';
  return String(value);
}

function DynamicReportCard({
  reportId,
  initialFields,
  readOnly,
}: {
  reportId: string;
  initialFields: DynamicFields;
  readOnly?: boolean;
}) {
  const [fields, setFields] = useState<DynamicFields>(initialFields);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields, status: 'final' }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border bg-white p-4">
      <h3 className="text-base font-semibold">Карточка отчёта</h3>
      <dl className="space-y-2">
        {Object.entries(fields).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <dt className="text-xs uppercase tracking-wide text-neutral-400">
              {FIELD_LABELS[key] ?? key}
            </dt>
            <dd>
              {readOnly ? (
                <span className="text-sm text-neutral-800">{displayValue(value) || '—'}</span>
              ) : (
                <input
                  type="text"
                  value={displayValue(value)}
                  onChange={(e) =>
                    setFields({
                      ...fields,
                      [key]: e.target.value || null,
                    })
                  }
                  placeholder="—"
                  className="w-full rounded border-0 bg-transparent px-0 py-1 text-sm outline-none focus:rounded-md focus:bg-yellow-50 focus:px-2"
                />
              )}
            </dd>
          </div>
        ))}
      </dl>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!readOnly && !saved && (
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{ background: 'var(--brand-500)', color: '#fff' }}
          className="w-full rounded-lg px-6 py-3 font-medium disabled:opacity-50"
        >
          {saving ? 'Сохраняю...' : 'Сохранить отчёт'}
        </button>
      )}
      {saved && (
        <p className="text-center text-sm font-medium" style={{ color: 'var(--brand-700)' }}>
          Отчёт сохранён
        </p>
      )}
    </div>
  );
}

export function EventBody({ row, existingReport }: { row: Row; existingReport: ShowReport | null }) {
  const [draft, setDraft] = useState<TranscribeResult | null>(null);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const router = useRouter();

  const typeColors = TYPE_COLORS[row.e.eventType];
  const typeLabel = TYPE_LABELS[row.e.eventType];
  const title = row.objectTitle || row.e.title;
  const budget = formatBudget(row.clientBudgetMin, row.clientBudgetMax);
  const objectPrice = formatMillions(row.objectPrice);

  async function handleUpload(fd: FormData) {
    fd.append('event_id', row.e.id);
    fd.append('event_type', row.e.eventType);
    const res = await fetch('/api/reports/transcribe', { method: 'POST', body: fd });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Transcribe failed');
    }
    const data = (await res.json()) as TranscribeResult;
    setDraft(data);
    if (data.followUpQuestion) {
      setFollowUpOpen(true);
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <section
        style={{
          background: 'linear-gradient(135deg, var(--brand-50), #F6E0D2)',
          border: '1px solid var(--brand-100)',
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span
            style={{
              background: typeColors.background,
              borderRadius: 20,
              color: typeColors.color,
              fontSize: 12,
              fontWeight: 600,
              padding: '2px 10px',
            }}
          >
            {typeLabel} · {statusText(row.e.status)}
          </span>
        </div>
        <h1 className="mb-2 text-xl font-bold text-neutral-900">{title}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-neutral-600">
          <span>
            <span className="font-medium">Начало:</span> {formatTime(row.e.scheduledAt)}
          </span>
          {row.clientName && (
            <span>
              <span className="font-medium">Клиент:</span> {row.clientName}
            </span>
          )}
          {budget && (
            <span>
              <span className="font-medium">Бюджет:</span> {budget}
            </span>
          )}
          {objectPrice && (
            <span>
              <span className="font-medium">Цена:</span> {objectPrice}
            </span>
          )}
          {row.clientPhone && (
            <a
              href={`tel:${row.clientPhone}`}
              style={{ color: 'var(--brand-700)' }}
              className="font-medium"
            >
              {row.clientPhone}
            </a>
          )}
        </div>
        {(row.objectAddress || row.e.address) && (
          <p className="mt-3 text-sm text-neutral-500">{row.objectAddress || row.e.address}</p>
        )}
        {row.e.notes && <p className="mt-3 text-sm italic text-neutral-500">{row.e.notes}</p>}
      </section>

      {existingReport ? (
        <div className="space-y-2">
          <p className="text-sm font-medium" style={{ color: 'var(--brand-700)' }}>
            Отчёт сохранён
          </p>
          <DynamicReportCard
            reportId={existingReport.id}
            initialFields={existingReport.fields as DynamicFields}
            readOnly
          />
        </div>
      ) : draft ? (
        <div className="space-y-3">
          <DynamicReportCard reportId={draft.id} initialFields={draft.fields} />
          {followUpOpen && draft.followUpQuestion && (
            <FollowUpDialog
              reportId={draft.id}
              question={draft.followUpQuestion}
              onAnswered={(data) => {
                setDraft({
                  ...draft,
                  fields: data.fields,
                  followUpQuestion: data.followUpQuestion,
                });
                setFollowUpOpen(Boolean(data.followUpQuestion && !data.maxReached));
                router.refresh();
              }}
            />
          )}
        </div>
      ) : (
        <div
          style={{
            background: '#fff',
            border: '2px dashed var(--brand-300)',
            borderRadius: 16,
            padding: 22,
          }}
        >
          <p className="mb-4 text-center text-sm text-neutral-500">Запишите голосовой отчёт</p>
          <div className="mx-auto max-w-xs">
            <MicRecorder onUpload={handleUpload} buttonLabel="Начать запись" />
          </div>
        </div>
      )}
    </div>
  );
}
