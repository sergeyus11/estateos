'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Turn = {
  role: 'agent' | 'client';
  text: string;
  audioUrl: string | null;
  ts: string;
};

type SpinAnalysis = {
  situation: number;
  problem: number;
  implication: number;
  needPayoff: number;
  score: number;
  feedback: string;
};

type Status = 'in_progress' | 'completed' | 'abandoned';

export function SessionPlayer({
  sessionId,
  personaName,
  personaDescription,
  initialTranscript,
  initialStatus,
  initialAnalysis,
}: {
  sessionId: string;
  personaName: string;
  personaDescription: string;
  initialTranscript: Turn[];
  initialStatus: Status;
  initialAnalysis: SpinAnalysis | null;
}) {
  const router = useRouter();
  const [transcript, setTranscript] = useState<Turn[]>(initialTranscript);
  const [status, setStatus] = useState<Status>(initialStatus);
  const [analysis, setAnalysis] = useState<SpinAnalysis | null>(initialAnalysis);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript.length]);

  async function sendTurn() {
    if (!input.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/training/sessions/${sessionId}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error || 'Failed');
      }
      const data = (await res.json()) as {
        session: { transcript: Turn[]; status: Status };
        endNow: boolean;
      };
      setTranscript(data.session.transcript);
      setInput('');
      if (data.endNow) {
        await finalize();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/training/sessions/${sessionId}/finalize`, {
        method: 'POST',
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error || 'Analyze failed');
      }
      const data = (await res.json()) as {
        analysis: SpinAnalysis;
      };
      setAnalysis(data.analysis);
      setStatus('completed');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analyze failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <header className="rounded-lg bg-neutral-50 p-4">
        <div className="text-xs uppercase tracking-wide text-neutral-500">Клиент</div>
        <h1 className="text-xl font-semibold">{personaName}</h1>
        <p className="mt-1 text-sm text-neutral-600">{personaDescription}</p>
      </header>

      <ol className="space-y-2">
        {transcript.map((t, i) => (
          <li
            key={i}
            className={
              t.role === 'agent'
                ? 'ml-12 rounded-lg bg-brand-500 p-3 text-white'
                : 'mr-12 rounded-lg border bg-white p-3 text-neutral-800'
            }
          >
            <div className="text-xs uppercase opacity-70">
              {t.role === 'agent' ? 'Вы (агент)' : personaName}
            </div>
            <div className="mt-1 whitespace-pre-wrap">{t.text}</div>
          </li>
        ))}
        <div ref={endRef} />
      </ol>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {status === 'in_progress' && (
        <div className="rounded-lg bg-white p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ответ агента..."
            rows={3}
            data-testid="agent-input"
            className="w-full resize-none rounded border border-neutral-300 px-3 py-2"
          />
          <div className="mt-2 flex justify-between">
            <button
              type="button"
              onClick={finalize}
              disabled={busy}
              data-testid="finalize"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
            >
              Завершить и разобрать
            </button>
            <button
              type="button"
              onClick={sendTurn}
              disabled={busy || !input.trim()}
              data-testid="send"
              className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? '...' : 'Отправить →'}
            </button>
          </div>
        </div>
      )}

      {analysis && (
        <div className="space-y-3 rounded-lg bg-amber-50 p-5">
          <h2 className="text-lg font-semibold">Разбор по SPIN</h2>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Metric label="Situation" value={analysis.situation} />
            <Metric label="Problem" value={analysis.problem} />
            <Metric label="Implication" value={analysis.implication} />
            <Metric label="Need-payoff" value={analysis.needPayoff} />
          </div>
          <div className="rounded-lg bg-white p-3 text-center">
            <div className="text-xs uppercase text-neutral-500">Общий балл</div>
            <div className="text-3xl font-semibold">{analysis.score}/10</div>
          </div>
          <div className="rounded-lg bg-white p-3">
            <div className="text-xs uppercase text-neutral-500">Рекомендация</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">
              {analysis.feedback}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white p-2 text-center">
      <div className="text-xs uppercase text-neutral-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
