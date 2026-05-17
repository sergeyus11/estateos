'use client';
import { useEffect, useRef } from 'react';

export function NarratorPlayer({ narrativeId, audioSrc }: { narrativeId: string; audioSrc: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onPlay = () => {
      fetch(`/api/admin/narratives/${narrativeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-listened' }),
      }).catch(() => {});
    };
    el.addEventListener('play', onPlay, { once: true });
    return () => el.removeEventListener('play', onPlay);
  }, [narrativeId]);

  return (
    <audio
      ref={ref}
      controls
      preload="metadata"
      src={audioSrc}
      style={{ width: '100%', marginTop: 8 }}
      data-testid="narrator-audio"
    />
  );
}
