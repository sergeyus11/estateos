'use client';

import { useState } from 'react';
import Link from 'next/link';
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
        <div>
          <div className="page-head">
            <div>
              <div className="page-eyebrow">Здравствуйте{firstName ? `, ${firstName}` : ''}</div>
              <h1 className="page-title">Записать показ</h1>
              <p className="page-subtitle">Наговорите 1–2 минуты — EstateOS соберёт отчёт сам.</p>
            </div>
            <PushSubscribeButton />
          </div>

          <div className="surface-card" style={{ padding: 24, marginBottom: 22 }}>
            <MicRecorder onUpload={startUpload} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="page-eyebrow">Последние показы</div>
            <Link href={'/agent/training' as never} style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--brand-500)' }}>
              SPIN-тренажёр →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="surface-card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              Здесь появятся ваши показы. Нажмите кнопку выше, чтобы начать.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recent.map((r) => {
                const final = r.status === 'final';
                return (
                  <div key={r.id} className="surface-card" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{r.fields?.object || '— объект —'}</div>
                      <span
                        style={{
                          fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.08em', textTransform: 'uppercase',
                          padding: '2px 7px', borderRadius: 999,
                          background: final ? 'rgba(122,158,107,0.15)' : 'var(--bg-soft)',
                          color: final ? 'var(--success)' : 'var(--ink-3)',
                        }}
                      >
                        {final ? 'финал' : 'черновик'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                      {r.fields?.client || '—'} · {r.fields?.budget || '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {active && active.followUpQuestion && !active.maxReached && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
