'use client';

import { useState } from 'react';
import { MicRecorder } from './components/MicRecorder';
import { ReportCard } from './components/ReportCard';
import { FollowUpDialog } from './components/FollowUpDialog';
import { OnboardingOverlay } from './components/OnboardingOverlay';
import { PushSubscribeButton } from './components/PushSubscribeButton';

type Fields = {
  object: string | null;
  client: string | null;
  budget: string | null;
  reaction: string | null;
  nextStep: string | null;
};

type Recent = {
  id: string;
  fields: Fields;
  status: 'draft' | 'final';
  followUpQuestion: string | null;
  createdAt: string;
};

type ActiveReport = {
  id: string;
  fields: Fields;
  followUpQuestion: string | null;
  maxReached: boolean;
};

export function AgentHome({ firstName, recent }: { firstName: string | null; recent: Recent[] }) {
  const [active, setActive] = useState<ActiveReport | null>(null);

  async function startUpload(fd: FormData) {
    const res = await fetch('/api/reports/transcribe', { method: 'POST', body: fd });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'Transcribe failed');
    }
    const data = await res.json();
    setActive({
      id: data.id,
      fields: data.fields,
      followUpQuestion: data.followUpQuestion,
      maxReached: false,
    });
  }

  return (
    <>
      <OnboardingOverlay firstName={firstName} />

      {!active && (
        <div className="space-y-6">
          <MicRecorder onUpload={startUpload} />
          <div className="flex items-center justify-between">
            <PushSubscribeButton />
            <a href="/agent/training" className="text-xs text-brand-500 underline">
              SPIN-тренажёр →
            </a>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Последние показы</h2>
            {recent.length === 0 ? (
              <p className="mt-2 text-neutral-500">
                Здесь появятся ваши показы. Нажмите кнопку выше, чтобы начать.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {recent.map((r) => (
                  <li key={r.id} className="rounded-lg border bg-white p-3 text-sm">
                    <div className="font-medium">{r.fields?.object || '—'}</div>
                    <div className="text-neutral-500">
                      {r.fields?.client || '—'} · {r.fields?.budget || '—'} ·{' '}
                      {r.status === 'final' ? '✓' : 'черновик'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {active && active.followUpQuestion && !active.maxReached && (
        <div className="space-y-4">
          <ReportCard reportId={active.id} initialFields={active.fields} />
          <FollowUpDialog
            reportId={active.id}
            question={active.followUpQuestion}
            onAnswered={(d) =>
              setActive({
                id: active.id,
                fields: d.fields,
                followUpQuestion: d.followUpQuestion,
                maxReached: d.maxReached,
              })
            }
          />
        </div>
      )}

      {active && (!active.followUpQuestion || active.maxReached) && (
        <ReportCard reportId={active.id} initialFields={active.fields} />
      )}
    </>
  );
}
