'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Persona = {
  id: string;
  name: string;
  description: string;
  ageHint: string | null;
  budgetHint: string | null;
  isStock: boolean;
};

type Recent = {
  id: string;
  personaId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  score: number | null;
  turns: number;
  createdAt: string;
};

export function TrainingHome({
  personas,
  recent,
}: {
  personas: Persona[];
  recent: Recent[];
}) {
  const router = useRouter();
  const [starting, setStarting] = useState<string | null>(null);

  async function start(personaId: string) {
    setStarting(personaId);
    try {
      const res = await fetch('/api/training/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId }),
      });
      if (!res.ok) throw new Error('Start failed');
      const { session } = (await res.json()) as { session: { id: string } };
      router.push(`/agent/training/${session.id}` as never);
    } catch (e) {
      setStarting(null);
      alert(e instanceof Error ? e.message : 'Failed');
    }
  }

  return (
    <div className="space-y-8">
      <Link href={'/agent' as never} className="text-sm text-neutral-500 hover:underline">
        ← к показам
      </Link>
      <h1 className="text-2xl font-semibold">SPIN-тренажёр</h1>
      <p className="text-neutral-600">
        Выбери типаж клиента и потренируйся вести диалог. После окончания получишь разбор по SPIN-методологии.
      </p>

      <section>
        <h2 className="text-lg font-semibold">Типажи клиентов</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => start(p.id)}
              disabled={starting !== null}
              data-testid={`persona-${p.id}`}
              className="rounded-lg border bg-white p-4 text-left transition hover:border-brand-500 disabled:opacity-50"
            >
              <div className="text-base font-semibold">{p.name}</div>
              <div className="mt-1 text-sm text-neutral-600">{p.description}</div>
              {(p.ageHint || p.budgetHint) && (
                <div className="mt-2 text-xs text-neutral-400">
                  {p.ageHint} · {p.budgetHint}
                </div>
              )}
              {starting === p.id && <p className="mt-2 text-xs text-brand-500">Запускаю...</p>}
            </button>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Мои сессии</h2>
          <ul className="mt-3 space-y-2">
            {recent.map((r) => {
              const p = personas.find((x) => x.id === r.personaId);
              return (
                <li key={r.id}>
                  <Link
                    href={`/agent/training/${r.id}` as never}
                    className="block rounded-lg border bg-white p-3 text-sm hover:bg-neutral-50"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium">{p?.name || r.personaId}</span>
                      <span className="text-xs text-neutral-500">
                        {r.status === 'completed'
                          ? `★ ${r.score ?? '—'}/10`
                          : r.status === 'in_progress'
                          ? 'в процессе'
                          : 'оставлено'}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {r.turns} реплик · {new Date(r.createdAt).toLocaleString('ru-RU')}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
