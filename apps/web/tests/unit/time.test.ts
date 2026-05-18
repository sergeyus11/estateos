import { describe, it, expect } from 'vitest';
import { mskDayBounds } from '@/lib/time';

describe('mskDayBounds', () => {
  it('returns correct bounds for 10:30 UTC (13:30 MSK) on 2026-05-18', () => {
    const now = new Date('2026-05-18T10:30:00.000Z');
    const { mskStart, mskEnd, todayStr } = mskDayBounds(now);
    expect(mskStart.toISOString()).toBe('2026-05-17T21:00:00.000Z');
    expect(mskEnd.toISOString()).toBe('2026-05-18T21:00:00.000Z');
    expect(todayStr).toBe('2026-05-18');
  });

  it('returns correct bounds at 23:59:59.999 MSK on 2026-05-18 (still same day)', () => {
    const now = new Date('2026-05-18T20:59:59.999Z');
    const { mskStart, mskEnd, todayStr } = mskDayBounds(now);
    expect(todayStr).toBe('2026-05-18');
    expect(mskStart.toISOString()).toBe('2026-05-17T21:00:00.000Z');
    expect(mskEnd.toISOString()).toBe('2026-05-18T21:00:00.000Z');
  });

  it('returns next MSK day 1ms after MSK midnight (2026-05-18T21:00:00.001Z = 00:00:00.001 MSK 2026-05-19)', () => {
    const now = new Date('2026-05-18T21:00:00.001Z');
    const { todayStr } = mskDayBounds(now);
    expect(todayStr).toBe('2026-05-19');
  });

  it('mskEnd - mskStart === 24 hours for arbitrary now', () => {
    const now = new Date('2026-05-18T10:30:00.000Z');
    const { mskStart, mskEnd } = mskDayBounds(now);
    expect(mskEnd.getTime() - mskStart.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it('returns now unchanged', () => {
    const now = new Date('2026-05-18T10:30:00.000Z');
    const result = mskDayBounds(now);
    expect(result.now).toBe(now);
  });
});
