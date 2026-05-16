'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Fields = {
  object: string | null;
  client: string | null;
  budget: string | null;
  reaction: string | null;
  nextStep: string | null;
};

const LABELS: Record<keyof Fields, string> = {
  object: 'Объект',
  client: 'Клиент',
  budget: 'Бюджет',
  reaction: 'Реакция',
  nextStep: 'След. шаг',
};

export function ReportCard({
  reportId,
  initialFields,
}: {
  reportId: string;
  initialFields: Fields;
}) {
  const [fields, setFields] = useState<Fields>(initialFields);
  const [saving, setSaving] = useState(false);
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
      router.refresh();
      router.push(('/agent?saved=' + reportId) as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-white p-5">
      <h2 className="text-lg font-semibold">Карточка показа</h2>
      <dl className="space-y-2">
        {(Object.keys(LABELS) as Array<keyof Fields>).map((k) => (
          <div key={k} className="flex flex-col">
            <dt className="text-xs uppercase tracking-wide text-neutral-500">{LABELS[k]}</dt>
            <dd>
              <input
                type="text"
                value={fields[k] || ''}
                onChange={(e) => setFields({ ...fields, [k]: e.target.value || null })}
                placeholder="—"
                className="w-full rounded border-0 bg-transparent px-0 py-1 outline-none focus:bg-yellow-50 focus:px-2 focus:rounded-md"
                data-testid={`field-${k}`}
              />
            </dd>
          </div>
        ))}
      </dl>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        data-testid="save"
        className="w-full rounded-lg bg-brand-500 px-6 py-3 text-white font-medium hover:bg-brand-700 disabled:opacity-50"
      >
        {saving ? 'Сохраняю...' : 'Сохранить'}
      </button>
    </div>
  );
}
