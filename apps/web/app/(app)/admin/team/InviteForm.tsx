'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: firstName || undefined,
          telegramUsername: telegramUsername || undefined,
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error || 'Failed');
      }
      setStatus('sent');
      setEmail('');
      setFirstName('');
      setTelegramUsername('');
      router.refresh();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown');
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 max-w-md space-y-3 rounded-lg bg-white p-4">
      <label className="block">
        <span className="text-sm font-medium">Email *</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          data-testid="invite-email"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Имя</span>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Telegram username</span>
        <input
          type="text"
          placeholder="@ivanov"
          value={telegramUsername}
          onChange={(e) => setTelegramUsername(e.target.value)}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={status === 'sending'}
        data-testid="invite-submit"
        className="rounded-lg bg-brand-500 px-5 py-2 text-white font-medium hover:bg-brand-700 disabled:opacity-50"
      >
        {status === 'sending' ? 'Отправляю...' : 'Пригласить'}
      </button>
      {status === 'sent' && <p className="text-sm text-green-700">Приглашение отправлено</p>}
      {status === 'error' && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
