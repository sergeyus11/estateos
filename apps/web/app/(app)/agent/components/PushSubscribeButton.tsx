'use client';

import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export function PushSubscribeButton() {
  const [state, setState] = useState<'idle' | 'subscribed' | 'denied' | 'unsupported'>('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    navigator.serviceWorker.ready
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub) setState('subscribed');
      })
      .catch(() => {});
  }, []);

  async function subscribe() {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = (await fetch('/api/push/vapid-public').then((r) => r.json())) as {
        publicKey: string;
      };
      if (!publicKey) return;
      const keyArray = urlBase64ToUint8Array(publicKey);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyArray.buffer.slice(
          keyArray.byteOffset,
          keyArray.byteOffset + keyArray.byteLength
        ) as ArrayBuffer,
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      setState('subscribed');
    } catch {
      setState('denied');
    }
  }

  if (state === 'subscribed') return <p className="text-xs text-green-700">✓ напоминания включены</p>;
  if (state === 'unsupported') return null;
  if (state === 'denied')
    return <p className="text-xs text-amber-700">Разрешите уведомления в настройках браузера</p>;
  return (
    <button
      onClick={subscribe}
      data-testid="push-subscribe"
      className="text-xs text-brand-500 underline"
    >
      Включить напоминания о записи показов
    </button>
  );
}
