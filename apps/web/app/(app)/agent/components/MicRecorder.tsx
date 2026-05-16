'use client';

import { useEffect, useRef, useState } from 'react';

type State = 'idle' | 'recording' | 'stopping' | 'uploading' | 'error';

type Props = {
  onUpload: (formData: FormData) => Promise<void>;
  buttonLabel?: string;
  reportId?: string;
};

export function MicRecorder({ onUpload, buttonLabel = 'Записать показ', reportId }: Props) {
  const [state, setState] = useState<State>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTsRef = useRef(0);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (recRef.current?.state === 'recording') recRef.current.stop();
    };
  }, []);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setState('uploading');
        try {
          const fd = new FormData();
          fd.append('audio', blob, 'show.webm');
          if (reportId) fd.append('reportId', reportId);
          await onUpload(fd);
          setState('idle');
          setSeconds(0);
        } catch (err) {
          setState('error');
          setError(err instanceof Error ? err.message : 'Upload failed');
        }
      };
      mr.start();
      recRef.current = mr;
      setState('recording');
      startTsRef.current = Date.now();
      tickRef.current = setInterval(
        () => setSeconds(Math.floor((Date.now() - startTsRef.current) / 1000)),
        250
      );
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : 'Mic denied');
    }
  }

  function stop() {
    if (recRef.current?.state === 'recording') {
      setState('stopping');
      if (tickRef.current) clearInterval(tickRef.current);
      recRef.current.stop();
    }
  }

  const display =
    state === 'recording'
      ? `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
      : state === 'uploading'
      ? 'Расшифровываю...'
      : state === 'stopping'
      ? 'Останавливаю...'
      : buttonLabel;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={state === 'recording' ? stop : start}
        disabled={state === 'uploading' || state === 'stopping'}
        data-testid="mic-button"
        className={`block w-full rounded-2xl py-6 text-2xl font-semibold transition ${
          state === 'recording'
            ? 'bg-red-600 text-white animate-pulse'
            : state === 'uploading' || state === 'stopping'
            ? 'bg-neutral-300 text-neutral-600'
            : 'bg-brand-500 text-white hover:bg-brand-700'
        }`}
      >
        {state === 'recording' ? `⏹  ${display}` : display}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
