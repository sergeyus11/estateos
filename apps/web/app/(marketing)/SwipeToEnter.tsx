'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * iOS-style slide-to-unlock for the nav pill: «свайпните чтобы войти».
 * Pointer Events API → одинаково работает с touch и мышью.
 * Если drag не доходит до ~85% — thumb пружинит назад.
 * На клик (без drag) и Enter/Space с клавиатуры — обычный переход на /login,
 * чтобы оставаться accessible.
 */
export function SwipeToEnter({
  href = '/login',
  label = 'свайп для входа',
}: {
  href?: string;
  label?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLButtonElement>(null);
  const [x, setX] = useState(0);
  const [maxX, setMaxX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const startRef = useRef<{ pointerX: number; offset: number } | null>(null);

  const recalcMax = useCallback(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;
    // 4px padding каждый край — соответствует CSS .swipe__track
    setMaxX(Math.max(0, track.clientWidth - thumb.offsetWidth - 8));
  }, []);

  useEffect(() => {
    recalcMax();
    const ro = new ResizeObserver(recalcMax);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [recalcMax]);

  const finish = useCallback(() => {
    setDone(true);
    setX(maxX);
    // короткая анимация completion, потом navigate
    setTimeout(() => {
      window.location.href = href;
    }, 220);
  }, [href, maxX]);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (done) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startRef.current = { pointerX: e.clientX, offset: x };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging || !startRef.current || done) return;
    const dx = e.clientX - startRef.current.pointerX;
    const next = Math.min(maxX, Math.max(0, startRef.current.offset + dx));
    setX(next);
    if (next >= maxX * 0.85) {
      setDragging(false);
      startRef.current = null;
      finish();
    }
  };

  const releaseDrag = (e?: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    if (e) {
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    }
    setDragging(false);
    startRef.current = null;
    // если не дотянул до 85% — пружинит назад
    if (x < maxX * 0.85) setX(0);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      finish();
    }
  };

  const progress = maxX > 0 ? x / maxX : 0;

  return (
    <div
      ref={trackRef}
      className={'swipe' + (done ? ' is-done' : '') + (dragging ? ' is-dragging' : '')}
      style={{
        // прогрессивная заливка terracotta tint по мере свайпа
        ['--swipe-progress' as string]: progress.toFixed(3),
      }}
      aria-label="Свайпните вправо чтобы войти"
    >
      <span className="swipe__label" aria-hidden="true">
        {label}
        <svg className="swipe__hint" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </span>

      <button
        ref={thumbRef}
        type="button"
        className="swipe__thumb"
        style={{ transform: `translateX(${x}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => releaseDrag(e)}
        onPointerCancel={(e) => releaseDrag(e)}
        onKeyDown={onKeyDown}
        aria-label="Войти в EstateOS"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
