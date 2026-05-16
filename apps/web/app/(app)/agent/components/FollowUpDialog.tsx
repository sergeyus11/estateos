'use client';

import { useEffect, useRef } from 'react';
import { MicRecorder } from './MicRecorder';

type RefineResponse = {
  fields: {
    object: string | null;
    client: string | null;
    budget: string | null;
    reaction: string | null;
    nextStep: string | null;
  };
  followUpQuestion: string | null;
  maxReached: boolean;
};

export function FollowUpDialog({
  reportId,
  question,
  onAnswered,
}: {
  reportId: string;
  question: string;
  onAnswered: (data: RefineResponse) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.play().catch(() => {});
  }, [reportId]);

  async function uploadAnswer(fd: FormData) {
    fd.append('reportId', reportId);
    const res = await fetch('/api/reports/refine', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Refine failed');
    const data = (await res.json()) as RefineResponse;
    onAnswered(data);
  }

  return (
    <div className="space-y-3 rounded-lg bg-yellow-50 p-4">
      <p className="text-sm font-medium text-amber-900">AI спрашивает:</p>
      <p className="text-base">{question}</p>
      <audio
        ref={audioRef}
        src={`/api/reports/${reportId}/follow-up-audio`}
        preload="auto"
        controls
        className="w-full"
      />
      <MicRecorder onUpload={uploadAnswer} buttonLabel="🎤 Ответить голосом" reportId={reportId} />
    </div>
  );
}
