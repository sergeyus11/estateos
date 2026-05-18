'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { MicRecorder } from './MicRecorder';

type ParsedEventPreview = {
  event_type: 'showing' | 'meeting' | 'call' | 'task';
  title: string;
  scheduled_at_iso: string;
  duration_min: number;
  client_match: { id: string } | { suggested_name: string } | null;
  object_match: { id: string } | { suggested_title: string } | null;
  address: string | null;
  confidence: number;
};

type VoiceResult =
  | { intent: 'create_event'; transcript: string; preview: ParsedEventPreview }
  | { intent: 'unclear'; transcript: string; reason: string };

type Props = {
  onClose: () => void;
  onEventCreated?: () => void;
};

const EVENT_TYPE_LABELS: Record<ParsedEventPreview['event_type'], string> = {
  showing: 'Показ',
  meeting: 'Встреча',
  call: 'Звонок',
  task: 'Задача',
};

function formatScheduled(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    });
  } catch {
    return iso;
  }
}

function getClientLabel(match: ParsedEventPreview['client_match']): string | null {
  if (!match) return null;
  if ('id' in match) return `Клиент #${match.id}`;
  return match.suggested_name;
}

function getObjectLabel(match: ParsedEventPreview['object_match']): string | null {
  if (!match) return null;
  if ('id' in match) return `Объект #${match.id}`;
  return match.suggested_title;
}

export function FabVoiceModal({ onClose, onEventCreated }: Props) {
  const [voiceResult, setVoiceResult] = useState<VoiceResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(formData: FormData) {
    setError(null);
    const res = await fetch('/api/voice/command', { method: 'POST', body: formData });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? 'Voice command failed');
    }
    const data = (await res.json()) as VoiceResult;
    setVoiceResult(data);
  }

  async function handleConfirm() {
    if (!voiceResult || voiceResult.intent !== 'create_event') return;

    const { preview } = voiceResult;
    setConfirming(true);
    setError(null);
    try {
      const payload = {
        eventType: preview.event_type,
        title: preview.title,
        scheduledAt: preview.scheduled_at_iso,
        durationMin: preview.duration_min,
        clientId: preview.client_match && 'id' in preview.client_match ? preview.client_match.id : null,
        objectId: preview.object_match && 'id' in preview.object_match ? preview.object_match.id : null,
        address: preview.address,
        source: 'voice' as const,
      };
      const res = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Create failed');
      }
      onEventCreated?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка создания события');
    } finally {
      setConfirming(false);
    }
  }

  function handleRetry() {
    setVoiceResult(null);
    setError(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl bg-[#FAF7F4] p-6 pb-10"
        style={{ borderRadius: '16px 16px 0 0' }}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2
              className="text-lg font-semibold text-gray-900"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Голосовое событие
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-full text-xl leading-none text-gray-400 hover:bg-white hover:text-gray-600"
              aria-label="Закрыть"
            >
              <X className="mx-auto h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {!voiceResult && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Скажите: «Поставь показ Иванову завтра в 15 на Чкалова 22»
              </p>
              <MicRecorder onUpload={handleUpload} buttonLabel="Нажмите и говорите" />
            </div>
          )}

          {voiceResult && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">Распознано: «{voiceResult.transcript}»</p>

              {voiceResult.intent === 'create_event' && (
                <div
                  className="space-y-2 rounded-2xl p-4"
                  style={{ background: '#FFF8F5', border: '1px solid #F5C5A8' }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ background: '#C8613A' }}
                    >
                      {EVENT_TYPE_LABELS[voiceResult.preview.event_type]}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {voiceResult.preview.title}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatScheduled(voiceResult.preview.scheduled_at_iso)}
                  </p>
                  {getClientLabel(voiceResult.preview.client_match) && (
                    <p className="text-xs text-gray-500">
                      Клиент: {getClientLabel(voiceResult.preview.client_match)}
                    </p>
                  )}
                  {getObjectLabel(voiceResult.preview.object_match) && (
                    <p className="text-xs text-gray-500">
                      Объект: {getObjectLabel(voiceResult.preview.object_match)}
                    </p>
                  )}
                  {voiceResult.preview.address && (
                    <p className="text-xs text-gray-500">Адрес: {voiceResult.preview.address}</p>
                  )}
                </div>
              )}

              {voiceResult.intent === 'unclear' && (
                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">{voiceResult.reason}</p>
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3">
                {voiceResult.intent === 'create_event' && (
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="flex-1 rounded-2xl py-3 text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: '#C8613A' }}
                  >
                    {confirming ? 'Создаю...' : 'Подтвердить'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex-1 rounded-2xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700"
                >
                  {voiceResult.intent === 'unclear' ? 'Попробовать снова' : 'Изменить'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-2xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
