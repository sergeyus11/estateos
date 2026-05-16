'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  { title: 'Привет, {{name}}!', body: 'Здесь ты записываешь показы голосом.' },
  {
    title: 'Как это работает',
    body: 'После показа — нажми красную кнопку и расскажи коротко: ЖК, клиент, бюджет, реакция, следующий шаг.',
  },
  {
    title: 'Установи на главный экран',
    body: 'Чтобы было как настоящее приложение — добавь EstateOS на главный экран телефона.',
  },
];

const KEY = 'estateos:onboarding:done';

export function OnboardingOverlay({ firstName }: { firstName: string | null }) {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(KEY)) setShow(true);
  }, []);

  if (!show) return null;
  const s = STEPS[step];
  const name = firstName || 'агент';

  function close() {
    localStorage.setItem(KEY, 'true');
    setShow(false);
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else close();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-6 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-2xl font-semibold">{s.title.replace('{{name}}', name)}</h3>
        <p className="mt-3 text-neutral-600">{s.body}</p>
        <div className="mt-6 flex justify-between text-sm">
          <button onClick={close} className="text-neutral-500">
            Пропустить
          </button>
          <button
            onClick={next}
            data-testid="onboarding-next"
            className="rounded-lg bg-brand-500 px-5 py-2 text-white font-medium"
          >
            {step < STEPS.length - 1 ? 'Дальше' : 'Понятно'}
          </button>
        </div>
        <div className="mt-3 flex justify-center gap-1">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full ${
                i === step ? 'bg-brand-500' : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
