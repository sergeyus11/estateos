'use client';

import { useState } from 'react';
import { signIn } from '@/lib/auth-client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      await signIn.magicLink({ email, callbackURL: '/admin' });
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-3xl font-semibold">Войти в EstateOS</h1>

      {status === 'sent' ? (
        <p className="mt-8 rounded-lg bg-green-50 p-4 text-green-800">
          Ссылка для входа отправлена на <strong>{email}</strong>. Проверьте почту.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-3"
              data-testid="email-input"
            />
          </label>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full rounded-lg bg-brand-500 px-6 py-3 text-white font-medium hover:bg-brand-700 disabled:opacity-50"
            data-testid="submit"
          >
            {status === 'sending' ? 'Отправляем...' : 'Получить ссылку'}
          </button>
          {errorMsg && (
            <p className="text-sm text-red-600" data-testid="error">{errorMsg}</p>
          )}
        </form>
      )}
    </main>
  );
}
