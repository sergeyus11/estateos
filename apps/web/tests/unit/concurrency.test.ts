import { describe, expect, it } from 'vitest';
import { runWithConcurrency } from '@/lib/concurrency';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('runWithConcurrency', () => {
  it('caps concurrent work at the requested limit', async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    await runWithConcurrency([1, 2, 3, 4, 5, 6], 3, async (item) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await delay(30);
      inFlight -= 1;
      return item;
    });

    expect(maxInFlight).toBe(3);
  });

  it('preserves result positions for input items', async () => {
    const results = await runWithConcurrency([10, 20, 30, 40], 2, async (item, idx) => {
      await delay(40 - idx * 5);
      return `${idx}:${item}`;
    });

    expect(results).toEqual(['0:10', '1:20', '2:30', '3:40']);
  });

  it('returns an empty array for empty input', async () => {
    await expect(runWithConcurrency([], 3, async (item) => item)).resolves.toEqual([]);
  });

  it('handles a single item when concurrency is higher than item count', async () => {
    const results = await runWithConcurrency(['only'], 3, async (item) => `${item}:done`);

    expect(results).toEqual(['only:done']);
  });

  it('rejects when a worker function throws', async () => {
    await expect(
      runWithConcurrency([1, 2, 3], 2, async (item) => {
        if (item === 2) {
          throw new Error('boom');
        }
        await delay(10);
        return item;
      })
    ).rejects.toThrow('boom');
  });
});
