'use client';

import { useState } from 'react';

function HouseIcon() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: 'prev' | 'next' }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === 'prev' ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}

export function PhotoCarousel({ photos }: { photos: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const hasPhotos = photos.length > 0;
  const canPage = photos.length > 1;

  function showPrev() {
    setCurrentIndex((index) => (index === 0 ? photos.length - 1 : index - 1));
  }

  function showNext() {
    setCurrentIndex((index) => (index + 1) % photos.length);
  }

  function handleTouchEnd(x: number) {
    if (touchStartX === null || !canPage) return;
    const deltaX = touchStartX - x;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) showNext();
      else showPrev();
    }
    setTouchStartX(null);
  }

  if (!hasPhotos) {
    return (
      <div
        style={{
          height: 280,
          borderRadius: 18,
          background: 'var(--bg-soft)',
          color: 'var(--brand-700)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--line)',
        }}
      >
        <HouseIcon />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{ position: 'relative' }}
        onTouchStart={(e) => setTouchStartX(e.changedTouches[0]?.clientX ?? null)}
        onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0]?.clientX ?? 0)}
      >
        <img
          src={photos[currentIndex]}
          alt=""
          className="w-full h-64 object-cover rounded-xl"
          style={{ background: 'var(--bg-soft)' }}
        />

        {canPage && (
          <>
            <button
              type="button"
              aria-label="Предыдущее фото"
              onClick={showPrev}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 36,
                height: 36,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.86)',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowIcon direction="prev" />
            </button>
            <button
              type="button"
              aria-label="Следующее фото"
              onClick={showNext}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 36,
                height: 36,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.86)',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowIcon direction="next" />
            </button>
          </>
        )}
      </div>

      {canPage && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {photos.map((photo, index) => (
            <button
              key={`${photo}-${index}`}
              type="button"
              aria-label={`Фото ${index + 1}`}
              onClick={() => setCurrentIndex(index)}
              style={{
                width: index === currentIndex ? 18 : 6,
                height: 6,
                borderRadius: 999,
                background: index === currentIndex ? 'var(--brand-500)' : 'var(--ink-4)',
                transition: 'width 0.16s var(--ease), background 0.16s var(--ease)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
